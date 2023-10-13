/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  MiscUtils,
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

describe('saved queries saved objects', () => {
  const fromTime = 'Sep 20, 2015 @ 08:00:00.000';
  const toTime = 'Sep 21, 2015 @ 08:00:00.000';
  before(() => {
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
    );

    // import logstash functional
    testFixtureHandler.importJSONDocIfNeeded(
      indexSet,
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    // Go to the Discover page
    miscUtils.visitPage('app/data-explorer/discover#/');

    // Set time filter
    cy.setTopNavDate(fromTime, toTime);

    // Set up query and filter
    cy.setTopNavQuery('response:200');
    cy.submitFilterFromDropDown('extension.raw', 'is one of', 'jpg');

    cy.waitForLoader();
  });

  describe('saved query management component functionality', function () {
    it('should show the saved query management component when there are no saved queries', () => {
      cy.getElementByTestId('saved-query-management-popover-button').click();
      cy.getElementByTestId('saved-query-management-popover')
        .should('be.visible')
        .get('[id="savedQueryManagementPopoverTitle"]')
        .should('have.text', 'Saved Queries');

      cy.get('[class~="osdSavedQueryManagement__text"]').should(
        'have.text',
        'There are no saved queries. Save query text and filters that you want to use again.'
      );
    });

    it('should allow a query to be saved via the saved objects management component', () => {
      cy.saveQuery('OkResponse', '200 responses for .jpg over 24 hours');
      cy.getElementByTestId('saveQueryFormIncludeTimeFilterOption').click();
      cy.getElementByTestId('savedQueryFormSaveButton').click();

      cy.whenTestIdNotFound('saved-query-management-popover', () => {
        cy.getElementByTestId('saved-query-management-popover-button').click();
      });
      cy.get(`[data-test-subj~="load-saved-query-OkResponse-button"]`).should(
        'be.visible'
      );
      cy.getElementByTestId(`queryInput`).should('have.text', 'response:200');
    });

    it('reinstates filters and the time filter when a saved query has filters and a time filter included', () => {
      cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
      cy.getElementByTestId('queryInput').clear();
      cy.loadSaveQuery('OkResponse');

      cy.getElementByTestId(`queryInput`).should('have.text', 'response:200');
      cy.verifyTimeConfig(fromTime, toTime);
    });

    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5071
    it.skip('preserves the currently loaded query when the page is reloaded', () => {
      // await browser.refresh();
      // const timePickerValues = await PageObjects.timePicker.getTimeConfigAsAbsoluteTimes();
      // expect(await filterBar.hasFilter('extension.raw', 'jpg')).to.be(true);
      // expect(timePickerValues.start).to.not.eql(PageObjects.timePicker.defaultStartTime);
      // expect(timePickerValues.end).to.not.eql(PageObjects.timePicker.defaultEndTime);
      // await retry.waitFor(
      //   'the right hit count',
      //   async () => (await PageObjects.discover.getHitCount()) === '2,792'
      // );
      // expect(await savedQueryManagementComponent.getCurrentlyLoadedQueryID()).to.be('OkResponse');
    });

    it('allows saving changes to a currently loaded query via the saved query management component', () => {
      cy.loadSaveQuery('OkResponse');
      cy.setTopNavQuery(`response:404`);
      cy.whenTestIdNotFound('saved-query-management-popover', () => {
        cy.getElementByTestId('saved-query-management-popover-button').click();
      });
      cy.getElementByTestId(
        'saved-query-management-save-changes-button'
      ).click();
      cy.getElementByTestId('savedQueryFormSaveButton').click();

      cy.clearSaveQuery();

      cy.getElementByTestId(`queryInput`).should('have.text', '');

      cy.get(`[data-test-subj~="load-saved-query-OkResponse-button"]`)
        .should('be.visible')
        .click();

      cy.getElementByTestId(`queryInput`).should('have.text', 'response:404');
    });

    it('allows saving the currently loaded query as a new query', () => {
      cy.getElementByTestId('saved-query-management-popover-button').click();

      //save as new query
      cy.getElementByTestId(
        'saved-query-management-save-as-new-button'
      ).click();
      cy.getElementByTestId('saveQueryFormTitle').type('OkResponseCopy');
      cy.getElementByTestId('savedQueryFormSaveButton').click();
    });

    it('allows deleting the currently loaded saved query in the saved query management component and clears the query', () => {
      cy.deleteSaveQuery('OkResponseCopy');
      cy.getElementByTestId('saved-query-management-popover-button').click();
      cy.get(
        `[data-test-subj~="load-saved-query-OkResponseCopy-button"]`
      ).should('not.exist');
      cy.getElementByTestId(`queryInput`).should('have.text', '');
    });

    it('does not allow saving a query with a non-unique name', () => {
      cy.whenTestIdNotFound('saved-query-management-popover', () => {
        cy.getElementByTestId('saved-query-management-popover-button').click();
      });
      cy.getElementByTestId('saved-query-management-save-button').click();

      cy.getElementByTestId('saveQueryFormTitle').type('OkResponse');
      cy.getElementByTestId('savedQueryFormSaveButton').click();
      cy.getElementByTestId('saveQueryForm')
        .get('.euiForm__error')
        .should('have.text', 'Name conflicts with an existing saved query');
      cy.getElementByTestId('savedQueryFormCancelButton').click();
    });

    it('resets any changes to a loaded query on reloading the same saved query', () => {
      cy.loadSaveQuery('OkResponse');
      cy.setTopNavQuery('response:503');
      cy.loadSaveQuery('OkResponse');
      cy.getElementByTestId(`queryInput`).should('have.text', 'response:404');
    });

    it('allows clearing the currently loaded saved query', () => {
      cy.getElementByTestId('saved-query-management-popover-button').click({
        force: true,
      });
      cy.getElementByTestId('saved-query-management-clear-button').click();
      cy.getElementByTestId(`queryInput`).should('have.text', '');
    });

    it('changing language removes saved query', () => {
      cy.get(`[data-test-subj~="load-saved-query-OkResponse-button"]`)
        .should('be.visible')
        .click();
      cy.getElementByTestId('switchQueryLanguageButton').click();
      cy.getElementByTestId('languageToggle').click();
      cy.getElementByTestId(`queryInput`).should('have.text', '');
    });
  });
});
