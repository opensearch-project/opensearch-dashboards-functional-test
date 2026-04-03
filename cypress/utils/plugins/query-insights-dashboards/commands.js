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
        [`search.insights.top_queries.${metric}.window_size`]: '1m',
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
        'search.insights.top_queries.latency.window_size': '1m',
        'search.insights.top_queries.cpu.window_size': '1m',
        'search.insights.top_queries.memory.window_size': '1m',
        'search.insights.top_queries.exporter.type': 'none',
      },
    },
    failOnStatusCode: true,
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
    failOnStatusCode: true,
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
  'waitForPageLoad',
  (fullUrl, { timeout = 60000, contains = null }) => {
    // Extract path and hash so extra query params (e.g. ?security_tenant=private)
    // don't cause the assertion to fail.
    const pathAndHash = fullUrl.replace(/^https?:\/\/[^/]+/, '');
    const [path, hash] = pathAndHash.split('#');

    Cypress.log({
      message: `Wait for url containing path: ${path}${
        hash ? ' hash: ' + hash : ''
      }`,
    });
    cy.url({ timeout: timeout }).should('include', path);
    if (hash) {
      cy.url().should('include', `#${hash}`);
    }

    if (contains) {
      const isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
      const ciTimeout = isCI ? Math.max(timeout, 180000) : timeout;
      cy.log(
        `Waiting for content "${contains}" with timeout: ${ciTimeout}ms (${
          isCI ? 'CI' : 'Local'
        })`
      );
      cy.contains(contains, { timeout: ciTimeout }).should('be.visible');
    }
  }
);

Cypress.Commands.add('navigateToOverview', () => {
  cy.visit(QUERY_INSIGHTS_OVERVIEW_PATH);

  const isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
  const baseTimeout = isCI ? 240000 : 90000;

  cy.waitForPageLoad(QUERY_INSIGHTS_OVERVIEW_PATH, {
    timeout: baseTimeout,
    contains: 'Query insights - Top N queries',
  });

  const tableTimeout = isCI ? 60000 : 30000;
  cy.get('.euiBasicTable', { timeout: tableTimeout }).should('exist');
});

Cypress.Commands.add('navigateToConfiguration', () => {
  cy.visit(QUERY_INSIGHTS_CONFIGURATION_PATH);
  cy.waitForPageLoad(QUERY_INSIGHTS_CONFIGURATION_PATH, {
    contains: 'Query insights - Configuration',
  });
});

Cypress.Commands.add('waitForQueryInsightsPlugin', () => {
  const isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
  const timeout = isCI ? 360000 : 120000;

  cy.visit(QUERY_INSIGHTS_OVERVIEW_PATH, { timeout: 60000 });

  cy.contains('Query insights - Top N queries', { timeout }).should(
    'be.visible'
  );
});
