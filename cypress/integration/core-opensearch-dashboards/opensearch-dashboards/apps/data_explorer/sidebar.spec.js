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

describe('discover sidebar', () => {
  before(() => {
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
    );

    // import logstash functional
    testFixtureHandler.importJSONDocIfNeeded(
      indexSet,
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  describe('field filtering', function () {
    it('should reveal and hide the filter form when the toggle is clicked', function () {
      cy.getElementByTestId('toggleFieldFilterButton').click();
      cy.getElementByTestId('filterSelectionPanel').should('be.visible');

      cy.getElementByTestId('toggleFieldFilterButton').click();
      cy.getElementByTestId('filterSelectionPanel').should('not.exist');
    });
  });

  // Add a test to test the expanding and collapsing behavior of the sidebar once it is implemented
  // According to issue https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4780
});
