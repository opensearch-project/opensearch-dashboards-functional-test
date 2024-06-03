/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('selectDataSourceForImport', (dataSourceTitle) => {
  cy.getElementByTestId('dataSourceSelectorComboBox').click();
  cy.get('.euiFilterSelectItem')
    .contains(dataSourceTitle) // Find the element containing dataSourceTitle
    .click();
});

Cypress.Commands.add('deleteAllSavedObjects', () => {
  cy.wait(1000);
  cy.deleteSavedObjectByType('dashboard');
  cy.wait(1000);
  cy.deleteSavedObjectByType('index-pattern');
  cy.wait(1000);
  cy.deleteSavedObjectByType('search');
  cy.wait(1000);
  cy.deleteSavedObjectByType('visualization');
  cy.wait(1000);
  cy.deleteSavedObjectByType('metrics');
  cy.wait(1000);
  cy.deleteSavedObjectByType('vega');
});

Cypress.Commands.add(
  'uploadSavedObjectsToDataSource',
  (importMode, override, dataSourceTitle) => {
    cy.contains('button', 'Import').click();
    cy.wait(1000);
    cy.fixture(
      'dashboard/opensearch_dashboards/saved_objects_management/mds_log_objects.ndjson'
    ).then((fileContent) => {
      cy.get('input[type="file"]').attachFile({
        fileContent: fileContent,
        fileName: 'mds_log_objects.ndjson',
        mimeType: 'text/plain', // use 'application/json' to treat the ndsjon as json, keep 'text/plain' to use ndjson
      });
    });
    cy.wait(1000);
    cy.selectDataSourceForImport(dataSourceTitle); // choose the data source that is created at the beginning of the test
    cy.handleImportMode(importMode);
    if (override !== '') {
      cy.handleImportMode(override);
    }
    cy.wait(1000);
    cy.getElementByTestId('importSavedObjectsImportBtn').click({
      force: true,
    });
    cy.getElementByTestId('importSavedObjectsConfirmBtn').click({
      force: true,
    });
    cy.wait(1000);
    if (importMode === 'createNewCopiesEnabled') {
      cy.contains('new').should('be.visible');
    } else {
      if (override !== 'overwriteEnabled') {
        for (let i = 0; i < 29; i++) {
          cy.getElementByTestId('confirmModalConfirmButton').click();
        }
        cy.getElementByTestId('confirmModalCancelButton').click();
      }
      cy.contains('error').should('not.exist');
    }
    cy.getElementByTestId('importSavedObjectsDoneBtn').click({ force: true });
  }
);

Cypress.Commands.add('handleImportMode', (importMode) => {
  cy.get(`#${importMode}`).check({ force: true });
});
