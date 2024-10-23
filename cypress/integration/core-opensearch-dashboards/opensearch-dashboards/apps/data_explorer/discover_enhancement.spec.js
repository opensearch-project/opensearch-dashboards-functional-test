/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';
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

describe(
  'discover query enhancement basic functions',
  { scrollBehavior: false },
  () => {
    const isEnhancement = true;
    before(() => {
      CURRENT_TENANT.newTenant = 'global';
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
        'query:enhancements:enabled': true,
        'home:useNewHomePage': true,
      });

      cy.reload();

      // Go to the Discover page
      miscUtils.visitPage('app/data-explorer/discover#/');
    });

    after(() => {
      miscUtils.visitPage('app/management/opensearch-dashboards/settings');
      cy.waitForLoader(isEnhancement);
      cy.getElementByTestId('advancedSetting-resetField-dateFormat:tz').click({
        force: true,
      });
      cy.getElementByTestId('advancedSetting-saveButton').click({
        force: true,
      });
      testFixtureHandler.clearJSONMapping(
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/long_window_logstash/mappings.json.txt'
      );
      cy.deleteIndex('long-window-logstash-0');
      cy.deleteSavedObjectByType('index-pattern');
      cy.setAdvancedSetting({
        defaultIndex: '',
        'dateFormat:tz': 'Browser',
        'query:enhancements:enabled': false,
        'home:useNewHomePage': false,
      });

      cy.reload();
      cy.clearCache();
    });

    describe('no result panel', () => {
      before(() => {
        cy.selectDatasetForEnhancement('long-window-logstash-*');
        // Set a time range where we know there will be no data
        const fromTime = 'Jan 1, 2024 @ 00:00:00.000';
        const toTime = 'Jan 2, 2024 @ 00:00:00.000';
        cy.setTopNavDateWithRetry(fromTime, toTime, isEnhancement);
      });

      it('should show no results', () => {
        // Check for the presence of the no results component
        cy.getElementByTestId('discoverNoResults').should('be.visible');
        cy.getElementByTestId('discoverNoResultsTimefilter')
          .should('be.visible')
          .should(
            'contain.text',
            'Try selecting a different data source, expanding your time range or modifying the query & filters.'
          );
      });
    });

    describe('render discover with side bar, top nav and canvas', () => {
      before(() => {
        // Set a time range where we know there will be no data
        const fromTime = 'Nov 01, 2017 @ 00:00:00.000';
        const toTime = 'Mar 21, 2018 @ 00:00:00.000';
        cy.setTopNavDateWithRetry(fromTime, toTime, isEnhancement);
      });

      it('should show side bar with DatasetSelector', () => {
        // Test dataset selector exist
        cy.getElementByTestId(`datasetSelectorButton`).should('exist');

        // Also verify the sidebar has the field list sections
        cy.getElementByTestId('fieldList-selected').should('exist');
        cy.getElementByTestId('fieldList-unpopular').should('exist');
      });

      it('should show top nav header', () => {
        // Test main header container
        cy.get('.headerAppActionMenuSection').should('exist');
        cy.getElementByTestId('headerAppActionMenu').should('exist');

        // Test navigation menu
        cy.getElementByTestId('top-nav').should('exist');

        // Test all action buttons exist
        cy.getElementByTestId('discoverSaveButton').should('exist');
        cy.getElementByTestId('discoverOpenButton').should('exist');
        cy.getElementByTestId('discoverNewButton').should('exist');
        cy.getElementByTestId('openInspectorButton').should('exist');
        cy.getElementByTestId('shareTopNavButton').should('exist');

        // Test date picker exists
        cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should(
          'exist'
        );
      });

      it('should show globalQueryEditor', () => {
        // Test the query editor and the query language selector components exist
        cy.getElementByTestId('globalQueryEditor').should('exist');
        cy.getElementByTestId('queryEditorLanguageSelector').should('exist');
      });

      it('should show discoverTable', () => {
        // Test main discover table container exists
        cy.getElementByTestId('discoverTable').should('exist');

        // Test table exists and has correct structure
        cy.getElementByTestId('docTable').should('exist');

        // Test header cells exist
        cy.getElementByTestId('docTableHeader').should('exist');
        cy.getElementByTestId('docTableHeaderField').should('exist');
        cy.getElementByTestId(`docTableHeader-@timestamp`).should('exist');
        cy.getElementByTestId(`docTableHeader-_source`).should('exist');

        // Test table toggle and body exists
        cy.getElementByTestId('docTableExpandToggleColumn').should('exist');
        cy.getElementByTestId('docTableField').should('exist');
      });
    });

    describe('filters and queries', () => {
      before(() => {
        // Set a time range where we know there will be no data
        const fromTime = 'Nov 01, 2017 @ 00:00:00.000';
        const toTime = 'Mar 21, 2018 @ 00:00:00.000';
        cy.setTopNavDateWithRetry(fromTime, toTime, isEnhancement);
      });

      it('should persist across refresh', function () {
        // Set up query and filter
        cy.setTopNavQuery('response:200', true, isEnhancement);
        cy.getElementByTestId('showFilterActions').click();
        cy.submitFilterFromDropDown(
          'extension.keyword',
          'is one of',
          'jpg',
          isEnhancement
        );
        cy.reload();
        cy.get('.osdQueryEditor__input .monaco-editor .view-lines').should(
          'contain.text',
          'response:200'
        );
        cy.get('[data-test-subj~="filter-key-extension.keyword"]')
          .should('be.visible')
          .click();
        cy.get('button[aria-label="Delete"]').click();
      });
    });

    describe('save search', () => {
      const saveSearch1 = 'Save Search # 1';
      const saveSearch2 = 'Modified Save Search # 1';

      it('should show correct time range string by timepicker', function () {
        cy.setTopNavDateWithRetry(
          DE_DEFAULT_START_TIME,
          DE_DEFAULT_END_TIME,
          isEnhancement
        );
        cy.verifyTimeConfig(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
      });

      it('save search should display save search name in breadcrumb', function () {
        cy.saveSearch(saveSearch1, isEnhancement);
        cy.getElementByTestId('headerAppActionMenu')
          .should('be.visible')
          .should('contain', saveSearch1);
      });

      it('load save search should show save search name in breadcrumb', function () {
        cy.loadSaveSearch(saveSearch1, isEnhancement);

        cy.getElementByTestId('headerAppActionMenu')
          .should('be.visible')
          .should('contain', saveSearch1);
      });

      it('renaming a save search should modify name in breadcrumb', function () {
        cy.loadSaveSearch(saveSearch1, isEnhancement);
        cy.saveSearch(saveSearch2, isEnhancement);

        cy.getElementByTestId('headerAppActionMenu')
          .should('be.visible')
          .should('contain', saveSearch2);
      });

      it('should show the correct hit count', function () {
        cy.loadSaveSearch(saveSearch2, isEnhancement);
        cy.setTopNavDateWithRetry(
          DE_DEFAULT_START_TIME,
          DE_DEFAULT_END_TIME,
          isEnhancement
        );
        const expectedHitCount = '31';
        cy.verifyHitCount(expectedHitCount);
      });

      it('should show correct time range string in chart', function () {
        cy.getElementByTestId('discoverIntervalDateRange').should(
          'have.text',
          `${DE_DEFAULT_START_TIME} - ${DE_DEFAULT_END_TIME} per`
        );
      });

      it('should show correct initial chart interval of Auto', function () {
        cy.getElementByTestId('discoverIntervalSelect')
          .get('option')
          .first()
          .should('have.text', 'Auto');
      });

      it('should not show "no results"', () => {
        cy.getElementByTestId('discoverNoResults').should('not.exist');
      });

      it('should reload the saved search with persisted query to show the initial hit count', function () {
        // apply query some changes
        cy.setTopNavQuery('DE', true, isEnhancement);
        cy.verifyHitCount('3');

        // reset to persisted state
        cy.getElementByTestId('resetSavedSearch').click();
        const expectedHitCount = '31';
        cy.verifyHitCount(expectedHitCount);
      });
    });
  }
);
