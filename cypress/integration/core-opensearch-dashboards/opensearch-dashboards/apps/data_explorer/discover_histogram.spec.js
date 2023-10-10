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

describe('discover histogram', { scrollBehavior: false }, () => {
  before(() => {
    cy.log('load opensearch-dashboards index with default index pattern');

    // import long window logstash index pattern
    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash_index_pattern/data.json.txt'
    );

    // import logstash functional
    testFixtureHandler.importJSONDocIfNeeded(
      indexSet,
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
    );

    // import long window logstash
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash/data.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'long-window-logstash-*',
      'dateFormat:tz': 'Europe/Berlin',
    });

    // Go to the Discover page
    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  after(() => {
    miscUtils.visitPage('app/management/opensearch-dashboards/settings');
    cy.waitForLoader();
    cy.getElementByTestId('advancedSetting-resetField-dateFormat:tz').click({
      force: true,
    });
    cy.getElementByTestId('advancedSetting-saveButton').click({ force: true });
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash/mappings.json.txt'
    );
    cy.deleteIndex('long-window-logstash-0');
    cy.deleteSavedObjectByType('index-pattern');
  });

  it('should visualize monthly data with different day intervals', () => {
    const fromTime = 'Nov 01, 2017 @ 00:00:00.000';
    const toTime = 'Mar 21, 2018 @ 00:00:00.000';
    cy.prepareTest(fromTime, toTime, 'Month');
    cy.get('.echChart canvas:last-of-type').should('be.visible');
  });
  it('should visualize weekly data with within DST changes', () => {
    const fromTime = 'Mar 01, 2018 @ 00:00:00.000';
    const toTime = 'May 01, 2018 @ 00:00:00.000';
    cy.prepareTest(fromTime, toTime, 'Week');
    cy.get('.echChart canvas:last-of-type').should('be.visible');
  });
  it('should visualize monthly data with different years scaled to 30 days', () => {
    const fromTime = 'Jan 01, 2010 @ 00:00:00.000';
    const toTime = 'Mar 21, 2019 @ 00:00:00.000';
    cy.prepareTest(fromTime, toTime, 'Day');
    cy.get('.echChart canvas:last-of-type').should('be.visible');
    cy.get('.euiToolTipAnchor').should('be.visible');
  });
});
