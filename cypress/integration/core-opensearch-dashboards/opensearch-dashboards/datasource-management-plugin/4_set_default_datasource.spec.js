/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('Default data sources', () => {
    before(() => {
      // Clean up after all test are run
      cy.deleteAllDataSources();
      // remove the default data source
      cy.setAdvancedSetting({
        defaultDataSource: '',
      });
    });

    describe('The default data source can behave normal when edit data source table', () => {
      before(() => {
        for (let i = 1; i < 4; i++) {
          const title = `ds_${i}`;
          cy.createDataSourceNoAuthWithTitle(title);
          cy.wait(6000);
        }
        cy.visitDataSourcesListingPage();
        cy.wait(6000);
      });
      after(() => {
        // Clean up after all test are run
        cy.deleteAllDataSources();
        // remove the default data source
        cy.setAdvancedSetting({
          defaultDataSource: '',
        });
      });
      it('The first data source is the default data source', () => {
        cy.visitDataSourcesListingPage();

        // Use Cypress commands to find the table cell with content "ds_1"
        cy.contains('td.euiTableRowCell', 'ds_1').as('ds_1');

        // Check if the cell with current ds_1 content exists
        cy.get('@ds_1').should('exist');

        // Get the parent row of the cell
        cy.get('@ds_1').parents('tr').as('row_ds_1');
        // Check if the "Default" badge exists in the same row
        cy.get('@row_ds_1').contains('span', 'Default').should('exist');
      });
      it('Delete the default data source, the next one will become default data source', () => {
        cy.singleDeleteDataSourceByTitle('ds_1');

        // Check that ds_2 now has the Default badge
        cy.contains('td.euiTableRowCell', 'ds_2').as('ds_2');
        cy.get('@ds_2').parents('tr').as('row_ds_2');
        cy.get('@row_ds_2').contains('span', 'Default').should('exist');
      });
      it('Go the edit data source page of default data source, the set_default button should be disabled', () => {
        cy.contains('a', 'ds_2')
          .should('exist') // Ensure the anchor tag exists
          .invoke('attr', 'href') // Get the href attribute
          .then((href) => {
            // Extract the unique identifier part from the href
            const uniqueId = href.split('/').pop(); // Assumes the unique ID is the last part of the URL
            miscUtils.visitPage(
              `app/management/opensearch-dashboards/dataSources/${uniqueId}`
            );
            cy.getElementByTestId('editSetDefaultDataSource')
              .should('be.exist')
              .should('not.enabled');
            cy.wait(1000);
          });
      });
      it('Go the edit data source page of non-default data source, the set_default button should be enabled and can set to default ds', () => {
        cy.visitDataSourcesListingPage();

        cy.contains('a', 'ds_3')
          .should('exist') // Ensure the anchor tag exists
          .invoke('attr', 'href') // Get the href attribute
          .then((href) => {
            // Extract the unique identifier part from the href
            const uniqueId = href.split('/').pop(); // Assumes the unique ID is the last part of the URL
            miscUtils.visitPage(
              `app/management/opensearch-dashboards/dataSources/${uniqueId}`
            );
            cy.getElementByTestId('editSetDefaultDataSource')
              .should('be.exist')
              .should('be.enabled')
              .click({ force: true });
            cy.wait(1000);
          });
        cy.visitDataSourcesListingPage();
        cy.contains('td.euiTableRowCell', 'ds_3').as('ds_3');
        cy.get('@ds_3').parents('tr').as('row_ds_3');
        cy.get('@row_ds_3').contains('span', 'Default').should('exist');
        cy.contains('td.euiTableRowCell', 'ds_2').as('ds_2');
        cy.get('@ds_2').parents('tr').as('row_ds_2');
        cy.get('@row_ds_2').contains('span', 'Default').should('not.exist');
      });
    });
  });
}
