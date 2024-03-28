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
describe('discover_table', () => {
  beforeEach(() => {
    if (Cypress.env('SECURITY_ENABLED')) {
      /**
       * Security plugin is using private tenant as default.
       * So here we'd need to set global tenant as default manually.
       */
      cy.changeDefaultTenant({
        multitenancy_enabled: true,
        private_tenant_enabled: true,
        default_tenant: 'global',
      });
    }
    CURRENT_TENANT.newTenant = 'global';
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
    cy.waitForSearch();
    cy.waitForLoader();
  });

  after(() => {});

  describe('no line wrapping in legacy table', () => {
    it('checks that there is no line wrapping by default in the legacy table', function () {
      // last element is _scrore if there is wrapping this field won't be present
      // So we check for the presence of the _score element in the legacy table

      cy.get('.euiDescriptionList__title').should('contain.text', '_score');
    });
  });

  describe('maxHeight With truncation', () => {
    before(() => {
      cy.setAdvancedSetting({
        'truncate:maxHeight': 130,
      });
    });

    it('checks if the table respects maxHeight setting of truncation', function () {
      cy.get('.truncate-by-height')
        .first()
        .should('have.css', 'max-height', '130px');
    });
  });

  describe('maxHeight With No truncation', () => {
    before(() => {
      cy.setAdvancedSetting({
        'truncate:maxHeight': 0,
      });
    });

    it('checks if the table respects maxHeight setting of no truncation', function () {
      cy.get('.truncate-by-height')
        .first()
        .should('have.css', 'max-height', 'none');
    });
  });

  describe('dynamic height of row in new table', () => {
    before(() => {
      cy.switchDiscoverTable('new');
      cy.waitForLoader();
    });

    it('checks if height of new table changes with change to line count property ', function () {
      cy.get('[data-test-subj="dataGridRowCell"]')
        .first()
        .invoke('height') // Get Row Height Before update
        .then((res) => {
          cy.get('.euiButtonEmpty')
            .contains('Display')
            .click()
            .then(() => {
              cy.get('[type="number"]').type('{selectall}').type('2'); // Update the line count value
            });

          cy.get('[data-test-subj="dataGridRowCell"]')
            .first()
            .invoke('height')
            .should('be.gt', res); // Check if the new height is greater than previus height
        });
    });
  });
});
