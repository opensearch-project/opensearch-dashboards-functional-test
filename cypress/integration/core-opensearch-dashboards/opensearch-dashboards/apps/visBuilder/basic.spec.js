/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../../../utils/constants';

describe('Visualization Builder Base Tests', () => {
  const INDEX_ID = 'vis-builder';
  const INDEX_PATTERN_ID = 'vis-builder-index-pattern';
  const INDEX_PATTERN = INDEX_ID;

  before(() => {
    cy.deleteIndexPattern(INDEX_PATTERN_ID);
    cy.deleteIndex(INDEX_ID);
    cy.bulkUploadDocs(
      'dashboard/opensearch_dashboards/visBuilder/vis_builder.data.txt',
      INDEX_ID
    );
    cy.createIndexPattern(INDEX_PATTERN_ID, {
      title: INDEX_PATTERN,
      timeFieldName: 'timestamp',
    });
    cy.visit(`${BASE_PATH}/app/wizard`);

    // Wait for page to load
    cy.getElementByTestId('homeIcon');
    cy.vbSelectDataSource(INDEX_PATTERN);

    cy.setTopNavDate(
      'Jan 1, 2022 @ 00:00:00.000',
      'Jan 14, 2022 @ 00:00:00.000'
    );
  });

  it('Create basic visualization', () => {
    cy.vbSelectVisType('Metric');
    cy.getElementByTestId('field-undefined-showDetails').drag(
      '[data-test-subj=dropBoxAddField-metric]'
    );
    cy.getElementByTestId('visualizationLoader')
      .find('.mtrVis__value')
      .should('contain.text', 100);
  });

  after(() => {
    cy.deleteIndexPattern(INDEX_PATTERN_ID);
    cy.deleteIndex(INDEX_ID);
  });
});
