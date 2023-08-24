#!/bin/bash

set -e

OSD_BUILD_MANIFEST='../local-test-cluster/opensearch-dashboards-*/manifest.yml'
OSD_TEST_PATH='cypress/e2e/core-opensearch-dashboards'
OSD_PLUGIN_TEST_PATH='cypress/e2e/plugins'
TEST_TYPE=$OPTION

# Map component name in opensearch-build repo INPUT_MANIFEST with folder name for tests in functional repo
OSD_COMPONENT_TEST_MAP=( "OpenSearch-Dashboards:opensearch-dashboards"
                         "alertingDashboards:alerting-dashboards-plugin"
                         "anomalyDetectionDashboards:anomaly-detection-dashboards-plugin"
                         "ganttChartDashboards:gantt-chart-dashboards"
                         "indexManagementDashboards:index-management-dashboards-plugin"
                         "observabilityDashboards:observability-dashboards"
                         "queryWorkbenchDashboards:query-workbench-dashboards"
                         "reportsDashboards:reports-dashboards"
                         "securityDashboards:security"
                         "notificationsDashboards:notifications-dashboards"
                         "customImportMapDashboards:custom-import-map-dashboards"
                         "searchRelevanceDashboards:search-relevance-dashboards"
                         "mlCommonsDashboards:ml-commons-dashboards"
                         "securityAnalyticsDashboards:security-analytics-dashboards-plugin"
                       )

if [ -z $TEST_TYPE ]; then
    [ -f $OSD_BUILD_MANIFEST ] && TEST_TYPE="manifest" || TEST_TYPE="default"
fi

[ ! `echo $SHELL | grep 'bash'` ] && echo "You must run this script with bash as other shells like zsh will fail the script, exit in 10" && sleep 10 && exit 1

# Checks if build manifest in parent directory of current directory under local-test-cluster/opensearch-dashboards-*
# When the test script executed in the CI, it scales up OpenSearch Dashboards under local-test-cluster with a 
# manifest that contains the existing components.
#
# If the build manifest exists in the expected path then we can read the components to execute component tests if the
# component exists. If the build manifest does not exist then we can just use a default list of tests.
#
# Usages: get_test_list - Get all test list in the repository by default. If manifest exists, then only components in manifests will be added in test list
#         get_test_list <component1> <component2> ... - Get test list based on user defined components. Ex: get_test_list OpenSearch-Dashboards reportsDashboards

function get_test_list() {
    local TEST_FILES_LOCAL=""
    local TEST_FILES_EXT_LOCAL=""
    local TEST_PATH_LOCAL=""
    local TEST_COMPONENTS_LOCAL="$@"

    for map_entry in "${OSD_COMPONENT_TEST_MAP[@]}"; do
        component_name=${map_entry%%:*}
        test_folder=${map_entry#*:}

        if [ "$component_name" = "OpenSearch-Dashboards" ]; then
            TEST_PATH_LOCAL=$OSD_TEST_PATH
            TEST_FILES_EXT_LOCAL="**/*.js"
        else
            TEST_PATH_LOCAL=$OSD_PLUGIN_TEST_PATH
            TEST_FILES_EXT_LOCAL="*"
        fi

        if [ "$TEST_TYPE" = "default" ]; then
            if [ -z "$TEST_COMPONENTS_LOCAL" ]; then
                TEST_FILES_LOCAL+="$TEST_PATH_LOCAL/$test_folder/$TEST_FILES_EXT_LOCAL,"
            else
                for test_component in $TEST_COMPONENTS_LOCAL; do
                    if [ "$test_component" = "$component_name" ]; then
                        TEST_FILES_LOCAL+="$TEST_PATH_LOCAL/$test_folder/$TEST_FILES_EXT_LOCAL,"
                        break
                    fi
                done
            fi

        elif [ "$TEST_TYPE" = "manifest" ]; then
            if grep -q $component_name $OSD_BUILD_MANIFEST; then
                TEST_FILES_LOCAL+="$TEST_PATH_LOCAL/$test_folder/$TEST_FILES_EXT_LOCAL,"
            fi
        fi

    done

    echo "${TEST_FILES_LOCAL%,}"
}
