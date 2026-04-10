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
        [`search.insights.top_queries.${metric}.window_size`]: '5m',
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
        'search.insights.top_queries.latency.window_size': '5m',
        'search.insights.top_queries.cpu.window_size': '5m',
        'search.insights.top_queries.memory.window_size': '5m',
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
    Cypress.log({
      message: `Wait for url: ${fullUrl} to be loaded.`,
    });
    // Split on '#' so that an injected query-string such as
    // ?security_tenant=private does not break the check.
    const [urlBase, urlHash] = fullUrl.split('#');
    cy.url({ timeout: timeout }).should('include', urlBase);
    if (urlHash) {
      cy.url().should('include', `#${urlHash}`);
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

/**
 * Poll the OpenSearch _insights/top_queries API until data is available.
 * Returns once at least one query is found. Retries up to maxRetries times
 * with a 5-second delay between attempts.
 */
Cypress.Commands.add(
  'waitForTopQueriesData',
  (metric = 'latency', maxRetries = 12) => {
    var checkData = function (retries) {
      cy.request({
        method: 'GET',
        url: Cypress.env('openSearchUrl') + '/_insights/top_queries',
        qs: { type: metric },
        failOnStatusCode: false,
      }).then(function (response) {
        var body = response.body || {};
        var queries = body.top_queries || [];
        if (queries.length > 0) {
          cy.log('Found ' + queries.length + ' top queries');
          return;
        }
        if (retries <= 0) {
          throw new Error(
            'No top queries data available after polling. ' +
              'The query insights plugin may not have captured any queries.'
          );
        }
        cy.log(
          'No top queries data yet, retrying... (' + retries + ' retries left)'
        );
        cy.wait(5000);
        checkData(retries - 1);
      });
    };
    checkData(maxRetries);
  }
);

/**
 * Fetch a query ID from the OpenSearch _insights/top_queries API (with
 * retries) and navigate directly to the query details page. This bypasses
 * clicking table links which is fragile due to OUI/EUI class differences
 * and multiple tables on the overview page.
 */
Cypress.Commands.add('navigateToQueryDetails', function () {
  var isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
  var timeout = isCI ? 120000 : 60000;
  var to = new Date().toISOString();
  var from = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  var fetchAndNavigate = function (retries) {
    cy.request({
      method: 'GET',
      url: Cypress.env('openSearchUrl') + '/_insights/top_queries',
      qs: { type: 'latency' },
      failOnStatusCode: false,
    }).then(function (response) {
      var body = response.body || {};
      var queries = body.top_queries || [];
      if (queries.length === 0 && retries > 0) {
        cy.log('No queries for navigation, retrying...');
        cy.wait(5000);
        fetchAndNavigate(retries - 1);
        return;
      }
      // Filter for individual queries (group_by === 'NONE')
      var individual = queries.filter(function (q) {
        return !q.group_by || q.group_by === 'NONE';
      });
      expect(individual.length).to.be.greaterThan(0);
      var query = individual[0];
      var basePath = QUERY_INSIGHTS_OVERVIEW_PATH.split('#')[0];
      cy.visit(
        basePath +
          '#/query-details?from=' +
          encodeURIComponent(from) +
          '&to=' +
          encodeURIComponent(to) +
          '&id=' +
          encodeURIComponent(query.id) +
          '&verbose=true'
      );
      cy.contains('Query details', { timeout: timeout }).should('be.visible');
      cy.get('[data-test-subj="query-details-summary-section"]', {
        timeout: timeout,
      }).should('be.visible');
    });
  };
  fetchAndNavigate(6);
});

/**
 * Same as navigateToQueryDetails but for group details pages.
 */
Cypress.Commands.add('navigateToGroupDetails', function () {
  var isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
  var timeout = isCI ? 120000 : 60000;
  var to = new Date().toISOString();
  var from = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  var fetchAndNavigate = function (retries) {
    cy.request({
      method: 'GET',
      url: Cypress.env('openSearchUrl') + '/_insights/top_queries',
      qs: { type: 'latency' },
      failOnStatusCode: false,
    }).then(function (response) {
      var body = response.body || {};
      var queries = body.top_queries || [];
      if (queries.length === 0 && retries > 0) {
        cy.log('No queries for navigation, retrying...');
        cy.wait(5000);
        fetchAndNavigate(retries - 1);
        return;
      }
      // Filter for grouped queries (group_by === 'SIMILARITY')
      var grouped = queries.filter(function (q) {
        return q.group_by && q.group_by !== 'NONE';
      });
      expect(grouped.length).to.be.greaterThan(0);
      var query = grouped[0];
      var basePath = QUERY_INSIGHTS_OVERVIEW_PATH.split('#')[0];
      cy.visit(
        basePath +
          '#/query-group-details?from=' +
          encodeURIComponent(from) +
          '&to=' +
          encodeURIComponent(to) +
          '&id=' +
          encodeURIComponent(query.id) +
          '&verbose=true'
      );
      cy.contains('Query group details', { timeout: timeout }).should(
        'be.visible'
      );
      cy.get('.euiPanel h4', { timeout: timeout }).should('be.visible');
    });
  };
  fetchAndNavigate(6);
});
