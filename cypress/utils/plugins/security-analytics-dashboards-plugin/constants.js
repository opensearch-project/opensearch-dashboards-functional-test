/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';

export const PLUGIN_NAME = 'opensearch_security_analytics_dashboards';
export const BASE_API_PATH = '/_plugins/_security_analytics';

export const TWENTY_SECONDS_TIMEOUT = { timeout: 20000 };
export const DETECTOR_TRIGGER_TIMEOUT = 65000;

export const FEATURE_SYSTEM_INDICES = {
  DETECTORS_INDEX: '.opensearch-detectors-config',
  DETECTOR_QUERIES_INDEX: '.opensearch-sap-windows-detectors-queries',
  PRE_PACKAGED_RULES_INDEX: '.opensearch-pre-packaged-rules-config',
  CUSTOM_RULES_INDEX: '.opensearch-sap-custom-rules-config',
  WINDOWS_ALERTS_INDEX: '.opensearch-sap-windows-alerts*',
  WINDOWS_FINDINGS_INDEX: '.opensearch-sap-windows-findings*',
};

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
  RULES_SEARCH: `${BASE_API_PATH}/rules/_search`,
  CHANNELS: `${BASE_API_PATH}/_notifications/channels`,
  PLUGINS: `${BASE_API_PATH}/_notifications/plugins`,
  ACKNOWLEDGE_ALERTS: `${BASE_API_PATH}/detectors/{detector_id}/_acknowledge/alerts`,
  INDEX_TEMPLATE_BASE: '/_index_template',
};

export const OPENSEARCH_DASHBOARDS_URL = `${BASE_PATH}/app/${PLUGIN_NAME}#`;
