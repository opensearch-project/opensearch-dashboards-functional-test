#!/bin/bash

set -e

REPO="$1"
UNIQUE_WORKFLOW_ID="$2"
API_URL="$3"
exitcode=2

# Function to check the status of the remote github workflow by constantly polling the workflow-run
check_remote_workflow_status() {
    local run_id
    local status
    local conclusion
    local run_details
    local workflow_runs
    local matching_workflow
    local polling_run_id_retries=1
    local polling_workflow_completion_retries=1
    local max_polling_run_id_retries=5  # Keep polling for the first 5 minutes to fetch the workflow run id till the workflow gets generated
    local max_polling_workflow_completion_retries=12 # Set the polling window period to be 1 hour

    # Check if a matching workflow object was found
    while [ -z "$matching_workflow" ] && [ $polling_run_id_retries -le $max_polling_run_id_retries ]; do
        echo "Querying for the workflow run id..."
        sleep 60  # Wait for 1 minute before polling for the workflow run_id till it gets created
        
        # Make a GET request to the GitHub API to get the list of workflow runs
        workflow_runs=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
                    -H "Accept: application/vnd.github.v3+json" \
                    -H "X-GitHub-Api-Version: 2022-11-28" \
                    "$API_URL/runs")

        # Extract the JSON object whose "name" field contains the string with a unique id of the workflow
        matching_workflow=$(echo "$workflow_runs" | jq --arg unique_id "$UNIQUE_WORKFLOW_ID" '.workflow_runs[] | select(.name | contains($unique_id))')
        ((polling_run_id_retries++))
        
    done
    echo "matching_workflow: $matching_workflow"

    if [ -n "$matching_workflow" ]; then
        # Extract the "jobs_url" and "run_id" values from the matching object
        jobs_url=$(echo "$matching_workflow" | jq -r '.jobs_url')
        run_id=$(echo "$matching_workflow" | jq -r '.id')
        echo "Jobs URL: $jobs_url"
        echo "Run Id: $run_id"

        # Poll the status until the workflow is completed
        while [ $polling_workflow_completion_retries -le $max_polling_workflow_completion_retries ]; do
            echo "Checking the workflow run API status, attempt: $polling_workflow_completion_retries"

            run_details=$(curl -L -H "Authorization: Bearer $GITHUB_TOKEN" \
                            -H "Accept: application/vnd.github.v3+json" \
                            -H "X-GitHub-Api-Version: 2022-11-28" \
                            "https://api.github.com/repos/$REPO/actions/runs/$run_id")
            
            # Extract status and conclusion from the run details
            status=$(echo "$run_details" | jq -r ".status")
            conclusion=$(echo "$run_details" | jq -r ".conclusion")

            echo "Workflow run status: $status" 

            # Check if the status indicates that the workflow is complete
            if [[ "$status" == "completed" ]]; then
                echo "Workflow completed with status: $status"

                # Check if it was successful
                if [[ $conclusion == "success" ]]; then
                    echo "Remote workflow completed successfully."
                    exitcode=0  # Success
                    break;
                elif [[ $conclusion == "failure" ]]; then
                    echo "Remote workflow completed with errors. Conclusion: $conclusion"

                    job_details=$(curl -L -H "Authorization: Bearer $GITHUB_TOKEN" \
                            -H "Accept: application/vnd.github.v3+json" \
                            -H "X-GitHub-Api-Version: 2022-11-28" \
                            "$jobs_url")

                    # Parse the workflow to find any failures in the test
                    failures=$(echo "$job_details" | jq -r '.jobs[] | select(.conclusion == "failure") | .name')
                    echo "Test failures: $failures"

                    exitcode=1  # Failure
                    break;
                else
                    echo "Remote workflow completed with unexpected conclusion. Conclusion: $conclusion"
                    exitcode=1  # Failure
                    break;
                fi
            else
                echo "Remote workflow is still running. Waiting..."
                sleep 300  # Wait for 5 minutes before checking again
                ((polling_workflow_completion_retries++))
            fi
        done
    else
        echo "No matching workflow run object found even after retries. Exiting..."
        exitcode=1 # Failure  
    fi

    if [ "$exitcode" -eq 2 ]; then
        echo "Remote workflow didn't complete within the specified time."
    fi
}

check_remote_workflow_status
