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
    echo -e "-e ENV_VAR\t, no defaults, specify potential ENV_VAR in integtest.sh, separate by space if adding multiple (-e \"CYPRESS_NO_COMMAND_LOG=1 SOME_PARAMS=2\")"
    echo -e "-c CREDENTIAL\t(usename:password), no defaults, effective when SECURITY_ENABLED=true."
    echo -e "-t TEST_COMPONENTS\t(OpenSearch-Dashboards reportsDashboards etc.), optional, specify test components, separate with space, else test everything."
    echo -e "-v VERSION\t, no defaults, indicates the OpenSearch version to test."
    echo -e "-o OPTION\t, no defaults, determine the TEST_TYPE value among(default, manifest) in test_finder.sh, optional."
    echo -e "-r REMOTE_CYPRESS_ENABLED\t(true | false), defaults to true. Feature flag set to specify remote cypress orchestrator runs are enabled or not."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":hb:p:s:e:c:t:v:o:r:" arg; do
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
        e)
            ENV_VAR=$OPTARG
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

if [ -n "$ENV_VAR" ]; then
  echo "User defined ENV_VAR for the run: $ENV_VAR"
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

npm install

TEST_FILES=`get_test_list $TEST_COMPONENTS`
echo -e "Test Files List:"
echo $TEST_FILES | tr ',' '\n'
echo "BROWSER_PATH: $BROWSER_PATH"

## WARNING: THIS LOGIC NEEDS TO BE THE LAST IN THIS FILE! ##
# Cypress returns back the test failure count in the error code
# The CI outputs the error code as test failure count.
#
# We need to ensure the cypress tests are the last execute process to
# the error code gets passed to the CI.

if [ "$DISABLE_VIDEO" = "true" ]; then
    echo "Disable video recording when running tests in Cypress"
    jq '. + {"video": false}' cypress.json > cypress_new.json # jq does not allow reading and writing on same file
    mv -v cypress_new.json cypress.json
fi

if [ "$SECURITY_ENABLED" = "true" ]
then
   cmd="yarn cypress:run-with-security \"$ENV_VAR\" --browser \"$BROWSER_PATH\" --spec \"$TEST_FILES\""
   echo "run security enabled tests: $cmd"
   eval $cmd
else
   cmd="$ENV_VAR yarn cypress:run-without-security \"$ENV_VAR\" --browser \"$BROWSER_PATH\" --spec \"$TEST_FILES\""
   echo "run security disabled tests: $cmd"
   eval $cmd
fi
