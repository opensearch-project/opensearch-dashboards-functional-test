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

describe('discover filter editor', () => {
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

    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForLoader();
    cy.waitForSearch();
  });

  describe('filter editor', function () {
    it('should add a phrases filter', function () {
      cy.submitFilterFromDropDown('extension.raw', 'is one of', 'jpg');
      cy.get('[data-test-subj~="filter-key-extension.raw"]').should(
        'be.visible'
      );
    });

    it('should show the phrases if you re-open a phrases filter', function () {
      cy.get('[data-test-subj~="filter-key-extension.raw"]').click();
      cy.getElementByTestId('editFilter').click();
      cy.getElementByTestId('filterFieldSuggestionList').should(
        'have.text',
        'extension.raw'
      );
      cy.get('[data-test-subj~="filterParamsComboBox"]').should(
        'have.text',
        'jpg'
      );
      cy.getElementByTestId('cancelSaveFilter').click();
    });

    it('should support filtering on nested fields', () => {
      cy.submitFilterFromDropDown('nestedField.child', 'is', 'nestedValue');

      cy.get('[data-test-subj~="filter-key-nestedField.child"]').should(
        'be.visible'
      );
      cy.verifyHitCount('1');
    });
  });
});
