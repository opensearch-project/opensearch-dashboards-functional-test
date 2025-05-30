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

describe('discover app', { scrollBehavior: false }, () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    // import logstash functional
    testFixtureHandler.importJSONDocIfNeeded(
      indexSet,
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
    );

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    // Go to the Discover page
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForLoader();
    cy.waitForSearch();
  });

  beforeEach(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
  });

  after(() => {});

  describe('filters and queries', () => {
    after(() => {
      cy.get('[data-test-subj~="filter-key-extension.raw"]').click();
      cy.getElementByTestId(`deleteFilter`).click();
      cy.clearTopNavQuery(); // clear the query before we proceed
    });
    it('should persist across refresh', function () {
      // Set up query and filter
      cy.setTopNavQuery('response:200');
      cy.submitFilterFromDropDown('extension.raw', 'is one of', 'jpg');
      cy.reload();
      cy.getElementByTestId(`queryInput`).should('have.text', 'response:200');
      cy.get('[data-test-subj~="filter-key-extension.raw"]').should(
        'be.visible'
      );
    });
  });

  describe('save search', () => {
    const saveSearch1 = 'Save Search # 1';
    const saveSearch2 = 'Modified Save Search # 1';

    it('should show correct time range string by timepicker', function () {
      cy.verifyTimeConfig(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
      cy.waitForLoader();
    });

    it('save search should display save search name in breadcrumb', function () {
      cy.log('save search should display save search name in breadcrumb');
      cy.saveSearch(saveSearch1);
      cy.getElementByTestId('breadcrumb last')
        .should('be.visible')
        .should('have.text', saveSearch1);
    });

    it('load save search should show save search name in breadcrumb', function () {
      cy.loadSaveSearch(saveSearch1);

      cy.getElementByTestId('breadcrumb last')
        .should('be.visible')
        .should('have.text', saveSearch1);
    });

    it('renaming a save search should modify name in breadcrumb', function () {
      cy.loadSaveSearch(saveSearch1);
      cy.saveSearch(saveSearch2);

      cy.getElementByTestId('breadcrumb last')
        .should('be.visible')
        .should('have.text', saveSearch2);
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
      // set current hit count as alias
      cy.getElementByTestId('discoverQueryHits').invoke('text').as('hits');
      // apply query some changes
      cy.setTopNavQuery('test');
      cy.verifyHitCount('22');

      // reset to persisted state
      cy.getElementByTestId('resetSavedSearch').click();
      cy.get('@hits').then((hits) => {
        cy.verifyHitCount(hits);
      });
    });
  });

  describe(
    'save search #2 which has an empty time range',
    { scrollBehavior: false },
    () => {
      const fromTime = 'Jun 11, 1999 @ 09:22:11.000';
      const toTime = 'Jun 12, 1999 @ 11:21:04.000';

      before(() => {
        CURRENT_TENANT.newTenant = 'global';
        cy.fleshTenantSettings();
        cy.setTopNavDate(fromTime, toTime);
      });

      it('should show "no results"', () => {
        cy.getElementByTestId('discoverNoResults').should('be.exist');
      });

      it('should suggest a new time range is picked', () => {
        cy.getElementByTestId('discoverNoResultsTimefilter').should('be.exist');
      });
    }
  );

  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5495
  describe.skip('nested query', () => {
    before(() => {
      cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
      cy.waitForSearch();
    });

    it('should support querying on nested fields', function () {
      cy.setTopNavQuery('nestedField:{{}child:nestedValue{}}');
      cy.verifyHitCount('1');
    });
  });

  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5495
  describe.skip('data-shared-item', function () {
    it('should have correct data-shared-item title and description', () => {
      const expected = {
        title: 'A Saved Search',
        description: 'A Saved Search Description',
      };

      cy.loadSaveSearch(expected.title);
      cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
      cy.waitForSearch();
      cy.waitForLoader();
      cy.getElementByTestId('discoverTable').should(
        'have.attr',
        'data-shared-item'
      );
      cy.getElementByTestId('discoverTable').should(
        'have.attr',
        'data-title',
        expected.title
      );
      cy.getElementByTestId('discoverTable').should(
        'have.attr',
        'data-description',
        expected.description
      );
    });
  });

  describe('usage of discover:searchOnPageLoad', () => {
    it('should fetch data from OpenSearch initially when discover:searchOnPageLoad is false', function () {
      cy.setAdvancedSetting({
        'discover:searchOnPageLoad': false,
      });
      miscUtils.visitPage(`app/data-explorer/discover#/`);
      cy.waitForLoader();
      cy.getElementByTestId('discoverTable').should('not.exist');
    });

    it('should not fetch data from OpenSearch initially when discover:searchOnPageLoad is true', function () {
      cy.setAdvancedSetting({
        'discover:searchOnPageLoad': true,
      });
      miscUtils.visitPage(`app/data-explorer/discover#/`);
      cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
      cy.waitForSearch();
      cy.waitForLoader();
      cy.getElementByTestId('discoverTable').should('be.visible');
    });
  });

  // detached from dom issue
  describe.skip('managing fields', function () {
    it('should add a field, sort by it, remove it and also sorting by it', function () {
      // Go to the Discover page
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForLoader();
      cy.waitForSearch();

      cy.getElementByTestId('fieldFilterSearchInput').type('ip');

      cy.getElementByTestId('fieldToggle-ip').click({ force: true });

      cy.getElementByTestId('dataGridHeaderCell-ip').should('be.visible');
      cy.getElementByTestId('dataGridHeaderCell-ip')
        .getElementByTestId('dataGridHeaderCellActionButton-ip')
        .click({ force: true });

      // Sort from A-Z
      cy.contains('button', 'A-Z').click();

      // Move the column to the left
      cy.getElementByTestId('dataGridHeaderCell-ip')
        .getElementByTestId('dataGridHeaderCellActionButton-ip')
        .click({ force: true });

      cy.contains('button', 'Move left').click();

      cy.getElementByTestId('fieldToggle-ip').click({ force: true });

      cy.getElementByTestId('dataGridHeaderCell-ip').should('not.be.exist');
    });
  });

  describe('refresh interval', function () {
    it('should refetch when autofresh is enabled', () => {
      cy.getElementByTestId('openInspectorButton').click();
      cy.getElementByTestId('inspectorPanel')
        .get('.euiTable tr:nth-child(6) td:nth-child(2) span')
        .invoke('text')
        .then((timestamp) => {
          // Get the time stamp of the previous request
          cy.log('Time stamp is', timestamp);

          cy.getElementByTestId('euiFlyoutCloseButton').click();

          // Turn on auto refresh
          cy.getElementByTestId('superDatePickerToggleQuickMenuButton').click();
          cy.getElementByTestId('superDatePickerRefreshIntervalInput')
            .should('be.visible')
            .clear()
            .type('2');
          cy.getElementByTestId('superDatePickerToggleRefreshButton').click();

          // Let auto refresh run
          cy.wait(100);

          // Close the auto refresh
          cy.getElementByTestId('superDatePickerToggleRefreshButton').click();

          // Check the timestamp of the last request, it should be different than the first timestamp
          cy.getElementByTestId('openInspectorButton').click();
          cy.getElementByTestId('inspectorPanel')
            .get('.euiTable tr:nth-child(6) td:nth-child(2) span')
            .invoke('text')
            .should('not.equal', timestamp);
        });
    });
  });
});
