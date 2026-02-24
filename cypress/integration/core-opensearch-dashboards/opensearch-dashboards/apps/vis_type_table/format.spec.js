/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommonUI } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  BASE_PATH,
  TABLE_INDEX_ID,
  TABLE_PATH_INDEX_DATA,
  TABLE_INDEX_PATTERN,
  TABLE_PATH_SO_DATA,
  TABLE_VIS_APP_PATH,
  TABLE_INDEX_START_TIME,
  TABLE_INDEX_END_TIME,
  toTestId,
} from '../../../../../utils/constants';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const commonUI = new CommonUI(cy);

describe('table visualization - auto column resizing', () => {
  const TABLE_RESIZE_VIS_TITLE = 'Table Column Auto Resize Test';

  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
    cy.bulkUploadDocs(TABLE_PATH_INDEX_DATA);
    cy.forceMergeSegments();
    cy.importSavedObjects(TABLE_PATH_SO_DATA);
  });

  after(() => {
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
  });

  describe('Check column auto-resizing prevents truncation', () => {
    beforeEach(() => {
      // Create a new table visualization
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('[data-test-subj="newItemButton"]').click();
      cy.get('[data-test-subj="visType-table"]').click();
      cy.get('[data-test-subj="savedObjectFinderSearchInput"]').type(TABLE_INDEX_ID);
      cy.get(`[data-test-subj="savedObjectTitle${TABLE_INDEX_ID}"]`).click();
      cy.setTopNavDate(TABLE_INDEX_START_TIME, TABLE_INDEX_END_TIME);
    });

    it('Should not truncate cell content', () => {
      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('age', 'Descending', '5', 2);
      cy.waitForLoader();

      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('email.keyword', 'Descending', '5', 3);
      cy.waitForLoader();

      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('timestamp', 'Descending', '5', 4);
      cy.waitForLoader();

      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('username.keyword', 'Descending', '5', 5);
      cy.waitForLoader();

      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('birthdate', 'Descending', '5', 6);
      cy.waitForLoader();

      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('categories.keyword', 'Descending', '5', 7);
      cy.waitForLoader();

      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('password.keyword', 'Descending', '5', 8);
      cy.waitForLoader();

      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('userId.keyword', 'Descending', '5', 9);
      cy.waitForLoader();

      // Check that cells have word-wrap enabled
      cy.get('.tableVisContainer')
        .find('tbody td')
        .first()
        .should('have.css', 'word-break', 'break-word');
    });

    it('Should show tooltips for headers', () => {
      // Headers should have tooltips
      cy.get('.tableVisContainer').find('thead th .header-text').first().trigger('mouseover');
      cy.get('.euiToolTipPopover').should('be.visible');
    });
  });
});
