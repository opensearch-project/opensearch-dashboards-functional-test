/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALERTING_API, BASE_PATH } from '../../constants';

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('createMonitor', (monitorJSON) => {
  cy.request(
    'POST',
    `${Cypress.env('openSearchUrl')}${ALERTING_API.MONITOR_BASE}`,
    monitorJSON
  );
});

Cypress.Commands.add('createAndExecuteMonitor', (monitorJSON) => {
  cy.request(
    'POST',
    `${Cypress.env('openSearchUrl')}${ALERTING_API.MONITOR_BASE}`,
    monitorJSON
  ).then((response) => {
    cy.request(
      'POST',
      `${Cypress.env('openSearchUrl')}${ALERTING_API.MONITOR_BASE}/${
        response.body._id
      }/_execute`
    );
  });
});

Cypress.Commands.add('executeMonitor', (monitorID) => {
  cy.request(
    'POST',
    `${Cypress.env('openSearchUrl')}${
      ALERTING_API.MONITOR_BASE
    }/${monitorID}/_execute`
  );
});

Cypress.Commands.add('executeCompositeMonitor', (monitorID) => {
  cy.request(
    'POST',
    `${Cypress.env('openSearchUrl')}${
      ALERTING_API.WORKFLOW_BASE
    }/${monitorID}/_execute`
  );
});

Cypress.Commands.add('deleteAllAlerts', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env(
      'openSearchUrl'
    )}/.opendistro-alerting-alert*/_delete_by_query`,
    body: {
      query: {
        match_all: {},
      },
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('deleteMonitorByName', (monitorName) => {
  const body = {
    query: {
      match: {
        'monitor.name': {
          query: monitorName,
          operator: 'and',
        },
      },
    },
  };
  cy.request(
    'GET',
    `${Cypress.env('openSearchUrl')}${ALERTING_API.MONITOR_BASE}/_search`,
    body
  ).then((response) => {
    cy.request(
      'DELETE',
      `${Cypress.env('openSearchUrl')}${ALERTING_API.MONITOR_BASE}/${
        response.body.hits.hits[0]._id
      }`
    );
  });
});

Cypress.Commands.add('deleteAllMonitors', () => {
  const body = {
    size: 200,
    query: {
      exists: {
        match_all: {},
      },
    },
  };
  cy.request({
    method: 'GET',
    url: `${Cypress.env('openSearchUrl')}${ALERTING_API.MONITOR_BASE}/_search`,
    failOnStatusCode: false, // In case there is no alerting config index in cluster, where the status code is 404
    body,
  }).then((response) => {
    if (response.status === 200) {
      const monitors = response.body.hits.hits.sort((monitor) =>
        monitor._source.type === 'workflow' ? -1 : 1
      );
      for (let i = 0; i < monitors.length; i++) {
        if (monitors[i]._id) {
          cy.request({
            method: 'DELETE',
            url: `${Cypress.env('openSearchUrl')}${
              monitors[i]._source.type === 'workflow'
                ? ALERTING_API.WORKFLOW_BASE
                : ALERTING_API.MONITOR_BASE
            }/${monitors[i]._id}`,
            failOnStatusCode: false,
          });
        }
      }
    } else {
      cy.log('Failed to get all monitors.', response);
    }
  });
});

Cypress.Commands.add('createIndexByName', (indexName, body = {}) => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/${indexName}`, body);
});

Cypress.Commands.add('deleteIndexByName', (indexName) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('openSearchUrl')}/${indexName}`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add(
  'insertDocumentToIndex',
  (indexName, documentId, documentBody) => {
    cy.request(
      'POST',
      `${Cypress.env('openSearchUrl')}/${indexName}/_doc/${documentId}`,
      documentBody
    );
  }
);

Cypress.Commands.add('loadSampleEcommerceData', () => {
  cy.request({
    method: 'POST',
    headers: { 'osd-xsrf': 'opensearch-dashboards' },
    url: `${BASE_PATH}/api/sample_data/ecommerce`,
  });
});
