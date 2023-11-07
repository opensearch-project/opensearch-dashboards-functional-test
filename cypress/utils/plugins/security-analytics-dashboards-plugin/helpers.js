/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function setupIntercept(
  cy,
  url,
  alias,
  query = undefined,
  options = {}
) {
  const urlRegex = new RegExp(`.*${url}.*`);
  const routeMatcher = {
    url: urlRegex,
  };
  if (query) {
    routeMatcher['query'] = query;
  }
  cy.intercept(routeMatcher, options).as(alias);
}
