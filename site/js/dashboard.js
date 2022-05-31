// Copyright OpenSearch Contributors
// SPDX-License-Identifier: Apache-2.0

const plugins = {
  'alerting-dashboards-plugin': {
    name: 'alertingDashboards',
    videos: [
      'acknowledge_alerts_modal_spec.js',
      'alert_spec.js',
      'alerts_dashboard_flyout_spec.js',
      'bucket_level_monitor_spec.js',
      'cluster_metrics_monitor_spec.js',
      'query_level_monitor_spec.js',
    ],
  },
  'anomaly-detection-dashboards-plugin': {
    name: 'anomalyDetectionDashboards',
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
  'gantt-chart-dashboards': {
    name: 'ganttChartDashboards',
    videos: ['gantt_ui.spec.js'],
  },
  'index-management-dashboards-plugin': {
    name: 'indexManagementDashboards',
    videos: [
      'indices_spec.js',
      'managed_indices_spec.js',
      'policies_spec.js',
      'rollups_spec.js',
      'transforms_spec.js',
    ],
  },
  'notifications-dashboards': {
    name: 'notificationsDashboards',
    videos: ['1_email_senders_and_groups.spec.js', '2_channels.spec.js'],
  },
  'observability-dashboards': {
    name: 'observabilityDashboards',
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
  'query-workbench-dashboards': {
    name: 'queryWorkbenchDashboards',
    videos: ['ui.spec.js'],
  },
  'reports-dashboards': {
    name: 'reportsDashboards',
    videos: [
      '01-create.spec.js',
      '02-edit.spec.js',
      '03-details.spec.js',
      '04-download.spec.js',
    ],
  },
  security: {
    name: 'securityDashboards',
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

  document.getElementById('testResultsLinksDiv').style.display = 'block';

  document.getElementById('securityDashboardsButton').hidden = !securityEnabled;
  var testResultsLink = document.getElementById('testResultLink');
  testResultsLink.textContent = testResultsUrl;
  testResultsLink.href = testResultsUrl;

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

  document.getElementById('testResultsDiv').style.display = 'block';
  document.getElementById('testResults').src =
    decodeURIComponent(testResultsUrl);
}

// eslint-disable-next-line no-unused-vars
function enableAdvancedConfig() {
  document.getElementById('advancedInputsTable').style.display =
    document.getElementById('advancedConfig').checked ? 'block' : 'none';
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

  const pluginUrl =
    'https://ci.opensearch.org/ci/dbc/distribution-build-opensearch-dashboards/' +
    `${version}/` +
    `${buildNumber}/` +
    `${platform}/` +
    `${arch}/` +
    `${type}/` +
    'builds/opensearch-dashboards/plugins/' +
    `${pluginObject.name}-${version}.zip`;

  var githubManifestLink = document.createElement('a');
  githubManifestLink.textContent = 'Manifest';
  githubManifestLink.href = `https://github.com/opensearch-project/opensearch-build/blob/main/manifests/${version}/opensearch-dashboards-${version}.yml`;
  document.getElementById('githubManifestLink').appendChild(githubManifestLink);

  var pluginLink = document.createElement('a');
  pluginLink.textContent = pluginUrl;
  pluginLink.href = pluginUrl;
  document.getElementById('pluginLink').appendChild(pluginLink);

  const videosBaseUrl =
    'https://ci.opensearch.org/ci/dbc/' +
    `${testJobName}/` +
    `${version}/` +
    `${buildNumber}/` +
    `${platform}/` +
    `${arch}/` +
    `${type}/` +
    `test-results/${testNumber}/integ-test/functionalTestDashboards/` +
    `${securityEnabled ? 'with-security' : 'without-security'}/` +
    'test-results/cypress-videos/plugins/' +
    `${plugin}`;
  const videos = pluginObject.videos;
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
