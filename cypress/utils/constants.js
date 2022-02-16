/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const BASE_PATH = Cypress.config('baseUrl');
export const BACKEND_BASE = Cypress.env('openSearchUrl');

export * from './plugins/anomaly-detection-dashboards-plugin/constants'
export * from './plugins/index-management-dashboards-plugin/constants'
