/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MiscUtils,
  TestFixtureHandler,
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

// Setting up the page
describe('discover_advanced_setting', () => {
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

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_with_nested_field/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_with_nested_field/data.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    cy.createIndexPattern(
      'nestedindex',
      {
        title: 'nestedindex*',
        timeFieldName: 'timestamp',
      },
      {
        securitytenant: ['global'],
      }
    );

    // Go to the Discover page
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForSearch();
  });

  describe('maxHeight advanced setting for legacy table', () => {
    it('checks if the table respects maxHeight setting of no truncation', function () {
      cy.setAdvancedSetting({
        'truncate:maxHeight': 0,
      });
      cy.reload();

      cy.get('.truncate-by-height')
        .first()
        .should('have.css', 'max-height', 'none');
    });

    it('checks if the table respects maxHeight setting of truncation', function () {
      cy.setAdvancedSetting({
        'truncate:maxHeight': 130,
      });
      cy.reload();

      cy.get('.truncate-by-height')
        .first()
        .should('have.css', 'max-height', '130px');
    });
  });

  describe('Default Sort Order advanced setting', () => {
    it('check Default Sort Order Descending is respected in new table', function () {
      cy.setAdvancedSetting({
        'discover:sort:defaultOrder': 'desc',
      });
      cy.reload();
      cy.switchDiscoverTable('new');

      cy.get('.euiDataGridRowCell--date')
        .eq(0)
        .invoke('text')
        .then((date1) => {
          cy.get('.euiDataGridRowCell--date')
            .eq(99)
            .invoke('text')
            .then((date2) => {
              expect(new Date(date1.slice(0, -18))).greaterThan(
                new Date(date2.slice(0, -20))
              );
            });
        });
    });

    it('check Default Sort Order Ascending is respected in new table', function () {
      cy.setAdvancedSetting({
        'discover:sort:defaultOrder': 'asc',
      });
      cy.reload();
      cy.switchDiscoverTable('new');

      cy.get('.euiDataGridRowCell--date')
        .eq(0)
        .invoke('text')
        .then((date1) => {
          cy.get('.euiDataGridRowCell--date')
            .eq(99)
            .invoke('text')
            .then((date2) => {
              expect(new Date(date1.slice(0, -18))).lessThan(
                new Date(date2.slice(0, -20))
              );
            });
        });
    });

    it('check Default Sort Order Descending is respected in legacy table', function () {
      cy.setAdvancedSetting({
        'discover:sort:defaultOrder': 'desc',
      });
      cy.reload();

      cy.get('[data-test-subj="docTableField"]')
        .eq(0)
        .invoke('text')
        .then((date1) => {
          cy.get('[data-test-subj="docTableField"]')
            .eq(4)
            .invoke('text')
            .then((date2) => {
              expect(new Date(date1)).greaterThan(new Date(date2));
            });
        });
    });

    it('check Default Sort Order Ascending is respected in legacy table', function () {
      cy.setAdvancedSetting({
        'discover:sort:defaultOrder': 'asc',
      });
      cy.reload();

      cy.get('[data-test-subj="docTableField"]')
        .eq(0)
        .invoke('text')
        .then((date1) => {
          cy.get('[data-test-subj="docTableField"]')
            .eq(4)
            .invoke('text')
            .then((date2) => {
              expect(new Date(date1)).lessThan(new Date(date2));
            });
        });
    });

    after(() => {
      cy.setAdvancedSetting({
        'discover:sort:defaultOrder': 'desc',
      });
      cy.reload();
    });
  });

  describe('Number of rows advanced setting', () => {
    before(() => {
      cy.setAdvancedSetting({
        'discover:sampleSize': 5,
      });
      cy.reload();
      cy.switchDiscoverTable('new');
    });

    it('check new table respects Number of rows setting', function () {
      cy.get('[aria-label="Inspect document details"]').should(
        'have.length',
        5
      );
    });

    it('check legacy table respects Number of rows setting', function () {
      cy.switchDiscoverTable('legacy');
      cy.get('[aria-label="Next"]').should('have.length', 5);
    });

    after(() => {
      cy.setAdvancedSetting({
        'discover:sampleSize': 500,
      });
      cy.reload();
    });
  });

  describe('Number of terms advanced setting', () => {
    before(() => {
      cy.setAdvancedSetting({
        'discover:aggs:terms:size': 5,
      });
      cy.reload();
    });

    it('check if table respects Number of terms setting', function () {
      cy.get('[data-test-subj="fieldToggle-machine.ram"]').click();
      cy.get('[data-test-subj="field-machine.ram-showDetails"]')
        .click()
        .then(() => {
          cy.get('[data-test-subj="fieldVisualize-machine.ram"]').click();
          cy.get('[class="series histogram"]')
            .find('[data-label="Count"]')
            .should('have.length', 5);
        });
    });

    after(() => {
      cy.setAdvancedSetting({
        'discover:aggs:terms:size': 20,
      });
      cy.reload();
    });
  });

  describe('hideTimeColumn advanced setting', () => {
    before(() => {
      cy.setAdvancedSetting({
        'doc_table:hideTimeColumn': true,
      });
    });

    it('check time is not added on removing last column when hideTimeColumn is true in new table', function () {
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
      cy.switchDiscoverTable('new');
      cy.get('[data-test-subj="dataGridHeaderCell-@timestamp"]').should(
        'not.exist'
      );
      cy.get('[data-test-subj="fieldToggle-agent"]').click();
      cy.get('[data-test-subj="fieldToggle-agent"]').click();
      cy.get('[data-test-subj="dataGridHeaderCell-@timestamp"]').should(
        'not.exist'
      );
    });

    it('check time is not added on removing last column when hideTimeColumn is true in legacy table', function () {
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
      cy.get('[data-test-subj="dataGridHeaderCell-@timestamp"]').should(
        'not.exist'
      );
      cy.get('[data-test-subj="fieldToggle-agent"]').click();
      cy.get('[data-test-subj="fieldToggle-agent"]').click();
      cy.get('[data-test-subj="dataGridHeaderCell-@timestamp"]').should(
        'not.exist'
      );
    });

    after(() => {
      cy.setAdvancedSetting({
        'doc_table:hideTimeColumn': false,
      });
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
    });
  });

  describe('doc_table:highlight advanced setting', () => {
    before(() => {
      // Selecting a field and adding a search filter for a value
      cy.get('[data-test-subj="fieldToggle-index"]')
        .click()
        .then(() => {
          cy.get('[data-test-subj="field-index-showDetails"]').click();
          cy.get('[data-test-subj="plus-index-logstash-2015.09.22"]').click();
        });
    });

    it('check new table respects doc_table:highlight setting', function () {
      // check if we have highlighted fields
      cy.setAdvancedSetting({
        'doc_table:highlight': false,
      });
      cy.reload();
      cy.switchDiscoverTable('new');
      cy.get('mark').should('not.exist');

      // reset the setting to default value
      cy.setAdvancedSetting({
        'doc_table:highlight': true,
      });
      cy.reload();
      cy.switchDiscoverTable('new');
      cy.get('mark').should('exist');
    });

    it('check legacy table respects doc_table:highlight setting', function () {
      // check if we have highlighted fields
      cy.setAdvancedSetting({
        'doc_table:highlight': false,
      });
      cy.reload();
      // cy.switchDiscoverTable("legacy");
      cy.get('mark').should('not.exist');

      // reset the setting to default value
      cy.setAdvancedSetting({
        'doc_table:highlight': true,
      });
      cy.reload();

      cy.get('mark').should('exist');
    });

    after(() => {
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
    });
  });

  describe('defaultColumns advanced setting', () => {
    before(() => {
      cy.get('[data-test-subj="comboBoxSearchInput"]')
        .type('logstash')
        .then(() => {
          cy.waitForSearch();
          cy.get('[title="logstash-*"]').trigger('click');
        });
    });

    it('check defaultcolumns setting is respected in new table', function () {
      cy.setAdvancedSetting({
        defaultColumns: ['host', 'agent'],
      });
      cy.reload();
      cy.switchDiscoverTable('new');
      cy.get('[data-test-subj="dataGridHeaderCell-agent"]').should(
        'be.visible'
      );
      cy.get('[data-test-subj="dataGridHeaderCell-host"]').should('be.visible');
    });

    it('check defaultcolumns setting is respected in legacy table', function () {
      cy.setAdvancedSetting({
        defaultColumns: ['host', 'agent'],
      });
      cy.reload();
      cy.get('[data-test-subj="docTableHeader-agent"]').should('be.visible');
      cy.get('[data-test-subj="docTableHeader-host"]').should('be.visible');
    });

    after(() => {
      cy.setAdvancedSetting({
        defaultColumns: ['_source'],
      });

      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
    });
  });

  describe('searchOnPageLoad advanced setting', () => {
    before(() => {
      cy.setAdvancedSetting({
        'discover:searchOnPageLoad': false,
      });
      cy.reload();
    });

    it('check refresh data button is displayed when searchOnPageLoad is set as false', function () {
      cy.get('.euiButton__text').contains('Refresh data').should('exist');
    });

    after(() => {
      cy.setAdvancedSetting({
        'discover:searchOnPageLoad': true,
      });
      cy.reload();
    });
  });

  describe('modifyColumnsOnSwitch advanced setting', () => {
    before(() => {
      cy.setAdvancedSetting({
        'discover:modifyColumnsOnSwitch': false,
      });
    });

    it.skip('check columns still available after switching data sources in legacy table', function () {
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
      cy.get('[data-test-subj="fieldToggle-agent"]').click();

      // Now switching the data sources
      cy.get('[data-test-subj="comboBoxSearchInput"]')
        .type('nestedindex')
        .then(() => {
          cy.get('[title="nestedindex*"]')
            .trigger('click')
            .then(() => {
              cy.wait(300);
              cy.get('[data-test-subj="docTableHeader-agent"]').should(
                'be.visible'
              );
              cy.get('[data-test-subj="docTableField"]')
                .contains('-')
                .should('exist');
            });
        });

      /*
       */
    });

    it('check columns still available after switching data sources in new table', function () {
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
      cy.switchDiscoverTable('new');

      cy.get('[data-test-subj="fieldToggle-agent"]').click();

      // Now switching the data sources
      cy.get('[data-test-subj="comboBoxSearchInput"]')
        .type('nestedindex')
        .then(() => {
          cy.waitForSearch();
          cy.get('[title="nestedindex*"]')
            .trigger('click')
            .then(() => {
              cy.get('[data-test-subj="dataGridHeaderCell-agent"]').should(
                'be.visible'
              );
              cy.get('[data-test-subj="dataGridRowCell"]')
                .contains('-')
                .should('exist');
            });
        });
    });

    after(() => {
      cy.setAdvancedSetting({
        'discover:modifyColumnsOnSwitch': true,
      });
    });
  });

  after(() => {
    cy.deleteIndexPattern('nestedindex');
  });
});
