/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FF_FIXTURE_BASE_PATH,
  INGEST_NODE_API_PATH,
  SEARCH_NODE_API_PATH,
} from '../../../utils/constants';

Cypress.Commands.add('getElementByDataTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('createConnector', (connectorBody) =>
  cy
    .request({
      method: 'POST',
      form: false,
      url: 'api/console/proxy',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      qs: {
        path: '_plugins/_ml/connectors/_create',
        method: 'POST',
      },
      body: connectorBody,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('registerModel', ({ body }) =>
  cy
    .request({
      method: 'POST',
      form: false,
      url: 'api/console/proxy',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      qs: {
        path: '_plugins/_ml/models/_register',
        method: 'POST',
      },
      body: body,
    })
    .then(({ body }) => {
      return body;
    })
);

Cypress.Commands.add('deployModel', (modelId) =>
  cy
    .request({
      method: 'POST',
      form: false,
      url: 'api/console/proxy',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      qs: {
        path: `_plugins/_ml/models/${modelId}/_deploy`,
        method: 'POST',
      },
    })
    .then(({ body }) => {
      return body;
    })
);

Cypress.Commands.add('undeployMLCommonsModel', (modelId) =>
  cy
    .request({
      method: 'POST',
      form: false,
      url: 'api/console/proxy',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      qs: {
        path: `_plugins/_ml/models` + `/${modelId}` + `/_undeploy`,
        method: 'POST',
      },
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('deleteMLCommonsModel', (modelId) =>
  cy
    .request({
      method: 'POST',
      form: false,
      url: 'api/console/proxy',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      qs: {
        path: `_plugins/_ml/models` + `/${modelId}`,
        method: 'POST',
      },
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('getWorkflowId', () => {
  return cy.url().then((url) => {
    return url.substring(url.lastIndexOf('/') + 1); // Return the extracted workflow ID
  });
});

Cypress.Commands.add('mockIngestion', (funcMockedOn) => {
  cy.intercept('POST', INGEST_NODE_API_PATH, {
    statusCode: 200,
    body: {},
  }).as('ingestionRequest');
  funcMockedOn();
  cy.wait('@ingestionRequest');
});

Cypress.Commands.add('mockSearchIndex', (funcMockedOn) => {
  cy.fixture(FF_FIXTURE_BASE_PATH + 'search_response.json').then(
    (searchResults) => {
      cy.intercept('POST', SEARCH_NODE_API_PATH + '/*', {
        statusCode: 200,
        body: searchResults,
      }).as('searchRequest');

      funcMockedOn();

      cy.wait('@searchRequest');
    }
  );
});
