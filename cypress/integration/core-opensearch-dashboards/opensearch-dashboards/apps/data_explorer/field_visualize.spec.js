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

describe('discover field visualize button', () => {
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
  });

  after(() => {});

  beforeEach(() => {
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForLoader();
    cy.waitForSearch();
  });

  it('should be able to visualize a field and save the visualization', () => {
    cy.getElementByTestId('fieldFilterSearchInput').type('type');
    cy.log('visualize a type field');
    cy.getElementByTestId('field-type-showDetails').click({ force: true });
    cy.getElementByTestId('fieldVisualize-type').click();
  });

  it('should visualize a field in area chart', () => {
    cy.getElementByTestId('fieldFilterSearchInput').type('phpmemory');
    cy.log('visualize a phpmemory field');
    cy.getElementByTestId('field-phpmemory-showDetails').click({ force: true });
    cy.getElementByTestId('fieldVisualize-phpmemory').click();
    cy.waitForLoader();
    cy.get('.visEditor__canvas').should('be.visible');
  });

  it('should not show the "Visualize" button for geo field', () => {
    cy.getElementByTestId('fieldFilterSearchInput').type('geo.coordinates');
    cy.log('visualize a geo field');
    cy.getElementByTestId('field-geo.coordinates-showDetails').click({
      force: true,
    });
    cy.getElementByTestId('fieldVisualize-geo.coordinates').should('not.exist');
  });

  it('should preserve app filters in visualize', () => {
    cy.submitFilterFromDropDown('bytes', 'exists');
    cy.getElementByTestId('fieldFilterSearchInput').type('geo.src');
    cy.log('visualize a geo.src field with filter applied');
    cy.getElementByTestId('field-geo.src-showDetails').click({ force: true });
    cy.getElementByTestId('fieldVisualize-geo.src').click();
    cy.waitForLoader();
    cy.get('.visEditor__canvas').should('be.visible');
    cy.get('[data-test-subj~=filter-key-bytes]').should('be.visible');
  });

  it('should preserve query in visualize', () => {
    const query = 'machine.os : ios';
    cy.setTopNavQuery(query);
    cy.getElementByTestId('fieldFilterSearchInput').type('geo.dest');
    cy.log('visualize a geo.dest field with query applied');
    cy.getElementByTestId('field-geo.dest-showDetails').click({ force: true });
    cy.getElementByTestId('fieldVisualize-geo.dest').click();
    cy.waitForLoader();
    cy.get('.visEditor__canvas').should('be.visible');

    cy.getElementByTestId('queryInput').should('have.text', query);
  });
});
