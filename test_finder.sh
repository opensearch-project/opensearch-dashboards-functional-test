#!/bin/bash

set -e

OSD_BUILD_MANIFEST='../local-test-cluster/opensearch-dashboards-*/manifest.yml'
OSD_TEST_PATH='cypress/integration/core-opensearch-dashboards'
OSD_PLUGIN_TEST_PATH='cypress/integration/plugins'

# Checks if build manifest in parent directory of current directory under local-test-cluster/opensearch-dashboards-*
# When the test script executed in the CI, it scales up OpenSearch Dashboards under local-test-cluster with a 
# manifest that contains the existing components.
#
# If the build manifest exists in the expected path then we can read the components to execute component tests if the
# component exists. If the build manifest does not exist then we can just use a default list of tests.
function get_test_list() {
    [ -f $OSD_MANIFEST_PATH ] && generate_test_list_from_build_manifest || generate_test_list
}

function generate_test_list() {
    DEFAULT_TEST_FILES="$OSD_TEST_PATH/opensearch-dashboards/*.js"
    DEFAULT_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/alerting-dashboards-plugin/*"
    DEFAULT_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/anomaly-detection-dashboards-plugin/*"
    DEFAULT_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/gantt-chart-dashboards/*"
    DEFAULT_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/index-management-dashboards-plugin/*"
    DEFAULT_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/observability-dashboards/*"
    DEFAULT_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/query-workbench-dashboards/*"
    DEFAULT_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/reports-dashboards/*"
    DEFAULT_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/security/*"

    echo "$DEFAULT_TEST_FILES"
}

function generate_test_list_from_build_manifest() {
    MANIFEST_TEST_FILES="$OSD_TEST_PATH/opensearch-dashboards/*.js"

    grep -q 'alertingDashboards' $OSD_BUILD_MANIFEST && MANIFEST_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/alerting-dashboards-plugin/*" || true
    grep -q 'anomalyDetectionDashboards' $OSD_BUILD_MANIFEST && MANIFEST_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/anomaly-detection-dashboards-plugin/*" || true
    grep -q 'ganttChartDashboards' $OSD_BUILD_MANIFEST && MANIFEST_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/gantt-chart-dashboards/*" || true
    grep -q 'indexManagementDashboards' $OSD_BUILD_MANIFEST && MANIFEST_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/index-management-dashboards-plugin/*" || true
    grep -q 'observabilityDashboards' $OSD_BUILD_MANIFEST && MANIFEST_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/observability-dashboards/*" || true
    grep -q 'queryWorkbenchDashboards' $OSD_BUILD_MANIFEST && MANIFEST_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/query-workbench-dashboards/*" || true
    grep -q 'reportsDashboards' $OSD_BUILD_MANIFEST && MANIFEST_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/reports-dashboards/*" || true
    grep -q 'securityDashboards' $OSD_BUILD_MANIFEST && MANIFEST_TEST_FILES+=",$OSD_PLUGIN_TEST_PATH/security/*" || true

    echo "$MANIFEST_TEST_FILES"
}
