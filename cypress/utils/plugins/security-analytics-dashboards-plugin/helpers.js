/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function setupIntercept(cy, url, interceptName, method = 'POST') {
  const urlRegex = new RegExp(`.*${url}.*`);
  cy.intercept(method, urlRegex).as(interceptName);
}
