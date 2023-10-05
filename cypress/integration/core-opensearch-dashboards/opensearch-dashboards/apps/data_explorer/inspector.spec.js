/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  TestFixtureHandler,
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
const indexSet = [
  'logstash-2015.09.22',
  'logstash-2015.09.21',
  'logstash-2015.09.20',
];

describe('inspector', () => {
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
  });

  beforeEach(() => {
    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  after(() => {});

  it('should display request stats with no results', () => {
    cy.getElementByTestId('openInspectorButton').click();
    cy.wait(1000);
    cy.getElementByTestId('inspectorPanel')
      .get('.euiTable tr:nth-child(2) td:nth-child(2) span')
      .invoke('text')
      .should('eq', '0');
  });

  it('should display request stats with results', () => {
    cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
    cy.waitForSearch();
    cy.getElementByTestId('openInspectorButton').click();
    cy.wait(1000);
    cy.getElementByTestId('inspectorPanel')
      .get('.euiTable tr:nth-child(2) td:nth-child(2) span')
      .invoke('text')
      .should('eq', '14004');
  });
});
