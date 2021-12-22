/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Base URL path with the trailing slash removed
export const BASE_PATH = new URL(Cypress.config().baseUrl).pathname.replace(
  /\/$/,
  ''
);

/**
 *****************************
 AD PLUGIN CONSTANTS
 *****************************
 */
export const BASE_AD_PATH = BASE_PATH + '/app/anomaly-detection-dashboards#';

export const BASE_AD_DASHBOARDS_PATH = BASE_AD_PATH + '/dashboard';

export const BASE_AD_NODE_API_PATH = BASE_PATH + '/api/anomaly_detectors';

export const AD_GET_DETECTORS_NODE_API_PATH =
  BASE_AD_NODE_API_PATH + '/detectors*';

export const AD_GET_INDICES_NODE_API_PATH =
  BASE_AD_NODE_API_PATH + '/_indices*';
