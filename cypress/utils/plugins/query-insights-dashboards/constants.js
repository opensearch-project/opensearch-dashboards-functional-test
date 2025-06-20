/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const BASE_PATH = Cypress.config('baseUrl');

export const PLUGIN_NAME = 'query-insights-dashboards';

export const OVERVIEW_PATH = `${BASE_PATH}/app/${PLUGIN_NAME}#/queryInsights`;
export const CONFIGURATION_PATH = `${BASE_PATH}/app/${PLUGIN_NAME}#/configuration`;
export const LIVEQUERIES_PATH = `${BASE_PATH}/app/${PLUGIN_NAME}#/LiveQueries`;

export const METRICS = {
  LATENCY: 'latency',
  CPU: 'cpu',
  MEMORY: 'memory',
};

export const ADMIN_AUTH = {
  username: Cypress.env('username'),
  password: Cypress.env('password'),
};
