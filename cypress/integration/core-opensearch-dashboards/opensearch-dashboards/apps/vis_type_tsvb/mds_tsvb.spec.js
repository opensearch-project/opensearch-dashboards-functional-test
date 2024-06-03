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

describe('TSVB Visualization', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    cy.deleteIndex(TSVB_INDEX_ID);
    cy.bulkUploadDocs(TSVB_PATH_INDEX_DATA);

    // Dashboards requires an index pattern to continue to the Create Visualization stage
    cy.deleteIndexPattern(TSVB_INDEX_PATTERN);
    cy.createIndexPattern(TSVB_INDEX_PATTERN, {
      title: TSVB_INDEX_ID,
      timeFieldName: 'timestamp',
    });

    cy.deleteSavedObjectByType(TSVB_VIS_TYPE, TSVB_INDEX_ID);

    // Visit the page
    cy.log('create a new tsvb visualization: ', TSVB_CREATE_URL);
    cy.visit(TSVB_CREATE_URL);
    cy.url().should('contain', VIS_APP_PATH);
    cy.setTopNavDate(TSVB_INDEX_START_TIME, TSVB_INDEX_END_TIME);

    // Wait for page to load
    cy.waitForLoader();
  });

  if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
    before(() => {
      cy.deleteDataSourceIndexNoAuth(TSVB_INDEX_ID);
      cy.createDataSourceNoAuth();
      cy.bulkUploadDocsToDataSourceNoAuth(TSVB_PATH_INDEX_DATA);
    });

    describe('When MDS is enabled', () => {
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

          // Find the option you want to select by its text and click on it
          cy.contains('[role="option"]', dataSourceName).click();
          cy.get('input[data-test-subj="metricsIndexPatternInput"]').type(
            TSVB_INDEX_ID
          );
          cy.tsvbSaveVisualization();

          cy.get('canvas').should(canvasExists);
        });
      });
    });
  } else {
    describe('When MDS is disabled', () => {
      it('should query from local cluster', () => {
        cy.contains('button', 'Panel options').click();
        cy.get('input[data-test-subj="metricsIndexPatternInput"]').type(
          TSVB_INDEX_ID
        );
        cy.tsvbSaveVisualization();
        // Visualization should be drawn; correct visualizations do not have warning messages
        cy.get('canvas').should('exist');
      });
    });
  }

  after(() => {
    cy.deleteIndex(TSVB_INDEX_ID);
    cy.deleteIndexPattern(TSVB_INDEX_PATTERN);

    if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
      cy.deleteDataSourceIndexNoAuth(TSVB_INDEX_ID);
      cy.deleteAllDataSources();
    }
  });
});
