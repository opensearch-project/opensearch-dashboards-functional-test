/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('index pattern without field spec', () => {
  before(() => {
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/data.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'without-timefield',
    });

    // Go to the Discover page
    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );
  });

  it('should not display a timepicker', () => {
    cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should(
      'not.exist'
    );
  });

  it('should display a timepicker after switching to an index pattern with timefield', () => {
    const indexName = 'with-timefield';
    cy.getElementByTestId('comboBoxToggleListButton')
      .should('be.visible')
      .click();
    cy.contains('button', indexName).click();
    cy.waitForLoader();
    cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should(
      'be.visible'
    );
  });
});
