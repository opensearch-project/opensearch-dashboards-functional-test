/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  TestFixtureHandler,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);
const indexSet = [
  'logstash-2015.09.22',
  'logstash-2015.09.21',
  'logstash-2015.09.20',
];

describe('doc link in discover', () => {
  beforeEach(() => {
    // import logstash functional
    testFixtureHandler.importJSONDocIfNeeded(
      indexSet,
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
    );

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForLoader();
    cy.waitForSearch();
  });

  after(() => {});

  it('should open the doc view of the selected document', function () {
    cy.getElementByTestId(`docTableExpandToggleColumn-0`)
      .should('be.visible')
      .click();
    cy.getElementByTestId(`documentDetailFlyOut`).should('be.visible');

    // Both actions will take to the new tab
    cy.getElementByTestId('docTableRowAction-0').should(
      'have.text',
      'View surrounding documents(opens in a new tab or window)'
    );

    cy.getElementByTestId('docTableRowAction-1').should(
      'have.text',
      'View single document(opens in a new tab or window)'
    );
  });

  it('if value is null, add filter should create a non-exist filter', function () {
    // Filter out special document
    cy.getElementByTestId('addFilter').click();
    cy.getElementByTestId('filterFieldSuggestionList')
      .should('be.visible')
      .click()
      .type(`agent{downArrow}{enter}`)
      .trigger('blur', { force: true });

    cy.getElementByTestId('filterOperatorList')
      .should('be.visible')
      .click()
      .type(`is{downArrow}{enter}`)
      .trigger('blur', { force: true });

    cy.getElementByTestId('filterParams').type('Missing/Fields');

    cy.getElementByTestId('saveFilter').click({ force: true });
    cy.waitForLoader();

    cy.waitForSearch();

    cy.getElementByTestId(`docTableExpandToggleColumn-0`)
      .should('be.visible')
      .click();
    cy.getElementByTestId(`documentDetailFlyOut`).should('be.visible');

    cy.getElementByTestId('tableDocViewRow-referer')
      .find(`[data-test-subj="addInclusiveFilterButton"]`)
      .click();

    cy.wait(100);

    // Since the value of referer is null, the filter for value option will add a non-existing filter
    cy.get('[data-test-subj~="filter-key-referer"]').should('be.visible');
    cy.get('[data-test-subj~="filter-negated"]').should('be.visible');
  });
});
