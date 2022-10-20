/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  BASE_PATH,
  toTestId,
  VB_APP_PATH,
  VB_APP_URL,
  VB_INDEX_DOC_COUNT,
  VB_INDEX_END_TIME,
  VB_INDEX_ID,
  VB_INDEX_PATTERN,
  VB_INDEX_START_TIME,
  VB_METRIC_VIS_TITLE,
  VB_PATH_INDEX_DATA,
  VB_PATH_SO_DATA,
} from '../../../../../utils/constants';

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Visualization Builder Base Tests', () => {
    before(() => {
      cy.deleteIndex(VB_INDEX_ID);
      cy.bulkUploadDocs(VB_PATH_INDEX_DATA, VB_INDEX_ID);
      cy.importSavedObjects(VB_PATH_SO_DATA);
    });

    it('Show existing visualizations in Visualize', () => {
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('input[type="search"]').type(`${VB_METRIC_VIS_TITLE}{enter}`);
      cy.getElementByTestId(
        `visListingTitleLink-${toTestId(VB_METRIC_VIS_TITLE)}`
      ).should('exist');
    });

    it('Navigate to Visualization Builder from Visualize', () => {
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.getElementByTestId('newItemButton').click();
      cy.getElementByTestId('visType-wizard').click();
      cy.location('pathname').should('eq', VB_APP_PATH);
    });

    it('Create new basic metric visualization', () => {
      cy.visit(VB_APP_URL);

      // Wait for page to load
      cy.getElementByTestId('homeIcon');
      cy.vbSelectDataSource(VB_INDEX_PATTERN);

      // Set Top nav
      cy.setTopNavDate(VB_INDEX_START_TIME, VB_INDEX_END_TIME);

      cy.vbSelectVisType('Metric');
      cy.getElementByTestId('field-undefined-showDetails').drag(
        '[data-test-subj=dropBoxAddField-metric]'
      );
      cy.getElementByTestId('visualizationLoader')
        .find('.mtrVis__value')
        .should('contain.text', VB_INDEX_DOC_COUNT);

      // Update Topnav
      cy.setTopNavQuery('age < 50');

      // See if the value updated
      cy.getElementByTestId('visualizationLoader')
        .find('.mtrVis__value')
        .should('contain.text', `4,390`);
    });

    it('Be able to add/ edit and remove a field', () => {
      cy.visit(VB_APP_URL);

      // Wait for page to load
      cy.getElementByTestId('homeIcon');
      cy.vbSelectDataSource(VB_INDEX_PATTERN);
      cy.vbSelectVisType('Metric');

      // Set Top nav
      cy.setTopNavDate(VB_INDEX_START_TIME, VB_INDEX_END_TIME);

      cy.getElementByTestId('dropBoxAddField-metric')
        .find('[data-test-subj="dropBoxAddBtn"]')
        .click();
      cy.vbEditAgg([
        {
          testSubj: 'defaultEditorAggSelect',
          type: 'select',
          value: 'Average',
        },
      ]);

      // Check if add worked
      cy.getElementByTestId('visualizationLoader')
        .find('.mtrVis__value')
        .should('contain.text', '54.912');

      cy.getElementByTestId('dropBoxField-metric-0').click();
      cy.vbEditAgg([
        {
          testSubj: 'defaultEditorAggSelect',
          type: 'select',
          value: 'Max',
        },
      ]);

      // Check if edit worked
      cy.getElementByTestId('visualizationLoader')
        .find('.mtrVis__value')
        .should('contain.text', '100');

      cy.getElementByTestId('dropBoxField-metric-0')
        .find('[data-test-subj="dropBoxRemoveBtn"]')
        .click();

      // Check id remove worked
      cy.getElementByTestId('emptyWorkspace').should('exist');
    });

    after(() => {
      cy.deleteIndex(VB_INDEX_ID);
    });
  });
}
