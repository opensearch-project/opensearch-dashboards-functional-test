/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  BASE_PATH,
  VB_INDEX_PATTERN_ID,
  VB_INDEX_ID,
  VB_INDEX_PATTERN,
} from '../../../../../utils/constants';

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Visualization Builder Base Tests', () => {
    before(() => {
      cy.deleteIndexPattern(VB_INDEX_PATTERN_ID);
      cy.deleteIndex(VB_INDEX_ID);
      cy.bulkUploadDocs(
        'dashboard/opensearch_dashboards/visBuilder/vis_builder.data.txt',
        VB_INDEX_ID
      );
      cy.createIndexPattern(VB_INDEX_PATTERN_ID, {
        title: VB_INDEX_PATTERN,
        timeFieldName: 'timestamp',
      });
      cy.visit(`${BASE_PATH}/app/wizard`);

      // Wait for page to load
      cy.getElementByTestId('homeIcon');
      cy.vbSelectDataSource(VB_INDEX_PATTERN);

      cy.setTopNavDate(
        'Jan 1, 2022 @ 00:00:00.000',
        'Jan 16, 2022 @ 00:00:00.000'
      );
    });

    it('Create basic visualization', () => {
      cy.vbSelectVisType('Metric');
      cy.getElementByTestId('field-undefined-showDetails').drag(
        '[data-test-subj=dropBoxAddField-metric]'
      );
      cy.getElementByTestId('visualizationLoader')
        .find('.mtrVis__value')
        .should('contain.text', `9,121`);
    });

    after(() => {
      cy.deleteIndexPattern(VB_INDEX_PATTERN_ID);
      cy.deleteIndex(VB_INDEX_ID);
    });
  });
}
