/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const BASE_PATH = Cypress.config('baseUrl');
export const BACKEND_BASE_PATH = Cypress.env('openSearchUrl');
export const ADMIN_AUTH = {
  username: 'admin',
  password: 'admin',
};
