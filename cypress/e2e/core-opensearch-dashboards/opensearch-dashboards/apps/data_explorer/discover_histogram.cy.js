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
const indexSet = [
  'logstash-2015.09.22',
  'logstash-2015.09.21',
  'logstash-2015.09.20',
];

describe(
  'discover histogram',
  { scrollBehavior: false, testIsolation: true },
  () => {
    before(() => {
      CURRENT_TENANT.newTenant = 'global';

      testFixtureHandler.importJSONDoc(
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash_index_pattern/data.json.txt'
      );
      testFixtureHandler.importJSONDocIfNeeded(
        indexSet,
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
      );
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
    });

    after(() => {
      cy.visit('app/management/opensearch-dashboards/settings');
      cy.get('[data-test-subj="advancedSetting-resetField-dateFormat:tz"]', {
        timeout: 20000,
      }).click({ force: true });
      cy.get('[data-test-subj="advancedSetting-saveButton"]').click({
        force: true,
      });

      testFixtureHandler.clearJSONMapping(
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash/mappings.json.txt'
      );
      cy.deleteIndex('long-window-logstash-0');
      cy.deleteSavedObjectByType('index-pattern');
      cy.clearCache();
    });

    const performManualQuery = (from, to, interval) => {
      cy.log(`Manual query: ${from} to ${to} [${interval}]`);

      cy.get('[data-test-subj="superDatePickerShowQueriesButton"]', {
        timeout: 30000,
      })
        .should('be.visible')
        .click({ force: true });

      cy.get('[data-test-subj="superDatePickerAbsoluteTab"]').click({
        force: true,
      });

      cy.get('[data-test-subj="superDatePickerAbsoluteDateInput"]')
        .first()
        .clear({ force: true })
        .type(from, { force: true })
        .type('{enter}');

      cy.get('[data-test-subj="superDatePickerAbsoluteDateInput"]')
        .last()
        .clear({ force: true })
        .type(to, { force: true })
        .type('{enter}');

      cy.get('[data-test-subj="querySubmitButton"]').click({ force: true });

      cy.wait(3000);

      cy.get('[data-test-subj="discoverIntervalSelect"]')
        .should('be.visible')
        .select(interval, { force: true });

      cy.wait(2000);
    };

    /**
     * 统一加载 Discover 页面
     */
    const loadDiscover = () => {
      miscUtils.visitPage('app/data-explorer/discover#/');

      cy.get('.echChart canvas', { timeout: 60000 }).should('exist');

      cy.wait(1000);
    };

    it('should visualize monthly data with different day intervals', () => {
      loadDiscover();
      const fromTime = 'Nov 01, 2017 @ 00:00:00.000';
      const toTime = 'Mar 21, 2018 @ 00:00:00.000';

      performManualQuery(fromTime, toTime, 'Month');
      cy.get('.echChart canvas:last-of-type', { timeout: 60000 }).should(
        'be.visible'
      );
    });

    // it('should visualize weekly data with within DST changes', () => {
    //   loadDiscover();
    //   const fromTime = 'Mar 01, 2018 @ 00:00:00.000';
    //   const toTime = 'May 01, 2018 @ 00:00:00.000';

    //   performManualQuery(fromTime, toTime, 'Week');
    //   cy.get('.echChart canvas:last-of-type', { timeout: 60000 }).should('be.visible');
    // });

    // it('should visualize monthly data with different years scaled to 30 days', () => {
    //   loadDiscover();
    //   const fromTime = 'Jan 01, 2010 @ 00:00:00.000';
    //   const toTime = 'Mar 21, 2019 @ 00:00:00.000';

    //   performManualQuery(fromTime, toTime, 'Day');

    //   cy.get('.echChart canvas:last-of-type', { timeout: 90000 }).should('be.visible');
    //   cy.get('.euiToolTipAnchor', { timeout: 30000 }).should('be.visible');
    // });
  }
);
