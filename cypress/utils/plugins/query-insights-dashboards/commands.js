/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const {
  ADMIN_AUTH,
  OVERVIEW_PATH,
  CONFIGURATION_PATH,
  BASE_PATH,
  LIVEQUERIES_PATH,
} = require('./constants');

/**
 * Overwrites the default visit command to authenticate before visiting
 */
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  // Add the basic auth header when security enabled in the Opensearch cluster
  if (Cypress.env('security_enabled')) {
    if (options) {
      options.auth = ADMIN_AUTH;
    } else {
      options = { auth: ADMIN_AUTH };
    }
    // Add query parameters - select the default OpenSearch Dashboards tenant
    options.qs = { security_tenant: 'private' };
    return originalFn(url, options);
  } else {
    return originalFn(url, options);
  }
});

/**
 * Overwrite request command to support authentication similar to visit.
 * The request function parameters can be url, or (method, url), or (method, url, body).
 */
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  const defaults = {};
  // Add the basic authentication header when security enabled in the Opensearch cluster
  if (Cypress.env('SECURITY_ENABLED')) {
    defaults.auth = ADMIN_AUTH;
  }

  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = { ...args[0] };
  } else if (args.length === 1) {
    [options.url] = args;
  } else if (args.length === 2) {
    [options.method, options.url] = args;
  } else if (args.length === 3) {
    [options.method, options.url, options.body] = args;
  }

  return originalFn({ ...defaults, ...options });
});

Cypress.Commands.add('getElementByText', (locator, text) => {
  Cypress.log({ message: `Get element by text: ${text}` });
  return locator
    ? cy.get(locator).filter(`:contains("${text}")`).should('be.visible')
    : cy.contains(text).should('be.visible');
});

Cypress.Commands.add('login', () => {
  // much faster than log in through UI
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}/auth/login`,
    body: ADMIN_AUTH,
    headers: {
      'osd-xsrf': true,
    },
  });
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
Cypress.Commands.add('setWindowSize', (size = '1m') => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('openSearchUrl')}/_cluster/settings`,
    body: {
      persistent: {
        'search.insights.top_queries.latency.window_size': size,
        'search.insights.top_queries.cpu.window_size': size,
        'search.insights.top_queries.memory.window_size': size,
      },
    },
    failOnStatusCode: true,
  });
});

Cypress.Commands.add('createIndexByName', (indexName, body = {}) => {
  cy.request('POST', `${Cypress.env('openSearchUrl')}/${indexName}/_doc`, body);
});

Cypress.Commands.add('searchOnIndex', (indexName, body = {}) => {
  cy.request('GET', `${Cypress.env('openSearchUrl')}/${indexName}/_search`, body);
});

Cypress.Commands.add('deleteIndexByName', (indexName) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('openSearchUrl')}/${indexName}`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('waitForPageLoad', (fullUrl, { timeout = 60000, contains = null }) => {
  Cypress.log({
    message: `Wait for url: ${fullUrl} to be loaded.`,
  });
  cy.url({ timeout: timeout }).should('include', fullUrl);

  if (contains) {
    const isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
    const ciTimeout = isCI ? Math.max(timeout, 180000) : timeout; // At least 3 minutes in CI
    cy.log(
      `Waiting for content "${contains}" with timeout: ${ciTimeout}ms (${isCI ? 'CI' : 'Local'})`
    );

    // Wait for the specific content with retries and longer timeout in CI
    cy.contains(contains, { timeout: ciTimeout }).should('be.visible');
  }
});

Cypress.Commands.add('navigateToOverview', () => {
  cy.visit(OVERVIEW_PATH);

  const isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
  const baseTimeout = isCI ? 240000 : 90000; // 4 minutes in CI, 1.5 minutes locally

  // Wait for the page to load and ensure the plugin is ready
  cy.waitForPageLoad(OVERVIEW_PATH, {
    timeout: baseTimeout,
    contains: 'Query insights - Top N queries',
  });

  // Additional wait to ensure all components are fully rendered
  const tableTimeout = isCI ? 60000 : 30000; // 1 minute in CI, 30 seconds locally
  cy.get('.euiBasicTable', { timeout: tableTimeout }).should('exist');
});

Cypress.Commands.add('navigateToConfiguration', () => {
  cy.visit(CONFIGURATION_PATH);
  cy.waitForPageLoad(CONFIGURATION_PATH, { contains: 'Query insights - Configuration' });
});

Cypress.Commands.add('navigateToLiveQueries', () => {
  cy.visit(LIVEQUERIES_PATH);
  cy.waitForPageLoad(LIVEQUERIES_PATH, {
    contains: 'Query insights - In-flight queries scoreboard',
  });
});

Cypress.Commands.add('waitForPluginToLoad', () => {
  // CI environments need much longer waits for plugin initialization
  const isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
  const waitTime = isCI ? 10000 : 3000; // 10 seconds in CI, 3 seconds locally

  cy.log(`waitForPluginToLoad: ${isCI ? 'CI' : 'Local'} environment, waiting ${waitTime}ms`);
  cy.wait(waitTime);
});

Cypress.Commands.add('waitForQueryInsightsPlugin', () => {
  const isCI = Cypress.env('CI') || !Cypress.config('isInteractive');
  const timeout = isCI ? 360000 : 120000; // 6 minutes in CI, 2 minutes locally

  // Enhanced debugging
  cy.log(`=== DEBUGGING INFO ===`);
  cy.log(`Cypress.env('CI'): ${Cypress.env('CI')}`);
  cy.log(`Cypress.config('isInteractive'): ${Cypress.config('isInteractive')}`);
  cy.log(`Detected environment: ${isCI ? 'CI' : 'Local'}`);
  cy.log(`Timeout: ${timeout}ms (${timeout / 1000} seconds)`);

  // Much longer initial wait for plugin registration in CI
  const pluginWait = isCI ? 60000 : 5000; // 60 seconds in CI!
  cy.log(`Initial wait ${pluginWait}ms (${pluginWait / 1000}s) for plugin registration`);
  cy.wait(pluginWait);

  cy.visit(OVERVIEW_PATH, { timeout: timeout });

  cy.get('body', { timeout: timeout }).should('be.visible');

  // Log what we find on the page for debugging
  cy.get('body').then(($body) => {
    const pageText = $body.text();
    cy.log(`Page content preview: ${pageText.substring(0, 300)}...`);

    const hasQueryInsights = pageText.includes('Query insights');
    const hasTopNQueries = pageText.includes('Top N queries');
    cy.log(`Has "Query insights" text: ${hasQueryInsights}`);
    cy.log(`Has "Top N queries" text: ${hasTopNQueries}`);
  });

  cy.get('body').then(($body) => {
    if ($body.find('h1:contains("Query insights")').length === 0) {
      // If title is not immediately visible, wait for it with a long timeout
      cy.log(`Title not found immediately, waiting with ${timeout}ms timeout...`);
      cy.contains('Query insights', { timeout: timeout }).should('be.visible');
    } else {
      cy.log('Title found immediately!');
    }
  });

  // Additional wait for React components to fully render
  const renderWait = isCI ? 15000 : 2000;
  cy.log(`Final wait ${renderWait}ms for React rendering`);
  cy.wait(renderWait);

  cy.log(`=== PLUGIN LOADING COMPLETE ===`);
});
