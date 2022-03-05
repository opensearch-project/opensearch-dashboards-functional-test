/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const API_ROUTE_PREFIX = '/_plugins/_alerting';

export const ALERTING_INDEX = {
  OPENSEARCH_ALERTING_CONFIG: '.opendistro-alerting-config',
  SAMPLE_DATA_ECOMMERCE: 'opensearch_dashboards_sample_data_ecommerce',
};

export const ALERTING_API = {
  MONITOR_BASE: `${API_ROUTE_PREFIX}/monitors`,
  DESTINATION_BASE: `${API_ROUTE_PREFIX}/destinations`,
};

export const ALERTING_PLUGIN_NAME = 'alerting';