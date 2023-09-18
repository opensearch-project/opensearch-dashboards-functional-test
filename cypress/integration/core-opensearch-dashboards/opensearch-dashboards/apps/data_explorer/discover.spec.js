/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    CommonUI,
    TestFixtureHandler,
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DX_DEFAULT_END_TIME, DX_DEFAULT_START_TIME } from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
    cy,
    Cypress.env('openSearchUrl')
  );

describe('discover app', () => {
    before(() => {
        // cy.log('load opensearch-dashboards index with default index pattern');
        // testFixtureHandler.importJSONMapping(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
        // );
      
        // testFixtureHandler.importJSONDoc(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
        // );

        // testFixtureHandler.importJSONMapping(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt'
        // )

        // testFixtureHandler.importJSONDoc(
        //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
        // )
         
        // Go to the Discover page        
        miscUtils.visitPage(`app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`);
        cy.waitForLoader();
        cy.waitForSearch()
    });

    // after(() => {
    //     //miscUtils.removeSampleData();
    // });

    describe('save search', () => {
        const saveSearch1 = 'Save Search # 1';

        it('should show correct time range string by timepicker', function () {
            cy.verifyTimeConfig(DX_DEFAULT_START_TIME, DX_DEFAULT_END_TIME);
            cy.waitForLoader();
        });
  
        it('save search should display save search name in breadcrumb', function () {
          cy.log("save search should display save search name in breadcrumb")
          cy.saveSearch(saveSearch1);
          cy.getElementByTestId('breadcrumb last')
            .should('be.visible')
            .should('have.text', saveSearch1)
        });
  
        it('load save search should show save search name in breadcrumb', function () {
          cy.loadSaveSearch(saveSearch1)
  
          cy.getElementByTestId('breadcrumb last')
            .should('be.visible')
            .should('have.text', saveSearch1)
        });
  
        it('renaming a save search should modify name in breadcrumb', function () {
          const saveSearch2 = 'Modified Save Search # 1';
          cy.loadSaveSearch(saveSearch1);
          cy.saveSearch(saveSearch2);
  
          cy.getElementByTestId('breadcrumb last')
            .should('be.visible')
            .should('have.text', saveSearch2)
        });
  
        it('should show the correct hit count', function () {
          const expectedHitCount = '14,004';
          cy.verifyHitCount(expectedHitCount)
        });
  
        it('should show correct time range string in chart', function () {
          cy.getElementByTestId('discoverIntervalDateRange')
            .should('have.text', `${DX_DEFAULT_START_TIME} - ${DX_DEFAULT_END_TIME}`)
        });
  
        it('should modify the time range when a bar is clicked', function () {
          await PageObjects.timePicker.setDefaultAbsoluteRange();
          await PageObjects.discover.clickHistogramBar();
          await PageObjects.discover.waitUntilSearchingHasFinished();
          const time = await PageObjects.timePicker.getTimeConfig();
          expect(time.start).to.be('Sep 21, 2015 @ 09:00:00.000');
          expect(time.end).to.be('Sep 21, 2015 @ 12:00:00.000');
          await retry.waitFor('doc table to contain the right search result', async () => {
            const rowData = await PageObjects.discover.getDocTableField(1);
            log.debug(`The first timestamp value in doc table: ${rowData}`);
            return rowData.includes('Sep 21, 2015 @ 11:59:22.316');
          });
        });
  
        // it('should modify the time range when the histogram is brushed', async function () {
        //   await PageObjects.timePicker.setDefaultAbsoluteRange();
        //   await PageObjects.discover.brushHistogram();
        //   await PageObjects.discover.waitUntilSearchingHasFinished();
  
        //   const newDurationHours = await PageObjects.timePicker.getTimeDurationInHours();
        //   expect(Math.round(newDurationHours)).to.be(24);
  
        //   await retry.waitFor('doc table to contain the right search result', async () => {
        //     const rowData = await PageObjects.discover.getDocTableField(1);
        //     log.debug(`The first timestamp value in doc table: ${rowData}`);
        //     const dateParsed = Date.parse(rowData);
        //     //compare against the parsed date of Sep 20, 2015 @ 17:30:00.000 and Sep 20, 2015 @ 23:30:00.000
        //     return dateParsed >= 1442770200000 && dateParsed <= 1442791800000;
        //   });
        // });
  
        // it('should show correct initial chart interval of Auto', async function () {
        //   await PageObjects.timePicker.setDefaultAbsoluteRange();
        //   await PageObjects.discover.waitUntilSearchingHasFinished();
        //   const actualInterval = await PageObjects.discover.getChartInterval();
  
        //   const expectedInterval = 'Auto';
        //   expect(actualInterval).to.be(expectedInterval);
        // });
  
        // it('should show Auto chart interval', async function () {
        //   const expectedChartInterval = 'Auto';
  
        //   const actualInterval = await PageObjects.discover.getChartInterval();
        //   expect(actualInterval).to.be(expectedChartInterval);
        // });
  
        // it('should not show "no results"', async () => {
        //   const isVisible = await PageObjects.discover.hasNoResults();
        //   expect(isVisible).to.be(false);
        // });
  
        // it('should reload the saved search with persisted query to show the initial hit count', async function () {
        //   // apply query some changes
        //   await queryBar.setQuery('test');
        //   await queryBar.submitQuery();
        //   await retry.try(async function () {
        //     expect(await PageObjects.discover.getHitCount()).to.be('22');
        //   });
  
        //   // reset to persisted state
        //   await PageObjects.discover.clickResetSavedSearchButton();
        //   const expectedHitCount = '14,004';
        //   await retry.try(async function () {
        //     expect(await queryBar.getQueryString()).to.be('');
        //     expect(await PageObjects.discover.getHitCount()).to.be(expectedHitCount);
        //   });
        // });
    })
})