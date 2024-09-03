/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('index pattern without field spec', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
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

  beforeEach(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );
    cy.deleteSavedObjectByType('index-pattern');
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
