/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  DE_DEFAULT_END_TIME,
  DE_DEFAULT_START_TIME,
} from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('index pattern with encoded id', () => {
  before(() => {
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_with_encoded_id/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_with_encoded_id/data.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'with-encoded-id',
    });

    // Go to the Discover page
    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
    cy.waitForLoader();
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_with_encoded_id/mappings.json.txt'
    );
  });

  describe('expand a document row', function () {
    const rowToInspect = 1;
    it('should expand the detail flyout when the toggle icon is clicked', function () {
      cy.getElementByTestId(`docTableExpandToggleColumn-${rowToInspect - 1}`)
        .should('be.visible')
        .click();
      cy.getElementByTestId(`documentDetailFlyOut`).should('be.visible');
    });

    it('should show the detail panel actions', function () {
      cy.get('[data-test-subj^="docTableRowAction"]').should(`have.length`, 2);
    });
  });
});
