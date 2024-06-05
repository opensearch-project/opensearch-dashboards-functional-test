/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';
import {
  DS_API,
  DEFAULT_DS_TITLE,
  OSD_TEST_DATA_SOURCE_ENDPOINT_NO_AUTH,
  AUTH_TYPE_NO_AUTH,
} from './constants';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
export const DisableLocalCluster = !!Cypress.env('DISABLE_LOCAL_CLUSTER'); // = hideLocalCluster

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
    url: `${BASE_PATH}/api/saved_objects/data-source`,
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
    url: `${BASE_PATH}/api/saved_objects/data-source`,
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

Cypress.Commands.add(
  'bulkUploadDocsToDataSourceNoAuth',
  (fixturePath, index) => {
    const sendBulkAPIRequest = (ndjson) => {
      const url = index
        ? `${Cypress.env('remoteDataSourceNoAuthUrl')}/${index}/_bulk`
        : `${Cypress.env('remoteDataSourceNoAuthUrl')}/_bulk`;
      cy.log('bulkUploadDocs')
        .request({
          method: 'POST',
          url,
          headers: {
            'content-type': 'application/json;charset=UTF-8',
            'osd-xsrf': true,
          },
          body: ndjson,
        })
        .then((response) => {
          if (response.body.errors) {
            console.error(response.body.items);
            throw new Error('Bulk upload failed');
          }
        });
    };

    cy.fixture(fixturePath, 'utf8').then((ndjson) => {
      sendBulkAPIRequest(ndjson);
    });

    cy.request({
      method: 'POST',
      url: `${Cypress.env('remoteDataSourceNoAuthUrl')}/_all/_refresh`,
    });
  }
);

Cypress.Commands.add(
  'deleteDataSourceIndexNoAuth',
  (indexName, options = {}) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('remoteDataSourceNoAuthUrl')}/${indexName}`,
      failOnStatusCode: false,
      ...options,
    });
  }
);

Cypress.Commands.add(
  'selectFromDataSourceSelectable',
  (dataSourceTitle, dataSourceId) => {
    cy.get('#dataSourceSelectableContextMenuPopover').click();
    cy.getElementByTestId('dataSourceSelectable')
      .find('input')
      .clear()
      .type(dataSourceTitle);
    cy.wait(1000);
    let dataSourceElement;
    if (dataSourceId) {
      dataSourceElement = cy.get(`#${dataSourceId}`);
    } else if (dataSourceTitle) {
      dataSourceElement = cy
        .get('.euiSelectableListItem')
        .contains(dataSourceTitle)
        .closest('.euiSelectableListItem');
    }
    dataSourceElement.click();
    // Close data source selectable manually if no data source element need to be clicked
    if (!dataSourceElement) {
      cy.getElementByTestId('dataSourceSelectable').last('button').click();
    }
  }
);

Cypress.Commands.add('checkDataSourceExist', (dataSourceTitle) => {
  cy.contains('li.euiSelectableListItem', dataSourceTitle)
    .should('exist') // Ensure the list item exists
    .within(() => {
      // Verify the 'Default' badge exists within the same list item
      if (dataSourceTitle === DEFAULT_DS_TITLE) {
        cy.get('span.euiBadge__text').should('exist').and('contain', 'Default'); // Ensure the badge contains the text 'Default'
      }
    });
});

Cypress.Commands.add('viewDataSourceAggregatedView', (dataSourceTitle) => {
  cy.get('#dataSourceSViewContextMenuPopover').click();
  cy.wait(10000);

  cy.get('.dataSourceAggregatedViewOuiPanel').within(() => {
    // Check if the Local cluster is selected

    cy.contains(dataSourceTitle).should('be.visible');
    cy.checkDataSourceExist(DEFAULT_DS_TITLE);
    cy.get('.dataSourceAggregatedViewOuiSwitch').should('not.checked');
    if (!DisableLocalCluster) {
      cy.contains('Local cluster').should('be.visible');
      cy.get('.dataSourceAggregatedViewOuiSwitch').click();
      cy.contains(dataSourceTitle).should('not.exist');
    }
  });
});

Cypress.Commands.add('createDataSourceNoAuthWithTitle', (title) => {
  miscUtils.visitPage(
    'app/management/opensearch-dashboards/dataSources/create'
  );

  cy.intercept('POST', '/api/saved_objects/data-source').as(
    'createDataSourceRequest'
  );
  cy.getElementByTestId('createDataSourceButton').should('be.disabled');
  cy.get('[name="dataSourceTitle"]').type(title);
  cy.get('[name="endpoint"]').type(OSD_TEST_DATA_SOURCE_ENDPOINT_NO_AUTH);
  cy.getElementByTestId('createDataSourceFormAuthTypeSelect').click();
  cy.get(`button[id=${AUTH_TYPE_NO_AUTH}]`).click();

  cy.getElementByTestId('createDataSourceButton').should('be.enabled');
  cy.get('[name="dataSourceDescription"]').type(
    'cypress test no auth data source'
  );
  cy.wait(1000);
  cy.getElementByTestId('createDataSourceButton').click();
  cy.wait('@createDataSourceRequest').then((interception) => {
    expect(interception.response.statusCode).to.equal(200);
  });
});
