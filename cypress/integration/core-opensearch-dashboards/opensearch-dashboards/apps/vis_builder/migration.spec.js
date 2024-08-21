/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BASE_PATH,
  toTestId,
  VB_APP_PATH,
  VB_INDEX_ID,
  VB_METRIC_VIS_TITLE,
  VB_PATH_INDEX_DATA,
  VISUALIZATION_PATH_SO_DATA,
} from '../../../../../utils/constants';
import { CURRENT_TENANT } from '../../../../../utils/commands';

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Vis Builder: Metric Chart', () => {
    before(() => {
      CURRENT_TENANT.newTenant = 'global';
      cy.fleshTenantSettings();
      cy.deleteIndex(VB_INDEX_ID);
      cy.bulkUploadDocs(VB_PATH_INDEX_DATA);
      cy.importSavedObjects(VISUALIZATION_PATH_SO_DATA);
    });

    beforeEach(() => {
      CURRENT_TENANT.newTenant = 'global';
      cy.fleshTenantSettings();
    });

    it('Show existing visualizations in Visualize and navigate to it', () => {
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('input[type="search"]').type(`${VB_METRIC_VIS_TITLE}{enter}`);
      cy.get('.euiBasicTable-loading').should('not.exist'); // wait for the loading to stop
      cy.getElementByTestId(
        `visListingTitleLink-${toTestId(VB_METRIC_VIS_TITLE)}`
      )
        .should('exist')
        .click();
      cy.location('pathname').should('contain', VB_APP_PATH);
    });

    it('Should click pencil icon for Visbuilder object and check for absence of "Import to Visbuilder" option', () => {
      cy.visit(`${BASE_PATH}/app/visualize`);

      cy.get('input[type="search"]').type(`${VB_METRIC_VIS_TITLE}{enter}`);
      cy.get('.euiBasicTable-loading').should('not.exist');

      // Find the specific row for the Visbuilder object
      cy.contains('tr', 'VB: Basic Metric Chart').within(() => {
        // Click the pencil icon using the test id "dashboardEditBtn"
        cy.getElementByTestId('dashboardEditBtn').click();
      });

      // Check that the popover does not contain "Import to Visbuilder" option
      cy.get('.euiPopover__panel').should('be.visible');
      cy.contains('Import to VisBuilder').should('not.exist');
    });

    it('Should click pencil icon for Line Chart and find "Import to Visbuilder" option', () => {
      cy.visit(`${BASE_PATH}/app/visualize`);

      // Search for the line chart visualization
      cy.get('input[type="search"]').clear().type('line-1{enter}');
      cy.get('.euiBasicTable-loading').should('not.exist');

      // Find the specific row for the Line Chart object
      cy.contains('tr', 'line-1').within(() => {
        // Click the pencil icon using the test id "dashboardEditBtn"
        cy.getElementByTestId('dashboardEditBtn').click();
      });

      // Check that the popover contains "Import to Visbuilder" option
      cy.get('.euiPopover__panel').should('be.visible');
      cy.contains('Import to VisBuilder').should('exist');
    });

    it('Should import Line Chart to Visbuilder and verify breadcrumb', () => {
      cy.visit(`${BASE_PATH}/app/visualize`);

      // Search for the line chart visualization
      cy.get('input[type="search"]').clear().type('line-1{enter}');
      cy.get('.euiBasicTable-loading').should('not.exist');

      // Find the specific row for the Line Chart object
      cy.contains('tr', 'line-1').within(() => {
        // Click the pencil icon using the test id "dashboardEditBtn"
        cy.getElementByTestId('dashboardEditBtn').click();
      });

      // Click the "Import to Visbuilder" button using its specific data test subject
      cy.getElementByTestId('dashboardImportToVisBuilder').click();

      // Check the last breadcrumb
      cy.getElementByTestId('breadcrumb last').should(
        'contain',
        'New visualization'
      );
    });

    it('verify Save button is clickable and saves the visualization', () => {
      cy.visit(`${BASE_PATH}/app/visualize`);

      // Search for the line chart visualization
      cy.get('input[type="search"]').clear().type('line-1{enter}');
      cy.get('.euiBasicTable-loading').should('not.exist');

      // Find the specific row for the Line Chart object and click the title to navigate
      cy.contains('tr', 'line-1').within(() => {
        cy.get('[data-test-subj^="visListingTitleLink"]').click();
      });

      // Find the Save button and click it
      cy.getElementByTestId('visualizeSaveButton').click();

      // Verify that clicking the Save button causes a popup to appear
      cy.getElementByTestId('savedObjectSaveModal').should('be.visible');

      // Find the Save button in the modal and click it
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();

      // Verify that the visualization is saved by checking for the success message
      cy.getElementByTestId('saveVisualizationSuccess')
        .should('be.visible')
        .and('contain', "Saved 'line-1'");
    });

    it('should import line chart to Visbuilder and verify filters, queries, and aggregations', () => {
      cy.visit(`${BASE_PATH}/app/visualize`);

      // Search for the line chart visualization
      cy.get('input[type="search"]').clear().type('line-1{enter}');
      cy.get('.euiBasicTable-loading').should('not.exist');

      // Find the specific row for the Line Chart object
      cy.contains('tr', 'line-1').within(() => {
        // Click the pencil icon
        cy.getElementByTestId('dashboardEditBtn').click();
      });

      // Click the "Import to Visbuilder" option
      cy.getElementByTestId('dashboardImportToVisBuilder').click();

      // Locate the global query bar first
      cy.getElementByTestId('globalQueryBar').should('exist');

      // Then, verify the presence of the specific specific query input
      cy.getElementByTestId('queryInput')
        .should('exist')
        .and('contain.value', '27');

      // verify filter
      cy.get('[aria-label="Filter actions"]')
        .should('exist')
        .and(
          'have.attr',
          'title',
          'Filter: age: 20 to 30. Select for more filter actions.'
        );

      // verify chart type
      cy.get('.vbSidenav__header')
        .should('exist')
        .within(() => {
          cy.get('.euiPopover__anchor')
            .should('exist')
            .find('input')
            .should('have.value', 'line');
        });

      // verify Settings (Legend Position)
      cy.get('.euiFormControlLayout__childrenWrapper')
        .should('exist')
        .and('contain.text', 'Left');

      // verify configurations
      cy.get('.vbConfig__section')
        .should('exist')
        .within(() => {
          // Search for the dropBoxField-metric-0 data test subject and check if it contains "Count"
          cy.get('[data-test-subj="dropBoxField-metric-0"]')
            .should('exist')
            .and('contain.text', 'Count');

          // Search for the dropBoxField-segment-0 data test subject and check if it contains "timestamp per day"
          cy.get('[data-test-subj="dropBoxField-segment-0"]')
            .should('exist')
            .and('contain.text', 'timestamp per day');

          // Search for the dropBoxField-group-0 data test subject and check if it contains "age: Descending"
          cy.get('[data-test-subj="dropBoxField-group-0"]')
            .should('exist')
            .and('contain.text', 'age: Descending');

          // Search for the dropBoxField-split-0 data test subject and check if it contains "categories.keyword: Descending"
          cy.get('[data-test-subj="dropBoxField-split-0"]')
            .should('exist')
            .and('contain.text', 'categories.keyword: Descending');

          // Search for the dropBoxField-radius-0 data test subject and check if it contains "Average salary"
          cy.get('[data-test-subj="dropBoxField-radius-0"]')
            .should('exist')
            .and('contain.text', 'Average salary');
        });
    });
  });
}
