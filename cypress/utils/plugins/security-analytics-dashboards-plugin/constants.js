/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const TWENTY_SECONDS_TIMEOUT = { timeout: 20000 };

export const INDICES = {
  DETECTORS_INDEX: '.opensearch-detectors-config',
  PRE_PACKAGED_RULES_INDEX: '.opensearch-pre-packaged-rules-config',
  CUSTOM_RULES_INDEX: '.opensearch-custom-rules-config',
};

export const PLUGIN_NAME = 'opensearch_security_analytics_dashboards';
export const BASE_API_PATH = '/_plugins/_security_analytics';
export const { opensearch_dashboards: OPENSEARCH_DASHBOARDS } = Cypress.env();
export const OPENSEARCH_DASHBOARDS_URL = `${OPENSEARCH_DASHBOARDS}/app/${PLUGIN_NAME}#`;

export const NODE_API = {
  DETECTORS_BASE: `${BASE_API_PATH}/detectors`,
  SEARCH_DETECTORS: `${BASE_API_PATH}/detectors/_search`,
  INDICES_BASE: `${BASE_API_PATH}/indices`,
  GET_FINDINGS: `${BASE_API_PATH}/findings/_search`,
  DOCUMENT_IDS_QUERY: `${BASE_API_PATH}/document_ids_query`,
  TIME_RANGE_QUERY: `${BASE_API_PATH}/time_range_query`,
  MAPPINGS_BASE: `${BASE_API_PATH}/mappings`,
  MAPPINGS_VIEW: `${BASE_API_PATH}/mappings/view`,
  GET_ALERTS: `${BASE_API_PATH}/alerts`,
  RULES_BASE: `${BASE_API_PATH}/rules`,
  CHANNELS: `${BASE_API_PATH}/_notifications/channels`,
  ACKNOWLEDGE_ALERTS: `${BASE_API_PATH}/detectors/{detector_id}/_acknowledge/alerts`,
  INDEX_TEMPLATE_BASE: '/_index_template',
};
