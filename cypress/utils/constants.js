/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const BASE_PATH = Cypress.config('baseUrl');

/**
 *****************************
 AD PLUGIN CONSTANTS
 *****************************
 */

export const AD_FIXTURE_BASE_PATH = 'plugins/anomaly-detection-dashboards-plugin/'

export const BASE_AD_PATH = BASE_PATH + '/app/anomaly-detection-dashboards#';

export const BASE_AD_DASHBOARDS_PATH = BASE_AD_PATH + '/dashboard';

export const BASE_AD_DETECTOR_LIST_PATH = BASE_AD_PATH + '/detectors';

export const BASE_AD_CREATE_AD_PATH = BASE_AD_PATH + '/create-ad';

export const BASE_AD_NODE_API_PATH = BASE_PATH + '/api/anomaly_detectors';

export const AD_GET_DETECTORS_NODE_API_PATH =
  BASE_AD_NODE_API_PATH + '/detectors*';

export const AD_GET_INDICES_NODE_API_PATH =
  BASE_AD_NODE_API_PATH + '/_indices*';

export const AD_GET_MAPPINGS_NODE_API_PATH =
  BASE_AD_NODE_API_PATH + '/_mappings*';

export function getADStartDetectorNodeApiPath(detectorId) {
  return BASE_AD_NODE_API_PATH + '/detectors/' + detectorId + '/start';
}

export function getADStopDetectorNodeApiPath(detectorId) {
  return BASE_AD_NODE_API_PATH + '/detectors/' + detectorId + '/stop';
}

export const TEST_DETECTOR_ID = 'ulgqpXEBqtadYz9j2MHG';

// TODO: when repo is onboarded to typescript we can convert these detector states into an enum
export const DETECTOR_STATE_DISABLED = 'Stopped';

export const DETECTOR_STATE_INIT = 'Initializing';

export const DETECTOR_STATE_RUNNING = 'Running';

export const DETECTOR_STATE_FEATURE_REQUIRED = 'Feature required';

/**
 *****************************
 IM PLUGIN CONSTANTS
 *****************************
 */

export const IM_API_ROUTE_PREFIX = "/_plugins/_ism";
export const IM_API_ROUTE_PREFIX_ROLLUP = "/_plugins/_rollup";
export const IM_API_ROUTE_PREFIX_TRANSFORM = "/_plugins/_transform";

export const IM_CONFIG_INDEX = {
  OPENDISTRO_ISM_CONFIG: ".opendistro-ism-config",
};

export const IM_API = {
  INDEX_TEMPLATE_BASE: "/_index_template",
  DATA_STREAM_BASE: "/_data_stream",
  POLICY_BASE: `${IM_API_ROUTE_PREFIX}/policies`,
  EXPLAIN_BASE: `${IM_API_ROUTE_PREFIX}/explain`,
  RETRY_BASE: `${IM_API_ROUTE_PREFIX}/retry`,
  ADD_POLICY_BASE: `${IM_API_ROUTE_PREFIX}/add`,
  REMOVE_POLICY_BASE: `${IM_API_ROUTE_PREFIX}/remove`,
  CHANGE_POLICY_BASE: `${IM_API_ROUTE_PREFIX}/change_policy`,
  ROLLUP_JOBS_BASE: `${IM_API_ROUTE_PREFIX_ROLLUP}/jobs`,
  TRANSFORM_JOBS_BASE: `${IM_API_ROUTE_PREFIX_TRANSFORM}`,
};

export const IM_PLUGIN_NAME = "opensearch_index_management_dashboards";