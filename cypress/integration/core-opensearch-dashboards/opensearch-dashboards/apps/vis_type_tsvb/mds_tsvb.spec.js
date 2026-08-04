/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENT_TENANT } from '../../../../../utils/commands';
import { DS_NO_AUTH_LABEL } from '../../../../../utils/dashboards/datasource-management-dashboards-plugin/constants';
import {
  TSVB_INDEX_ID,
  TSVB_PATH_INDEX_DATA,
  TSVB_CREATE_URL,
  VIS_APP_PATH,
  TSVB_INDEX_START_TIME,
  TSVB_INDEX_END_TIME,
  TSVB_INDEX_PATTERN,
  TSVB_VIS_TYPE,
} from '../../../../../utils/dashboards/vis_type_tsvb/constants';

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    cy.deleteIndex(TSVB_INDEX_ID);
    cy.bulkUploadDocs(TSVB_PATH_INDEX_DATA);

    // Dashboards requires an index pattern to continue to the Create Visualization stage
    cy.deleteIndexPattern(TSVB_INDEX_PATTERN);

    cy.wait(1000);
    cy.deleteSavedObjectByType(TSVB_VIS_TYPE, TSVB_INDEX_ID);

    cy.createIndexPattern(TSVB_INDEX_PATTERN, {
      title: TSVB_INDEX_PATTERN,
      timeFieldName: 'timestamp',
    });

    cy.deleteDataSourceIndexNoAuth(TSVB_INDEX_ID);
    cy.deleteAllDataSources();

    cy.createDataSourceNoAuth();
    cy.bulkUploadDocsToDataSourceNoAuth(TSVB_PATH_INDEX_DATA);
    // Visit the page
    cy.log('create a new tsvb visualization: ', TSVB_CREATE_URL);
    cy.visit(TSVB_CREATE_URL);
    cy.url().should('contain', VIS_APP_PATH);
    cy.setTopNavDate(TSVB_INDEX_START_TIME, TSVB_INDEX_END_TIME);

    // Wait for page to load
    cy.waitForLoader();
  });

  after(() => {
    cy.deleteIndex(TSVB_INDEX_ID);
    cy.deleteIndexPattern(TSVB_INDEX_PATTERN);

    cy.deleteDataSourceIndexNoAuth(TSVB_INDEX_ID);
    cy.deleteAllDataSources();
  });

  describe('TSVB Visualization (MDS is enabled)', () => {
    [
      {
        dataSourceName: DS_NO_AUTH_LABEL,
        canvasExists: 'exist',
      },
    ].forEach(({ dataSourceName, canvasExists }) => {
      it(`should query data from ${dataSourceName} and resulting visualization should ${canvasExists}`, () => {
        cy.contains('button', 'Panel options').click();
        cy.contains('label', 'Data source');
        // Click on the dropdown to open it
        cy.get('[data-test-subj="dataSourceSelectorComboBox"]').click();
        cy.contains('[role="option"]', dataSourceName).click();
        // use the default index for query data
        cy.tsvbSaveVisualization();
        cy.get('canvas').should(canvasExists);
      });
    });
  });
}
