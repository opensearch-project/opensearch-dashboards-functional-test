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

describe('test large strings', () => {
  before(() => {
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/empty_opensearch_dashboards/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/empty_opensearch_dashboards/data.json.txt'
    );

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/hamlet/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/hamlet/data.json.txt'
    );

    //Error: could not locate the index pattern 'testlargestring'
    cy.setAdvancedSetting({
      defaultIndex: 'fe302d30-62df-11e9-ab97-9ded634d922e',
    });
  });

  it('verify the large string book present', function () {
    // Go to the Discover page
    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();

    const ExpectedDoc = 'Project Gutenberg EBook of Hamlet';

    cy.get('[data-test-subj="dataGridRowCell"]:nth-child(3) span')
      .invoke('text')
      .then((text) => {
        const hasTheText = text.includes(ExpectedDoc);
        expect(hasTheText).to.be.true;
      });
  });

  describe('test large data', function () {
    it('search Newsletter should show the correct hit count', function () {
      cy.log('test Newsletter keyword is searched');
      const expectedHitCount = '1';
      const query = 'Newsletter';
      cy.setTopNavQuery(query);
      cy.verifyHitCount(expectedHitCount);
    });

    // flaky when looking for the highlighted mark
    it.skip('the search term Newsletter should be highlighted in the field data', function () {
      cy.log('Newsletter appears only once');
      const expectedMarkCount = '1';
      cy.verifyMarkCount(expectedMarkCount);
    });
  });
});
