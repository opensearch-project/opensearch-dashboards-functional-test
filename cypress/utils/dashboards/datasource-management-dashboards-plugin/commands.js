/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';
import { DS_API } from './constants';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

Cypress.Commands.add('deleteAllDataSources', () => {
  // Clean all data sources
  cy.request('GET', `${BASE_PATH}${DS_API.DATA_SOURCES_LISTING}`).then(
    (resp) => {
      if (resp && resp.body && resp.body.saved_objects) {
        resp.body.saved_objects.map(({ id }) => {
          cy.request({
            method: 'DELETE',
            url: `${BASE_PATH}${DS_API.DELETE_DATA_SOURCE}${id}`,
            body: { force: false },
            headers: {
              'osd-xsrf': true,
            },
          });
        });
      }
    }
  );
});

Cypress.Commands.add('createDataSourceNoAuth', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.config('baseUrl')}/api/saved_objects/data-source`,
    headers: {
      'osd-xsrf': true,
    },
    body: {
      attributes: {
        title: 'RemoteDataSourceNoAuth',
        endpoint: Cypress.env('remoteDataSourceNoAuthUrl'),
        auth: {
          type: 'no_auth',
        },
      },
    },
  }).then((resp) => {
    if (resp && resp.body && resp.body.id) {
      return [resp.body.id, 'RemoteDataSourceNoAuth'];
    }
  });
});

Cypress.Commands.add('createDataSourceBasicAuth', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.config('baseUrl')}/api/saved_objects/data-source`,
    headers: {
      'osd-xsrf': true,
    },
    body: {
      attributes: {
        title: 'RemoteDataSourceBasicAuth',
        endpoint: Cypress.env('remoteDataSourceBasicAuthUrl'),
        auth: {
          type: 'username_password',
          credentials: {
            username: Cypress.env('remoteDataSourceBasicAuthUsername'),
            password: Cypress.env('remoteDataSourceBasicAuthPassword'),
          },
        },
      },
    },
  }).then((resp) => {
    if (resp && resp.body && resp.body.id) {
      return [resp.body.id, 'RemoteDataSourceBasicAuth'];
    }
  });
});

Cypress.Commands.add('createDataSource', (dataSourceJSON) => {
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}${DS_API.CREATE_DATA_SOURCE}`,
    headers: {
      'osd-xsrf': true,
    },
    body: dataSourceJSON,
  });
});

Cypress.Commands.add(
  'getColumnHeaderByNameAndClickForSorting',
  (identifier, columnHeaderName) => {
    cy.get(identifier).contains(columnHeaderName).click({ force: true });
  }
);

Cypress.Commands.add('visitDataSourcesListingPage', () => {
  // Visit Data Sources OSD
  miscUtils.visitPage('app/management/opensearch-dashboards/dataSources');

  // Common text to wait for to confirm page loaded, give up to 60 seconds for initial load
  cy.contains(
    'Create and manage data source connections to help you retrieve data from multiple OpenSearch compatible sources.',
    { timeout: 60000 }
  );
});
