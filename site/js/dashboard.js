/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const defaults = {
  version: '2.8.0',
  buildNumber: '6177',
  testNumber: '3616',
  testJobName: 'integ-test-opensearch-dashboards',
  platform: 'linux',
  arch: 'x64',
  type: 'tar',
  withSecurity: false,
  advancedConfig: false,
  showLegacyTestResults: false,
};

const plugins = {
  'opensearch-dashboards': {
    name: 'OpenSearch-Dashboards',
    default: {
      videos: [
        'apps/vis_builder/basic.spec.js',
        'apps/vis_builder/dashboard.spec.js',
        'apps/vis_builder/experimental.spec.js',
        'apps/vis_builder/vis_types/area.spec.js',
        'apps/vis_builder/vis_types/bar.spec.js',
        'apps/vis_builder/vis_types/line.spec.js',
        'apps/vis_builder/vis_types/metric.spec.js',
        'apps/vis_builder/vis_types/table.spec.js',
        'apps/vis_type_table/basic.spec.js',
        'apps/vis_type_table/data.spec.js',
        'apps/vis_type_table/embed.spec.js',
        'apps/vis_type_table/options.spec.js',
        'apps/vis_type_table/split.spec.js',
        'apps/datasource-management-plugin/1_create_datasource.spec.js',
        'apps/datasource-management-plugin/2_datasource_table.spec.js',
        'apps/datasource-management-plugin/3_update_datasource.spec.js',
        'dashboard_sanity_test_spec.js',
      ],
    },
  },
  'alerting-dashboards-plugin': {
    name: 'alertingDashboards',
    default: {
      videos: [
        'acknowledge_alerts_modal_spec.js',
        'alert_spec.js',
        'alerts_dashboard_flyout_spec.js',
        'bucket_level_monitor_spec.js',
        'cluster_metrics_monitor_spec.js',
        'query_level_monitor_spec.js',
      ],
    },
  },
  'anomaly-detection-dashboards-plugin': {
    name: 'anomalyDetectionDashboards',
    default: {
      videos: [
        'create_detector_spec.js',
        'dashboard_spec.js',
        'detector_configuration_spec.js',
        'detector_list_spec.js',
        'historical_analysis_spec.js',
        'overview_spec.js',
        'real_time_results_spec.js',
        'sample_detector_spec.js',
      ],
    },
  },
  'custom-import-map-dashboards': {
    name: 'customImportMapDashboards',
    default: {
      videos: ['import_vector_map_tab.spec.js'],
    },
  },
  'gantt-chart-dashboards': {
    name: 'ganttChartDashboards',
    default: { videos: ['gantt_ui.spec.js'] },
  },
  'index-management-dashboards-plugin': {
    name: 'indexManagementDashboards',
    default: {
      videos: [
        'indices_spec.js',
        'managed_indices_spec.js',
        'policies_spec.js',
        'rollups_spec.js',
        'transforms_spec.js',
      ],
    },
  },
  'notifications-dashboards': {
    name: 'notificationsDashboards',
    default: {
      videos: ['1_email_senders_and_groups.spec.js', '2_channels.spec.js'],
    },
  },
  'observability-dashboards': {
    name: 'observabilityDashboards',
    default: {
      videos: [
        '0_before.spec.js',
        '1_trace_analytics_dashboard.spec.js',
        '2_trace_analytics_services.spec.js',
        '3_trace_analytics_traces.spec.js',
        '4_panels.spec.js',
        '5_event_analytics.spec.js',
        '6_notebooks.spec.js',
        '7_app_analytics.spec.js',
        '8_after.spec.js',
      ],
    },
  },
  'query-workbench-dashboards': {
    name: 'queryWorkbenchDashboards',
    default: { videos: ['ui.spec.js'] },
  },
  'reports-dashboards': {
    name: 'reportsDashboards',
    default: {
      videos: [
        '01-create.spec.js',
        '02-edit.spec.js',
        '03-details.spec.js',
        '04-download.spec.js',
      ],
    },
  },
  security: {
    name: 'securityDashboards',
    default: {
      videos: [
        'audit_log_spec.js',
        'auth_spec.js',
        'get_started_spec.js',
        'internalusers_spec.js',
        'permissions_spec.js',
        'roles_spec.js',
        'tenants_spec.js',
      ],
    },
  },
  'security-analytics-dashboards-plugin': {
    name: 'securityAnalyticsDashboards',
    default: {
      videos: [
        '1_detectors.spec.js',
        '2_rules.spec.js',
        '3_alerts.spec.js',
        '4_findings.spec.js',
      ],
    },
  },
};

// eslint-disable-next-line no-unused-vars
function getTestResults() {
  const version = document.getElementById('version').value;
  const testJobName = document.getElementById('testJobName').value;
  const buildNumber = document.getElementById('buildNumber').value;
  const testNumber = document.getElementById('testNumber').value;
  const platform = document.getElementById('platform').value;
  const arch = document.getElementById('arch').value;
  const type = document.getElementById('type').value;
  const securityEnabled = document.getElementById('security').checked;

  document.getElementById('testResultsLinksDiv').style.display = 'block';

  document.getElementById('securityDashboardsButton').hidden = !securityEnabled;

  const resultPageUrl =
    'https://opensearch-project.github.io/opensearch-dashboards-functional-test/site/?' +
    `version=${version}&` +
    `build_number=${buildNumber}&` +
    `test_number=${testNumber}&` +
    `platform=${platform}&` +
    `arch=${arch}&` +
    `type=${type}`;

  var resultPageLink = document.getElementById('resultPageLink');
  resultPageLink.textContent = resultPageUrl;
  resultPageLink.href = resultPageUrl;

  const osdUrl =
    'https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/' +
    `${version}/` +
    `${buildNumber}/` +
    `${platform}/` +
    `${arch}/` +
    `${type}/` +
    'dist/opensearch-dashboards/' +
    `opensearch-dashboards-${version}-${platform}-${arch}` +
    `${type === 'tar' ? '.tar.gz' : '.rpm'}`;
  var osdLink = document.getElementById('osdLink');
  osdLink.textContent = osdUrl;
  osdLink.href = osdUrl;

  const manifestUrl =
    'https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/' +
    `${version}/` +
    `${buildNumber}/` +
    `${platform}/` +
    `${arch}/` +
    `${type}/` +
    'dist/opensearch-dashboards/manifest.yml';
  var manifestLink = document.getElementById('manifestLink');
  manifestLink.textContent = manifestUrl;
  manifestLink.href = manifestUrl;

  const osUrl =
    'https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/' +
    `${version}/` +
    'latest/' +
    `${platform}/` +
    `${arch}/` +
    `${type}/` +
    'dist/opensearch/' +
    `opensearch-${version}-${platform}-${arch}` +
    `${type === 'tar' ? '.tar.gz' : '.rpm'}`;
  var osLink = document.getElementById('osLink');
  osLink.textContent = osUrl;
  osLink.href = osUrl;

  const jenkinsUrl =
    'https://build.ci.opensearch.org/job/' +
    `${testJobName}/` +
    `${testNumber}`;
  var jenkinsLink = document.getElementById('jenkinsLink');
  jenkinsLink.textContent = jenkinsUrl;
  jenkinsLink.href = jenkinsUrl;

  if (!enableLegacyTestsResults()) {
    hideLegacyTestsResults();
    return;
  }

  const testResultsUrl =
    'https://ci.opensearch.org/ci/dbc/' +
    `${testJobName}/` +
    `${version}/` +
    `${buildNumber}/` +
    `${platform}/` +
    `${arch}/` +
    `${type}/` +
    `test-results/${testNumber}/integ-test/functionalTestDashboards/` +
    `${securityEnabled ? 'with-security' : 'without-security'}/` +
    'test-results/stdout.txt';

  var testResultsLink = document.getElementById('testResultLink');
  testResultsLink.textContent = testResultsUrl;
  testResultsLink.href = testResultsUrl;

  document.getElementById('testResultsDiv').style.display = 'block';
  document.getElementById('testResults').src =
    decodeURIComponent(testResultsUrl);
}

// eslint-disable-next-line no-unused-vars
function enableAdvancedConfig() {
  document.getElementById('advancedInputsTable').style.display =
    document.getElementById('advancedConfig').checked ? 'block' : 'none';
}

function enableLegacyTestsResults() {
  return document.getElementById('legacyResults').checked;
}

function hideLegacyTestsResults() {
  document.getElementById('testResultsDiv').style.display = 'none';
  var testResultsLink = document.getElementById('testResultLink');
  testResultsLink.textContent = 'How to view test results for plugins';
  testResultsLink.href = 'assets/plugin_test_results_help.gif';
}

// eslint-disable-next-line no-unused-vars
function getPluginLinks(plugin) {
  document.getElementById('pluginLinksList').innerHTML = '';
  document.getElementById('githubManifestLink').innerHTML = '';
  document.getElementById('pluginLink').innerHTML = '';
  document.getElementById('pluginLinksDiv').style.display = 'block';
  document.getElementById('pluginName').innerHTML = plugin;
  const version = document.getElementById('version').value;
  const testJobName = document.getElementById('testJobName').value;
  const buildNumber = document.getElementById('buildNumber').value;
  const testNumber = document.getElementById('testNumber').value;
  const platform = document.getElementById('platform').value;
  const arch = document.getElementById('arch').value;
  const type = document.getElementById('type').value;
  const securityEnabled = document.getElementById('security').checked;

  var pluginLinksList = document.getElementById('pluginLinksList');
  const pluginObject = plugins[plugin];
  const coreBaseUrl =
    pluginObject.name === 'OpenSearch-Dashboards'
      ? 'core-opensearch-dashboards'
      : 'plugins';

  const pluginUrl =
    'https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/' +
    `${version}/` +
    `${buildNumber}/` +
    `${platform}/` +
    `${arch}/` +
    `${type}/` +
    'builds/opensearch-dashboards/' +
    `${coreBaseUrl}` +
    `${pluginObject.name}-${version}.zip`;

  var githubManifestLink = document.createElement('a');
  githubManifestLink.textContent = 'Manifest';
  githubManifestLink.href = `https://github.com/opensearch-project/opensearch-build/blob/main/manifests/${version}/opensearch-dashboards-${version}.yml`;
  document.getElementById('githubManifestLink').appendChild(githubManifestLink);

  if (!enableLegacyTestsResults()) {
    const testResultsUrl =
      'https://ci.opensearch.org/ci/dbc/' +
      `${testJobName}/` +
      `${version}/` +
      `${buildNumber}/` +
      `${platform}/` +
      `${arch}/` +
      `${type}/` +
      `test-results/${testNumber}/integ-test/` +
      `${pluginObject.name}/` +
      `${securityEnabled ? 'with-security' : 'without-security'}/` +
      'stdout.txt';

    var pluginTestResultLink = document.createElement('a');
    pluginTestResultLink.textContent = testResultsUrl;
    pluginTestResultLink.href = testResultsUrl;
    document.getElementById('pluginLink').appendChild(pluginTestResultLink);

    const ruleElement = document.createElement('hr');
    document.getElementById('pluginLink').appendChild(ruleElement);
  }

  var pluginLink = document.createElement('a');
  pluginLink.textContent = pluginUrl;
  pluginLink.href = pluginUrl;
  document.getElementById('pluginLink').appendChild(pluginLink);

  const s3BaseUrl =
    'https://ci.opensearch.org/ci/dbc/' +
    `${testJobName}/` +
    `${version}/` +
    `${buildNumber}/` +
    `${platform}/` +
    `${arch}/` +
    `${type}/` +
    `test-results/${testNumber}/integ-test/` +
    `${
      enableLegacyTestsResults()
        ? 'functionalTestDashboards'
        : pluginObject.name
    }/` +
    `${securityEnabled ? 'with-security' : 'without-security'}` +
    `${enableLegacyTestsResults() ? 'test-results' : ''}`;
  const screenshotBaseUrl = `${s3BaseUrl}/cypress-screenshots/${coreBaseUrl}/${plugin}/$SPEC_FILE/$FULL_TEST_FAILURE.png`;
  const videosBaseUrl = `${s3BaseUrl}/cypress-videos/${coreBaseUrl}/${plugin}`;

  document.getElementById(
    'baseScreenshotUrlBefore'
  ).innerHTML = `/tmp/$RANDOM/${
    enableLegacyTestsResults() ? 'functionalTestDashboards' : pluginObject.name
  }/cypress/screenshots/${coreBaseUrl}/${plugin}/$SPEC_FILE/$FULL_TEST_FAILURE.png`;
  document.getElementById('baseScreenshotUrlAfter').innerHTML =
    screenshotBaseUrl;

  const majorVersion = version.split('.')[0];
  const videos = pluginObject[majorVersion]
    ? pluginObject[majorVersion].videos
    : pluginObject.default.videos;
  for (const video of videos) {
    var link = document.createElement('a');
    link.textContent = `${videosBaseUrl}/${video}.mp4`;
    link.href = `${videosBaseUrl}/${video}.mp4`;
    var li = document.createElement('li');
    li.appendChild(link);
    pluginLinksList.appendChild(li);
  }
}

// eslint-disable-next-line no-unused-vars
function closePluginLinks() {
  document.getElementById('pluginLinksDiv').style.display = 'none';
  document.getElementById('pluginLinksList').innerHTML = '';
}

// eslint-disable-next-line no-unused-vars
function setDefaultValues() {
  const params = new URLSearchParams(window.location.search);
  document.getElementById('version').value = params.get('version')
    ? params.get('version')
    : defaults.version;
  document.getElementById('buildNumber').value = params.get('build_number')
    ? params.get('build_number')
    : defaults.buildNumber;
  document.getElementById('testJobName').value = params.get('test_job_name')
    ? params.get('test_job_name')
    : defaults.testJobName;
  document.getElementById('testNumber').value = params.get('test_number')
    ? params.get('test_number')
    : defaults.testNumber;
  document.getElementById('platform').value = params.get('platform')
    ? params.get('platform')
    : defaults.platform;
  document.getElementById('arch').value = params.get('arch')
    ? params.get('arch')
    : defaults.arch;
  document.getElementById('type').value = params.get('type')
    ? params.get('type')
    : defaults.type;
  document.getElementById('security').checked = params.get('with_security')
    ? params.get('with_security').toLowerCase() === 'true'
    : defaults.withSecurity;
  document.getElementById('advancedConfig').checked = defaults.advancedConfig;
  document.getElementById('legacyResults').checked = params.get(
    'legacy_results'
  )
    ? params.get('legacy_results').toLowerCase() === 'true'
    : defaults.showLegacyTestResults;
}
