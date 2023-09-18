/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    TestFixtureHandler,
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DX_DEFAULT_END_TIME, DX_DEFAULT_START_TIME } from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
    cy,
    Cypress.env('openSearchUrl')
  );

describe('saved queries saved objects', () => {
    before(() => {
        cy.setAdvancedSetting({ 
            defaultIndex: 'logstash-*',
         });
         
        // Go to the Discover page
        miscUtils.visitPage('app/data-explorer/discover#/');

        // Set time filter
        const fromTime = 'Sep 20, 2015 @ 08:00:00.000';
        const toTime = 'Sep 21, 2015 @ 08:00:00.000';
        cy.setTopNavDate(fromTime, toTime)

        // Set up query and filter
        cy.setTopNavQuery('response:200')
        cy.submitFilterFromDropDown('extension.raw', 'is one of', 'jpg')

        cy.waitForLoader();
    });

    describe('saved query management component functionality', function () {
        it('should show the saved query management component when there are no saved queries', () => {
            cy.getElementByTestId('savedQueryPopover')
              .click()
            cy.getElementByTestId('saved-query-management-popover')
              .should('be.visible')
              .find('')
              .contains('have.text', 'There are no saved queries. Save query text and filters that you want to use again.')
          });
    
          it('should allow a query to be saved via the saved objects management component', () => {
            cy.saveQuery('OkResponse', '200 responses for .jpg over 24 hours')
            cy.getElementByTestId('saveQueryFormIncludeTimeFilterOption')
              .click()
            cy.getElementByTestId('savedQueryFormSaveButton')
              .click()
     
            cy.whenTestIdNotFound('saved-query-management-popover', () => {
                cy.getElementByTestId('saved-query-management-popover-button')
                  .click()
            })
            cy.getElementByTestId(`~load-saved-query-OkResponse-button`)
              .should('be.visible')
            cy.getElementByTestId(`queryInput`)
              .contains('have.text', '200 responses for .jpg over 24 hours')
          });
    
          it('reinstates filters and the time filter when a saved query has filters and a time filter included', () => {
            await PageObjects.timePicker.setDefaultAbsoluteRange();
            await savedQueryManagementComponent.clearCurrentlyLoadedQuery();
            await savedQueryManagementComponent.loadSavedQuery('OkResponse');
            const timePickerValues = await PageObjects.timePicker.getTimeConfigAsAbsoluteTimes();
            expect(await filterBar.hasFilter('extension.raw', 'jpg')).to.be(true);
            expect(timePickerValues.start).to.not.eql(PageObjects.timePicker.defaultStartTime);
            expect(timePickerValues.end).to.not.eql(PageObjects.timePicker.defaultEndTime);
          });
    
          it('preserves the currently loaded query when the page is reloaded', () => {
            await browser.refresh();
            const timePickerValues = await PageObjects.timePicker.getTimeConfigAsAbsoluteTimes();
            expect(await filterBar.hasFilter('extension.raw', 'jpg')).to.be(true);
            expect(timePickerValues.start).to.not.eql(PageObjects.timePicker.defaultStartTime);
            expect(timePickerValues.end).to.not.eql(PageObjects.timePicker.defaultEndTime);
            await retry.waitFor(
              'the right hit count',
              async () => (await PageObjects.discover.getHitCount()) === '2,792'
            );
            expect(await savedQueryManagementComponent.getCurrentlyLoadedQueryID()).to.be('OkResponse');
          });
    
          it('allows saving changes to a currently loaded query via the saved query management component', () => {
            await queryBar.setQuery('response:404');
            await savedQueryManagementComponent.updateCurrentlyLoadedQuery(
              'OkResponse',
              '404 responses',
              false,
              false
            );
            await savedQueryManagementComponent.savedQueryExistOrFail('OkResponse');
            await savedQueryManagementComponent.clearCurrentlyLoadedQuery();
            expect(await queryBar.getQueryString()).to.eql('');
            await savedQueryManagementComponent.loadSavedQuery('OkResponse');
            expect(await queryBar.getQueryString()).to.eql('response:404');
          });
    
          it('allows saving the currently loaded query as a new query', () => {
            await savedQueryManagementComponent.saveCurrentlyLoadedAsNewQuery(
              'OkResponseCopy',
              '200 responses',
              false,
              false
            );
            await savedQueryManagementComponent.savedQueryExistOrFail('OkResponseCopy');
          });
    
          it('allows deleting the currently loaded saved query in the saved query management component and clears the query', () => {
            await savedQueryManagementComponent.deleteSavedQuery('OkResponseCopy');
            await savedQueryManagementComponent.savedQueryMissingOrFail('OkResponseCopy');
            expect(await queryBar.getQueryString()).to.eql('');
          });
    
          it('does not allow saving a query with a non-unique name', () => {
            await savedQueryManagementComponent.saveNewQueryWithNameError('OkResponse');
          });
    
          it('does not allow saving a query with leading or trailing whitespace in the name', () => {
            await savedQueryManagementComponent.saveNewQueryWithNameError('OkResponse ');
          });
    
          it('resets any changes to a loaded query on reloading the same saved query', () => {
            await savedQueryManagementComponent.loadSavedQuery('OkResponse');
            await queryBar.setQuery('response:503');
            await savedQueryManagementComponent.loadSavedQuery('OkResponse');
            expect(await queryBar.getQueryString()).to.eql('response:404');
          });
    
          it('allows clearing the currently loaded saved query', () => {
            await savedQueryManagementComponent.loadSavedQuery('OkResponse');
            await savedQueryManagementComponent.clearCurrentlyLoadedQuery();
            expect(await queryBar.getQueryString()).to.eql('');
          });
    
          it('allows clearing if non default language was remembered in localstorage', () => {
            await queryBar.switchQueryLanguage('lucene');
            await PageObjects.common.navigateToApp('discover'); // makes sure discovered is reloaded without any state in url
            await queryBar.expectQueryLanguageOrFail('lucene'); // make sure lucene is remembered after refresh (comes from localstorage)
            await savedQueryManagementComponent.loadSavedQuery('OkResponse');
            await queryBar.expectQueryLanguageOrFail('dql');
            await savedQueryManagementComponent.clearCurrentlyLoadedQuery();
            await queryBar.expectQueryLanguageOrFail('lucene');
          });
    
          it('changing language removes saved query', () => {
            await savedQueryManagementComponent.loadSavedQuery('OkResponse');
            await queryBar.switchQueryLanguage('lucene');
            expect(await queryBar.getQueryString()).to.eql('');
          });
    });
})