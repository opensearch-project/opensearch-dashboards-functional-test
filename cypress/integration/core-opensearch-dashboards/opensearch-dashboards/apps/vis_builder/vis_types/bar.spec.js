/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VB_APP_URL,
  VB_INDEX_END_TIME,
  VB_INDEX_ID,
  VB_INDEX_PATTERN,
  VB_INDEX_START_TIME,
  VB_PATH_INDEX_DATA,
  VB_PATH_SO_DATA,
} from '../../../../../../utils/constants';

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Vis Builder: Bar Chart', () => {
    before(() => {
      cy.deleteIndex(VB_INDEX_ID);
      cy.bulkUploadDocs(VB_PATH_INDEX_DATA, VB_INDEX_ID);
      cy.importSavedObjects(VB_PATH_SO_DATA);

      cy.visit(VB_APP_URL);

      // Wait for page to load
      cy.getElementByTestId('homeIcon');
      cy.vbSelectDataSource(VB_INDEX_PATTERN);

      // Set Top nav
      cy.setTopNavDate(VB_INDEX_START_TIME, VB_INDEX_END_TIME);

      cy.vbSelectVisType('Bar');
    });

    it('Basic test', () => {
      cy.getElementByTestId('field-age-showDetails').drag(
        '[data-test-subj="dropBoxAddField-metric"]'
      );
      cy.getElementByTestId('field-genre.keyword-showDetails').drag(
        '[data-test-subj="dropBoxAddField-segment"]'
      );
      testBarValues([53, 57, 53, 54, 55]);
    });

    after(() => {
      cy.deleteIndex(VB_INDEX_ID);
    });
  });
}

export const testBarValues = (values) => {
  cy.getElementByTestId('visualizationLoader')
    .find('.histogram rect')
    .should('have.length', values.length)
    .and(($rect) => {
      values.forEach((value, index) => {
        expect(Math.round($rect.get(index).__data__.y)).to.equal(value);
      });
    });
};
