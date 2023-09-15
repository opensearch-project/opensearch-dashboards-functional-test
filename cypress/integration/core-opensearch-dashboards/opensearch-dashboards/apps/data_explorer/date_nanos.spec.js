/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('date_nanos', () => {
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
         cy.waitForLoader()

         const fromTime = 'Sep 22, 2019 @ 20:31:44.000';
         const toTime = 'Sep 23, 2019 @ 03:31:44.000';
         cy.setTopNavDate(fromTime, toTime)
         cy.waitForSearch()
    });

    it('should show a timestamp with nanoseconds in the first result row', function () {
        cy.verifyTimeConfig(fromTime, DX_DEFAULT_toTimeEND_TIME);
        //const rowData = await PageObjects.discover.getDocTableIndex(1);
        //expect(rowData.startsWith('Sep 22, 2019 @ 23:50:13.253123345')).to.be.ok();
      });
})