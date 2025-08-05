/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FF_FIXTURE_BASE_PATH,
  INGEST_NODE_API_PATH,
  SEARCH_MODELS_API_PATH,
  SEARCH_NODE_API_PATH,
} from '../../../utils/constants';

Cypress.Commands.add('createConnector', (connectorBody) =>
  cy
    .request({
      method: 'POST',
      failOnStatusCode: false, // may fail for envs where connector creation is prohibited
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
    return url.substring(url.lastIndexOf('/') + 1);
  });
});

Cypress.Commands.add('mockIngestion', (funcMockedOn) => {
  cy.fixture(
    FF_FIXTURE_BASE_PATH + 'semantic_search/ingest_response.json'
  ).then((ingestResponse) => {
    cy.intercept('POST', INGEST_NODE_API_PATH, {
      statusCode: 200,
      body: ingestResponse,
    }).as('ingestionRequest');
    funcMockedOn();
    cy.wait('@ingestionRequest');
  });
});

Cypress.Commands.add('mockModelSearch', (funcMockedOn) => {
  cy.fixture(FF_FIXTURE_BASE_PATH + 'search_models_response.json').then(
    (searchModelsResponse) => {
      cy.intercept('POST', SEARCH_MODELS_API_PATH, {
        statusCode: 200,
        body: searchModelsResponse,
      }).as('searchModelsRequest');

      funcMockedOn();

      cy.wait('@searchModelsRequest');
    }
  );
});
