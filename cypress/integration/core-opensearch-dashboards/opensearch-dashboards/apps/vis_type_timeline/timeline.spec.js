/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  TL_INDEX_ID,
  TL_PATH_INDEX_DATA,
  TL_INDEX_START_TIME,
  TL_INDEX_END_TIME,
  TL_CREATE_URL,
  TL_VIS_APP_PATH,
  TL_INDEX_PATTERN,
  TL_ERROR_TOAST_MESSAGE_CLASSES,
  TL_ERROR_TOAST_MESSAGE_CLOSE_BUTTON,
} from '../../../../../utils/constants';
import { CURRENT_TENANT } from '../../../../../utils/commands';
import { constructTimelineExpression } from './utils';

if (!Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('Timeline Visualization', () => {
    before(() => {
      CURRENT_TENANT.newTenant = 'global';
      cy.fleshTenantSettings();
      cy.deleteIndex(TL_INDEX_ID);
      cy.bulkUploadDocs(TL_PATH_INDEX_DATA);

      // Dashboards requires an index pattern to continue to the Create Visualization stage
      cy.deleteIndexPattern(TL_INDEX_PATTERN);
      cy.createIndexPattern(TL_INDEX_PATTERN, {
        title: TL_INDEX_PATTERN,
        timeFieldName: 'timestamp',
      });

      // Visit the page
      cy.log('create a new timeline visualization: ', TL_CREATE_URL);
      cy.visit(TL_CREATE_URL);
      cy.url().should('contain', TL_VIS_APP_PATH);

      cy.setTopNavDate(TL_INDEX_START_TIME, TL_INDEX_END_TIME);

      // Wait for page to load
      cy.waitForLoader();
    });

    it('should throw a toast message when data_source_name is used', () => {
      const timelineExpression = constructTimelineExpression({
        indexName: TL_INDEX_ID,
        avgMetricName: 'salary',
        timefield: 'timestamp',
        dataSourceName: 'non-existent datasource',
      });

      cy.tlSetTimelineExpression(timelineExpression);
      cy.tlUpdateVisualization();

      cy.get(`div${TL_ERROR_TOAST_MESSAGE_CLASSES}`).should('exist');

      // Toast must be cleared for other tests
      cy.get(TL_ERROR_TOAST_MESSAGE_CLOSE_BUTTON).click();
    });

    it('should query from local cluster when data_source_name is not present', () => {
      const timelineExpression = constructTimelineExpression({
        indexName: TL_INDEX_ID,
        avgMetricName: 'salary',
        timefield: 'timestamp',
      });

      cy.tlSetTimelineExpression(timelineExpression);
      cy.tlUpdateVisualization();

      // Correct visualizations do not throw any toast message
      cy.get(`div${TL_ERROR_TOAST_MESSAGE_CLASSES}`).should('not.exist');
    });

    after(() => {
      cy.deleteIndex(TL_INDEX_ID);
      cy.deleteIndexPattern(TL_INDEX_PATTERN);
    });
  });
}
