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
const indexSet = [
  'logstash-2015.09.22',
  'logstash-2015.09.21',
  'logstash-2015.09.20',
];

describe('discover tab', () => {
  before(() => {
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

  describe('field data', function () {
    it('search php should show the correct hit count', function () {
      const expectedHitCount = '445';
      cy.setTopNavQuery('php');
      cy.verifyHitCount(expectedHitCount);
    });

    it('the search term should be highlighted in the field data', function () {
      cy.getElementByTestId('dataGridWrapper')
        .get('mark')
        .should('have.length', 100);
    });

    it('search type:apache should show the correct hit count', () => {
      const expectedHitCount = '11,156';
      cy.setTopNavQuery('type:apache');
      cy.verifyHitCount(expectedHitCount);
    });

    it('doc view should show Time and _source columns', function () {
      cy.getElementByTestId('dataGridHeaderCell-@timestamp').should(
        'be.visible'
      );
      cy.getElementByTestId('dataGridHeaderCell-_source').should('be.visible');
    });

    it('doc view should sort ascending', function () {
      cy.getElementByTestId(
        'dataGridHeaderCellActionButton-@timestamp'
      ).click();
    });

    it('a bad syntax query should show an error message', function () {
      cy.getElementByTestId('queryInput').clear();
      cy.setTopNavQuery('xxx(yyy))');
      cy.getElementByTestId('errorToastMessage').should('be.visible');
    });
  });
});
