/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

const miscUtils = new MiscUtils(cy);

describe('date_nanos', () => {
  const fromTime = 'Sep 21, 2019 @ 20:31:44.000';
  const toTime = 'Sep 23, 2019 @ 03:31:44.000';
  before(() => {
    // import date nanos
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/date_nanos/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/date_nanos/data.json.txt'
    );
    cy.setAdvancedSetting({
      defaultIndex: 'date-nanos',
    });

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();

    cy.setTopNavDate(fromTime, toTime);
    cy.waitForSearch();
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/date_nanos/mappings.json.txt'
    );
  });

  it('should show a timestamp with nanoseconds in the first result row', function () {
    cy.verifyTimeConfig(fromTime, toTime);
    cy.get(`[data-test-subj="dataGridRowCell"]`)
      .eq(1)
      .contains('Sep 22, 2019 @ 16:50:13.253123345');
  });
});
