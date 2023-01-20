/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const {
  NODE_API,
  OPENSEARCH_DASHBOARDS,
  OPENSEARCH_DASHBOARDS_URL,
} = require('../../../../cypress/utils/plugins/security-analytics-dashboards-plugin/constants');

Cypress.Commands.add('cleanUpTests', () => {
  cy.deleteAllCustomRules();
  cy.deleteAllDetectors();
  cy.deleteAllIndices();
});

Cypress.Commands.add('getTableFirstRow', (selector) => {
  if (!selector) return cy.get('tbody > tr').first();
  return cy.get('tbody > tr:first').find(selector);
});

Cypress.Commands.add('triggerSearchField', (placeholder, text) => {
  cy.get(`[placeholder="${placeholder}"]`)
    .type(`{selectall}${text}`)
    .realPress('Enter');
});

Cypress.Commands.add(
  '' + 'waitForPageLoad',
  (url, { timeout = 10000, contains = null }) => {
    const fullUrl = `${OPENSEARCH_DASHBOARDS_URL}/${url}`;
    Cypress.log({
      message: `Wait for url: ${fullUrl} to be loaded.`,
    });
    cy.url({ timeout: timeout })
      .should('include', fullUrl)
      .then(() => {
        contains && cy.contains(contains);
      });
  }
);

Cypress.Commands.add('deleteAllDetectors', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('opensearch')}/.opensearch-sap-detectors-config`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('createDetector', (detectorJSON) => {
  cy.request(
    'POST',
    `${Cypress.env('opensearch')}${NODE_API.DETECTORS_BASE}`,
    detectorJSON
  );
});

Cypress.Commands.add('updateDetector', (detectorId, detectorJSON) => {
  cy.request(
    'PUT',
    `${Cypress.env('opensearch')}/${NODE_API.DETECTORS_BASE}/${detectorId}`,
    detectorJSON
  );
});

Cypress.Commands.add('deleteDetector', (detectorName) => {
  const body = {
    from: 0,
    size: 5000,
    query: {
      nested: {
        path: 'detector',
        query: {
          bool: {
            must: [{ match: { 'detector.name': detectorName } }],
          },
        },
      },
    },
  };
  cy.request({
    method: 'POST',
    url: `${Cypress.env('opensearch')}${NODE_API.DETECTORS_BASE}/_search`,
    failOnStatusCode: false,
    body,
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        cy.request(
          'DELETE',
          `${Cypress.env('opensearch')}${NODE_API.DETECTORS_BASE}/${hit._id}`
        );
      }
    }
  });
});

Cypress.Commands.add(
  'createAliasMappings',
  (indexName, ruleTopic, aliasMappingsBody, partial = true) => {
    const body = {
      index_name: indexName,
      rule_topic: ruleTopic,
      partial: partial,
      alias_mappings: aliasMappingsBody,
    };
    cy.request({
      method: 'POST',
      url: `${Cypress.env('opensearch')}${NODE_API.MAPPINGS_BASE}`,
      body: body,
    });
  }
);

Cypress.Commands.add('createRule', (ruleJSON) => {
  return cy.request({
    method: 'POST',
    url: `${OPENSEARCH_DASHBOARDS}${NODE_API.RULES_BASE}?category=${ruleJSON.category}`,
    body: JSON.stringify(ruleJSON),
  });
});

Cypress.Commands.add('updateRule', (ruleId, ruleJSON) => {
  cy.request(
    'PUT',
    `${Cypress.env('opensearch')}/${NODE_API.RULES_BASE}/${ruleId}`,
    ruleJSON
  );
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
    url: `${Cypress.env('opensearch')}${
      NODE_API.RULES_BASE
    }/_search?pre_packaged=false`,
    failOnStatusCode: false,
    body,
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        if (hit._source.title === ruleName)
          cy.request(
            'DELETE',
            `${Cypress.env('opensearch')}${NODE_API.RULES_BASE}/${
              hit._id
            }?forced=true`
          );
      }
    }
  });
});

Cypress.Commands.add('deleteAllCustomRules', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('opensearch')}/.opensearch-sap-custom-rules-config`,
    failOnStatusCode: false,
    body: { query: { match_all: {} } },
  });
});
