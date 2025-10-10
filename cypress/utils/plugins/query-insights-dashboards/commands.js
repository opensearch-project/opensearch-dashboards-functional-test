/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const {
  QUERY_INSIGHTS_OVERVIEW_PATH,
  QUERY_INSIGHTS_CONFIGURATION_PATH,
} = require('./constants');

Cypress.Commands.add('getElementByText', (locator, text) => {
  Cypress.log({ message: `Get element by text: ${text}` });
  return locator
    ? cy.get(locator).filter(`:contains("${text}")`).should('be.visible')
    : cy.contains(text).should('be.visible');
});

Cypress.Commands.add('enableTopQueries', (metric) => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('openSearchUrl')}/_cluster/settings`,
    body: {
      persistent: {
        [`search.insights.top_queries.${metric}.enabled`]: true,
        [`search.insights.top_queries.${metric}.window_size`]: '1h',
        [`search.insights.top_queries.${metric}.top_n_size`]: 100,
      },
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('disableTopQueries', (metric) => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('openSearchUrl')}/_cluster/settings`,
    body: {
      persistent: {
        [`search.insights.top_queries.${metric}.enabled`]: false,
      },
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('enableGrouping', () => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('openSearchUrl')}/_cluster/settings`,
    body: {
      persistent: {
        'search.insights.top_queries.latency.enabled': true,
        'search.insights.top_queries.cpu.enabled': true,
        'search.insights.top_queries.memory.enabled': true,
        'search.insights.top_queries.grouping.group_by': 'similarity',
        'search.insights.top_queries.grouping.max_groups_excluding_topn': 100,
        'search.insights.top_queries.grouping.attributes.field_name': true,
        'search.insights.top_queries.grouping.attributes.field_type': true,
        'search.insights.top_queries.latency.top_n_size': 5,
        'search.insights.top_queries.cpu.top_n_size': 5,
        'search.insights.top_queries.memory.top_n_size': 5,
        'search.insights.top_queries.latency.window_size': '1h',
        'search.insights.top_queries.cpu.window_size': '1h',
        'search.insights.top_queries.memory.window_size': '1h',
        'search.insights.top_queries.exporter.type': 'none',
      },
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('disableGrouping', () => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('openSearchUrl')}/_cluster/settings`,
    body: {
      persistent: {
        'search.insights.top_queries.latency.enabled': false,
        'search.insights.top_queries.cpu.enabled': false,
        'search.insights.top_queries.memory.enabled': false,
        'search.insights.top_queries.grouping.group_by': 'none',
        'search.insights.top_queries.exporter.type': 'none',
      },
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('createIndexByName', (indexName, body = {}) => {
  cy.request('POST', `${Cypress.env('openSearchUrl')}/${indexName}/_doc`, body);
});

Cypress.Commands.add('searchOnIndex', (indexName, body = {}) => {
  cy.request(
    'GET',
    `${Cypress.env('openSearchUrl')}/${indexName}/_search`,
    body
  );
});

Cypress.Commands.add('deleteIndexByName', (indexName) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('openSearchUrl')}/${indexName}`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add(
  'qi_waitForPageLoad',
  (fullUrl, { timeout = 60000, contains = null }) => {
    Cypress.log({
      message: `Wait for url: ${fullUrl} to be loaded.`,
    });
    cy.url({ timeout: timeout }).then(() => {
      contains && cy.contains(contains).should('be.visible');
    });
  }
);

Cypress.Commands.add('navigateToOverview', () => {
  cy.visit(QUERY_INSIGHTS_OVERVIEW_PATH);
  cy.qi_waitForPageLoad(QUERY_INSIGHTS_OVERVIEW_PATH, {
    contains: 'Query insights - Top N queries',
  });
});

Cypress.Commands.add('navigateToConfiguration', () => {
  cy.visit(QUERY_INSIGHTS_CONFIGURATION_PATH);
  cy.qi_waitForPageLoad(QUERY_INSIGHTS_CONFIGURATION_PATH, {
    contains: 'Query insights - Configuration',
  });
});
