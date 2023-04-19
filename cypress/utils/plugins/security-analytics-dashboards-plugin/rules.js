/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { BASE_PATH } = require('../../base_constants');
const { FEATURE_SYSTEM_INDICES, NODE_API } = require('./constants');

Cypress.Commands.add('createRule', (ruleJSON) => {
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}${NODE_API.RULES_BASE}?category=${ruleJSON.category}`,
    body: JSON.stringify(ruleJSON),
    headers: {
      'osd-xsrf': false,
    },
  });
});

Cypress.Commands.add('updateRule', (ruleId, ruleJSON) => {
  cy.request('PUT', `${BASE_PATH}/${NODE_API.RULES_BASE}/${ruleId}`, ruleJSON);
});

Cypress.Commands.add('deleteRule', (ruleName) => {
  const body = {
    from: 0,
    size: 5000,
    query: {
      nested: {
        path: 'rule',
        query: {
          bool: {
            must: [{ match: { 'rule.title': 'Cypress test rule' } }],
          },
        },
      },
    },
  };
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}${NODE_API.RULES_BASE}/_search?pre_packaged=false`,
    failOnStatusCode: false,
    body,
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        if (hit._source.title === ruleName)
          cy.request(
            'DELETE',
            `${BASE_PATH}${NODE_API.RULES_BASE}/${hit._id}?forced=true`
          );
      }
    }
  });
});

Cypress.Commands.add('deleteAllCustomRules', () => {
  const url = `${BASE_PATH}/${FEATURE_SYSTEM_INDICES.CUSTOM_RULES_INDEX}`;
  cy.request({
    method: 'DELETE',
    url: url,
    failOnStatusCode: false,
    body: { query: { match_all: {} } },
  });
});
