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

describe('discover histogram', () => {
    before(() => {
        cy.log('load opensearch-dashboards index with default index pattern');

        // import long window logstash index pattern
        // testFixtureHandler.importJSONDoc(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash_index_pattern/data.json.txt'
        // );

        // // import logstash functional
        // testFixtureHandler.importJSONMapping(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt'
        // )

        // testFixtureHandler.importJSONDoc(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
        // )

        // // import long window logstash
        // testFixtureHandler.importJSONMapping(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash/mappings.json.txt'
        // );
      
        // testFixtureHandler.importJSONDoc(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash/data.json.txt'
        // );

        cy.setAdvancedSetting({ 
            defaultIndex: 'long-window-logstash-*',
            'dateFormat:tz': 'Europe/Berlin',
         });
         
        // Go to the Discover page
        miscUtils.visitPage('app/data-explorer/discover#/');
        cy.waitForLoader();
        cy.wait(60000)
    });

    after(() => {
        cy.setAdvancedSetting({ 
            'dateFormat:tz': 'Browser',
         });
    })

    it('should visualize monthly data with different day intervals', () => {
        const fromTime = 'Nov 01, 2017 @ 00:00:00.000';
        const toTime = 'Mar 21, 2018 @ 00:00:00.000';
        cy.prepareTest(fromTime, toTime, 'Month');
        cy.isChartCanvasExist()
      });
      it('should visualize weekly data with within DST changes', () => {
        const fromTime = 'Mar 01, 2018 @ 00:00:00.000';
        const toTime = 'May 01, 2018 @ 00:00:00.000';
        cy.prepareTest(fromTime, toTime, 'Week');
        cy.isChartCanvasExist()
      });
      it('should visualize monthly data with different years scaled to 30 days', () => {
        const fromTime = 'Jan 01, 2010 @ 00:00:00.000';
        const toTime = 'Mar 21, 2019 @ 00:00:00.000';
        cy.prepareTest(fromTime, toTime, 'Day');
        cy.isChartCanvasExist()
        cy.isChartIntervalWarningIconExist()
      });
})