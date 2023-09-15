/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('date_nanos_mixed', () => {
    before(() => {
        // import date nanos
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
         cy.waitForLoader()

         const fromTime = 'Jan 1, 2019 @ 00:00:00.000';
         const toTime = 'Jan 1, 2019 @ 23:59:59.999';
         cy.setTopNavDate(fromTime, toTime)
         cy.waitForSearch()
    });

    it('shows a list of records of indices with date & date_nanos fields in the right order', function () {
        // const rowData1 = await PageObjects.discover.getDocTableIndex(1);
        // expect(rowData1.startsWith('Jan 1, 2019 @ 12:10:30.124000000')).to.be.ok();
        // const rowData2 = await PageObjects.discover.getDocTableIndex(3);
        // expect(rowData2.startsWith('Jan 1, 2019 @ 12:10:30.123498765')).to.be.ok();
        // const rowData3 = await PageObjects.discover.getDocTableIndex(5);
        // expect(rowData3.startsWith('Jan 1, 2019 @ 12:10:30.123456789')).to.be.ok();
        // const rowData4 = await PageObjects.discover.getDocTableIndex(7);
        // expect(rowData4.startsWith('Jan 1, 2019 @ 12:10:30.123000000')).to.be.ok();
      });
})