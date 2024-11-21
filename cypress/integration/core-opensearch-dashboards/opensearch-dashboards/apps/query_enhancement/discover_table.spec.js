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
  before(() => {
    // import logstash functional
    CURRENT_TENANT.newTenant = 'global';
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

    // Go to the Discover page
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.setDatasource('logstash-*');
    cy.waitForSearch();
  });

  describe('auto line wrapping in legacy table', () => {
    it('auto line wrapping in legacy table', function () {
      // last element is _scrore if there is wrapping this field won't be present
      // So we check for the presence of the _score element in the legacy table

      cy.get('.euiDescriptionList__title').should('contain.text', '_score');
    });
  });

  describe('expand multiple documents in legacy table', () => {
    it('checks if multiple documents can be expanded in legacy table', function () {
      // expanding a document in the table
      cy.get('[data-test-subj="docTableExpandToggleColumn"]')
        .find('[type="button"]')
        .eq(2)
        .click();

      // expanding a document in the table
      cy.get('[data-test-subj="docTableExpandToggleColumn"]')
        .find('[type="button"]')
        .eq(3)
        .click();

      // checking the number of exapnded documents visible on screen
      cy.get('[data-test-subj="tableDocViewRow-_index"]').should(
        'have.length',
        2
      );
    });
  });
});
