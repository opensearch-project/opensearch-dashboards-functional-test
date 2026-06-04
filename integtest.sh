#!/bin/bash

set -e

. ./browser_downloader.sh

function usage() {
    echo ""
    echo "This script is used to run integration tests for plugin installed on a remote OpenSearch/Dashboards cluster."
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo ""
    echo "Required arguments:"
    echo "None"
    echo ""
    echo "Optional arguments:"
    echo -e "-b BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 9200 or 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-s SECURITY_ENABLED\t(true | false), defaults to true. Specify the OpenSearch/Dashboards have security enabled or not."
    echo -e "-c CREDENTIAL\t(usename:password), no defaults, effective when SECURITY_ENABLED=true."
    echo -e "-t TEST_COMPONENTS\t(OpenSearch-Dashboards reportsDashboards etc.), optional, specify test components, separate with space, else test everything."
    echo -e "-v VERSION\t, no defaults, indicates the OpenSearch version to test."
    echo -e "-o OPTION\t, no defaults, determine the TEST_TYPE value among(default, manifest) in test_finder.sh, optional."
    echo -e "-r REMOTE_CYPRESS_ENABLED\t(true | false), defaults to true. Feature flag set to specify remote cypress orchestrator runs are enabled or not."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":hb:p:s:c:t:v:o:r:" arg; do
    case $arg in
        h)
            usage
            exit 1
            ;;
        b)
            BIND_ADDRESS=$OPTARG
            ;;
        p)
            BIND_PORT=$OPTARG
            ;;
        s)
            SECURITY_ENABLED=$OPTARG
            ;;
        c)
            CREDENTIAL=$OPTARG
            ;;
        t)
            TEST_COMPONENTS=$OPTARG
            ;;
        v)
            VERSION=$OPTARG
            ;;
        o)
            OPTION=$OPTARG
            ;;
        r)
            REMOTE_CYPRESS_ENABLED=$OPTARG
            ;;
        :)
            echo "-${OPTARG} requires an argument"
            usage
            exit 1
            ;;
        ?)
            echo "Invalid option: -${OPTARG}"
            exit 1
            ;;
    esac
done


if [ -z "$BIND_ADDRESS" ]
then
  BIND_ADDRESS="localhost"
fi

if [ -z "$BIND_PORT" ]
then
  BIND_PORT="5601"
fi

if [ -z "$SECURITY_ENABLED" ]
then
  SECURITY_ENABLED="true"
fi

if [ -z "$REMOTE_CYPRESS_ENABLED" ]
then
  REMOTE_CYPRESS_ENABLED="true"
fi

if [ -z "$CREDENTIAL" ]
then
  # Starting in 2.12.0, security demo configuration script requires an initial admin password
  CREDENTIAL="admin:myStrongPassword123!"
fi

USERNAME=`echo $CREDENTIAL | awk -F ':' '{print $1}'`
PASSWORD=`echo $CREDENTIAL | awk -F ':' '{print $2}'`

# User can send custom browser path through env variable
if [ -z "$BROWSER_PATH" ]
then
    # chromium@1108766 is version 112 with revision r1108766
    # Please keep this version until cypress upgrade or test will freeze: https://github.com/opensearch-project/opensearch-build/issues/4241
    BROWSER_PATH=`download_chromium | head -n 1 | cut -d ' ' -f1`
fi

. ./test_finder.sh

# Windows have issues installing cypress in parallel (during integTest) by design
# And is not baked in images due to slow startup time
# We are forcing the installation from opensearch ci bucket
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "cygwin" ] || [ "$OSTYPE" = "win32" ]; then
    CYPRESS_INSTALL_BINARY=https://ci.opensearch.org/ci/dbc/tools/Cypress-9.5.4-x64-windows.zip npm install cypress
fi

npm install

TEST_FILES=`get_test_list $TEST_COMPONENTS`
TEST_FILES=`echo $TEST_FILES | tr ',' ' '`
echo "Test Files List: $TEST_FILES"
echo "BROWSER_PATH: $BROWSER_PATH"

# Can be used as Jenkins environment variable set for the orchestrator feature flag, default: true
ORCHESTRATOR_FEATURE_FLAG=${ORCHESTRATOR_FEATURE_FLAG:-true}

# Read inputs from the manifest file for remote cypress orchestrator
REMOTE_MANIFEST_FILE="remote_cypress_manifest.json"

# PID file to store remote cypress workflow background processes IDs when run in parallel
pid_file="process_ids.txt"

run_remote_cypress() {
    local repo="$1"
    local workflow_name="$2"
    local os_url="$3"
    local osd_url="$4"
    local branch_ref="$5"

    # Call the remoteCypress.sh script with the required arguments
    source remoteCypress.sh -r "$repo" -w "$workflow_name" -o "$os_url" -d "$osd_url" -b "$branch_ref" &
    bg_process_pid=$!
    echo "PID for the repo $repo is : $bg_process_pid"
    echo "$bg_process_pid" >> "$pid_file"
}

# Helper function to extract information from a component and return a tuple
get_component_info() {
    local component="$1"
    local repo workflow_name os_url osd_url branch_ref release_version os arch

    release_version=$(jq -r '.build.version' "$REMOTE_MANIFEST_FILE")
    repo=$(echo "$component" | jq -r '.["repository"]')
    workflow_name=$(echo "$component" | jq -r '.["workflow-name"]')
    os=$(echo "$component" | jq -r '.["operating-system"]')
    arch=$(echo "$component" | jq -r '.["arch"]')
    branch_ref=$(echo "$component" | jq -r '.["ref"]')


    # Check if OS and Arch are defined
    if [ -n "$os" ] && [ -n "$arch" ]; then
        os_url="https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/$release_version/latest/$os/$arch/tar/dist/opensearch/opensearch-$release_version-$os-$arch.tar.gz"
        osd_url="https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/$release_version/latest/$os/$arch/tar/dist/opensearch-dashboards/opensearch-dashboards-$release_version-$os-$arch.tar.gz"
    else
        # Default to linux-x64 if not defined in the manifest
        os_url="https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/$release_version/latest/linux/x64/tar/dist/opensearch/opensearch-$release_version-linux-x64.tar.gz"
        osd_url="https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/$release_version/latest/linux/x64/tar/dist/opensearch-dashboards/opensearch-dashboards-$release_version-linux-x64.tar.gz"
    fi

    echo "$repo" "$workflow_name" "$os_url" "$osd_url" "$branch_ref"
}

# Wait for all processes to finish
wait_file() {
    while read -r pid; do
        wait "$pid"
    done < "$pid_file"
}

if [[ $REMOTE_CYPRESS_ENABLED = "true" &&  $ORCHESTRATOR_FEATURE_FLAG = 'true' ]]; then
    # Parse the JSON file to iterate over the components array
    components=$(jq -c '.components[]' "$REMOTE_MANIFEST_FILE")
    echo "Components: $components"
   

    for component in $components; do
        read -r repo workflow_name os_url osd_url branch_ref <<< "$(get_component_info "$component")"
        
        echo "Processing for the component: $component"
        echo "repo: $repo"
        echo "workflow_name: $workflow_name"
        echo "os_url: $os_url"
        echo "osd_url: $osd_url"
        echo "branch_ref: $branch_ref"

        # Call the function for each component
        run_remote_cypress "$repo" "$workflow_name" "$os_url" "$osd_url" "$branch_ref" 
    done

    wait_file
    log_directory="/tmp/logfiles"

    # Read log files in tmp folder and put the output to CI
    find "$log_directory" -type f -name "*.txt" | while IFS= read -r log_file; do
        if [ -f "$log_file" ]; then
            echo "Log content for file: $log_file"
            cat "$log_file"
        else
            echo "Log file not found: $log_file"
        fi
    done

    # Delete the temporary log files and folder after writing to CI
    rm -rf "$log_directory"
    rm "$pid_file"
fi

## WARNING: THIS LOGIC NEEDS TO BE THE LAST IN THIS FILE! ##
# Cypress returns back the test failure count in the error code
# The CI outputs the error code as test failure count.
#
# We need to ensure the cypress tests are the last execute process to
# the error code gets passed to the CI.

if [ "$DISABLE_VIDEO" = "true" ]; then
    echo "Disable video recording when running tests in Cypress"
    sed -i 's/video: true/video: false/g' cypress.config.js
fi

# Windows does not set timezone even when you specify `env TZ=America/Los_Angeles`
# Using powershell to force the timezone change to PST which is same as America/Los_Angeles
if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "cygwin" ] || [ "$OSTYPE" = "win32" ]; then
    powershell -Command "Set-TimeZone -Id 'Pacific Standard Time' -PassThru"
fi

## Post-3.7.0, cypress > 9 have memory issues, running each spec with its own cypress process sequentially
## https://github.com/cypress-io/cypress/issues/30988
## https://github.com/cypress-io/cypress/issues/27415
FAILED_NUM=0
FAILED_TESTS=""
TEST_FILES_NUM=`echo $TEST_FILES | wc -w`
TEST_FILES_NUM_CURR=0

if [ "$SECURITY_ENABLED" = "true" ]; then
    echo "Running security enabled tests"
    TEST_MODE=run-with-security
else
    echo "Running security disabled tests"
    TEST_MODE=run-without-security
fi

# Temp fix to only enable assistantDashboards until the llm js startup is moved to test itself, not env var
if [[ "$TEST_COMPONENTS" == *"assistantDashboards"* ]]; then
    export CYPRESS_DASHBOARDS_ASSISTANT_ENABLED=true
fi

for test_file in $TEST_FILES; do
    TEST_STATUS=pass
    TEST_FILES_NUM_CURR=$(( TEST_FILES_NUM_CURR + 1 ))
    echo -e "\nTest ($TEST_FILES_NUM_CURR/$TEST_FILES_NUM): $test_file"
    yarn cypress:$TEST_MODE --browser "$BROWSER_PATH" --spec "$test_file" || TEST_STATUS=fail

    if [ "$TEST_STATUS" = "fail" ]; then
        FAILED_NUM=$(( FAILED_NUM + 1 ))
        FAILED_TESTS="$FAILED_TESTS $test_file"
    fi
done

if [ "$FAILED_NUM" -ne 0 ]; then
    echo "Failed test: $FAILED_NUM"
    echo "Failed list: $FAILED_TESTS"
    exit 1
else
    echo "All tests passing"
fi
