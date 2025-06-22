/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../base_constants';

export const QUERY_INSIGHTS_PLUGIN_NAME = 'query-insights-dashboards';

export const OVERVIEW_PATH = `${BASE_PATH}/app/${QUERY_INSIGHTS_PLUGIN_NAME}#/queryInsights`;
export const CONFIGURATION_PATH = `${BASE_PATH}/app/${QUERY_INSIGHTS_PLUGIN_NAME}#/configuration`;
export const LIVEQUERIES_PATH = `${BASE_PATH}/app/${QUERY_INSIGHTS_PLUGIN_NAME}#/LiveQueries`;

export const METRICS = {
  LATENCY: 'latency',
  CPU: 'cpu',
  MEMORY: 'memory',
};


