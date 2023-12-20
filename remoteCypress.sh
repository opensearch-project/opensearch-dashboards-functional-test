#!/bin/bash

set -e

function usage() {
    echo ""
    echo "This script triggers GitHub workflow runners within the component repository which runs Cypress integration tests on a remote OpenSearch/Dashboards cluster."
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo "Required arguments:"
    echo -e "-r REPO\t, Name of the repository in {owner}/{repository} format"
    echo -e "-w GITHUB_WORKFLOW_NAME\t, Name of the GitHub workflow file name with .yml extension that contain jobs that run Cypress tests in the component repository. For example, main.yaml"
    echo -e "-o OS_URL\t, Release artifact of the OpenSearch"
    echo -e "-d OSD_URL\t, Release artifact of the OpenSearch Dashboards"
    echo -e "-b BRANCH_REF\t Test Branch name or commit reference id"
    echo -e "-i BUILD_ID\t Release-specific build id for reference"
    echo "--------------------------------------------------------------------------"
}

# Parse command-line arguments
while getopts ":h:r:w:o:d:b:i:" opt; do
  case $opt in
    h)
      usage
      exit 1
      ;;
    r)
      REPO="$OPTARG"
      ;;
    w)
      WORKFLOW_NAME="$OPTARG"
      ;;
    o)
      OS_URL="$OPTARG"
      ;;
    d)
      OSD_URL="$OPTARG"
      ;;
    b)
      BRANCH_REF="$OPTARG"
      ;;
    i)
      BUILD_ID="$OPTARG"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

# Check if required arguments are provided
if [[ -z "$REPO" || -z "$WORKFLOW_NAME" || -z "$OS_URL" || -z "$OSD_URL" || -z "$BRANCH_REF" ]]; then
    echo "Error: Missing required arguments. See usage below."
    usage
    exit 1
fi

# Accessing the secret as an environment variable using Github actions while invoking this script
GITHUB_TOKEN=$GITHUB_SECRET_TOKEN
# This is to uniquely identify each execution workflow. This ID has to be appended to the workflow_run 
# name in the component repository yaml file for polling purpose. 
UNIQUE_WORKFLOW_ID=$(uuidgen)
echo "Unique Execution ID: $UNIQUE_WORKFLOW_ID"
# For now we are using Github action API to trigger github workflows in plugins component
# ToDo: We can explore other test runners such as Jenkins to integrate with.
API_URL="https://api.github.com/repos/$REPO/actions/workflows/$WORKFLOW_NAME"
PAYLOAD="{\"ref\": \"$BRANCH_REF\",\"inputs\":{\"build_id\":\"$BUILD_ID\", \"OS_URL\":\"$OS_URL\", \"OSD_URL\":\"$OSD_URL\", \"UNIQUE_ID\":\"$UNIQUE_WORKFLOW_ID\"}}" 

# Maximum number of retries for triggering the remote runner
MAX_RETRIES=3

# Trigger the remote GitHub workflow using curl and the PAT token
trigger_remote_workflow() {
    curl -L -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        -w "%{http_code}" \
        "$API_URL/dispatches" -d "$PAYLOAD"
}

echo "Triggering the remote GitHub workflow for Cypress tests in the repository: $REPO"

# Attempt to trigger the remote workflow with retries
for ((i = 1; i <= MAX_RETRIES; i++)); do
    echo "Attempting to trigger the remote workflow (Attempt $i)"
    status_code=$(trigger_remote_workflow)
    echo "status_code: $status_code"

    if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
        echo "Remote workflow triggered successfully."
        break
    else
        echo "Failed to trigger the remote workflow. Retrying..."
        sleep 10  # Adds a delay between retries
    fi

    if [ $i -eq $MAX_RETRIES ]; then
        echo "Maximum number of retries reached. Exiting."
        exit 1
    fi
done


# Check the status of the remote workflow
source ./poll_remote_workflow.sh "$REPO" "$UNIQUE_WORKFLOW_ID" "$API_URL"
echo "Return code: $?"

exit 0
