/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH, IM_API } from './constants';

const ADMIN_AUTH = {
  username: Cypress.env('username'),
  password: Cypress.env('password'),
};

/**
 * This overwrites the default visit command to authenticate before visiting
 * webpages if SECURITY_ENABLED cypress env var is true
 */
Cypress.Commands.overwrite('visit', (orig, url, options) => {
  if (Cypress.env('SECURITY_ENABLED')) {
    let newOptions = options;
    if (options) {
      newOptions['auth'] = ADMIN_AUTH;
    } else {
      newOptions = {
        auth: ADMIN_AUTH,
      };
    }
    newOptions.qs = { security_tenant: 'private' };
    orig(url, newOptions);
  } else {
    orig(url, options);
  }
});

/**
 * Overwrite request command to support authentication similar to visit.
 * The request function parameters can be url, or (method, url), or (method, url, body).
 */
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  let defaults = {};
  if (Cypress.env('SECURITY_ENABLED')) {
    defaults.auth = ADMIN_AUTH;
  }

  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = Object.assign({}, args[0]);
  } else if (args.length === 1) {
    [options.url] = args;
  } else if (args.length === 2) {
    [options.method, options.url] = args;
  } else if (args.length === 3) {
    [options.method, options.url, options.body] = args;
  }

  return originalFn(Object.assign({}, defaults, options));
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

Cypress.Commands.add('getElementByTestId', (testId) => {
  return cy.get(`[data-test-subj=${testId}]`);
});

Cypress.Commands.add('deleteAllIndices', () => {
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}/index*,sample*,opensearch_dashboards*`
  );
});

Cypress.Commands.add('getIndexSettings', (index) => {
  cy.request('GET', `${Cypress.env('openSearchUrl')}/${index}/_settings`);
});

Cypress.Commands.add('updateIndexSettings', (index, settings) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}/${index}/_settings`,
    settings
  );
});

Cypress.Commands.add('createIndex', (index, policyID = null, settings = {}) => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/${index}`, settings);
  if (policyID != null) {
    const body = { policy_id: policyID };
    cy.request(
      'POST',
      `${Cypress.env('openSearchUrl')}${IM_API.ADD_POLICY_BASE}/${index}`,
      body
    );
  }
});

Cypress.Commands.add('deleteIndex', (indexName) => {
  cy.request('DELETE', `${Cypress.env('openSearchUrl')}/${indexName}`);
});

Cypress.Commands.add('createIndexTemplate', (name, template) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${IM_API.INDEX_TEMPLATE_BASE}/${name}`,
    template
  );
});

Cypress.Commands.add('createDataStream', (name) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${IM_API.DATA_STREAM_BASE}/${name}`
  );
});

Cypress.Commands.add('deleteDataStreams', (names) => {
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${IM_API.DATA_STREAM_BASE}/${names}`
  );
});

Cypress.Commands.add('rollover', (target) => {
  cy.request('POST', `${Cypress.env('openSearchUrl')}/${target}/_rollover`);
});
