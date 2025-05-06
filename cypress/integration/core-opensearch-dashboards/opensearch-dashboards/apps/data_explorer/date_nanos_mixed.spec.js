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

describe('date_nanos_mixed', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    //import date nanos
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/date_nanos_mix/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/date_nanos_mix/data.json.txt'
    );
    cy.setAdvancedSetting({
      defaultIndex: 'timestamp-*',
    });
    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();

    const fromTime = 'Jan 1, 2019 @ 00:00:00.000';
    const toTime = 'Jan 1, 2019 @ 23:59:59.999';
    cy.setTopNavDate(fromTime, toTime);
    cy.waitForSearch();
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/date_nanos_mix/mappings.json.txt'
    );
  });

  it('shows a list of records of indices with date & date_nanos fields in the right order', function () {
    cy.get(`[data-test-subj="osdDocTableCellDataField"]`)
      .eq(0)
      .contains('Jan 1, 2019 @ 04:10:30.124000000');

    cy.get(`[data-test-subj="osdDocTableCellDataField"]`)
      .eq(1)
      .contains('Jan 1, 2019 @ 04:10:30.123498765');

    cy.get(`[data-test-subj="osdDocTableCellDataField"]`)
      .eq(2)
      .contains('Jan 1, 2019 @ 04:10:30.123456789');

    cy.get(`[data-test-subj="osdDocTableCellDataField"]`)
      .eq(3)
      .contains('Jan 1, 2019 @ 04:10:30.123000000');
  });
});
