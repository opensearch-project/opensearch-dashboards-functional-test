/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import { logTypeLabels } from './constants';

export function getLogTypeLabel(name) {
  return !name ? DEFAULT_EMPTY_DATA : logTypeLabels[name.toLowerCase()] || startCase(name);
};

export function setupIntercept(cy, url, interceptName, method = 'POST', options = {}) {
  const urlRegex = new RegExp(`.*${url}.*`);
  cy.intercept(method, urlRegex, options).as(interceptName);
}