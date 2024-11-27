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

  after(() => {
    cy.deleteSavedObjectByType('index-pattern');
  });

  it('check _source is available as default selected field', function () {
    cy.get('[data-test-subj="fieldList-selected"]').should(
      'contain.text',
      '_source'
    );
  });
  it('check timestamp is not added to selected field when a column is added', function () {
    // Click to add fields
    cy.get('[data-test-subj="fieldToggle-_id"]').click();
    cy.get('[data-test-subj="fieldToggle-agent"]').click();

    // Check that the selected field don't contain timestamp
    cy.get('[data-test-subj="fieldList-selected"]').should(
      'not.contain.text',
      '@timestamp'
    );
  });
  it('check timestamp is not added to selected field when a column is removed', function () {
    cy.get('[data-test-subj="fieldToggle-_id"]').first().click();

    // Check that the selected field don't contain timestamp
    cy.get('[data-test-subj="fieldList-selected"]').should(
      'not.contain.text',
      '@timestamp'
    );
  });
  it('check _source gets restored when all selected columns are removed', function () {
    cy.get('[data-test-subj="fieldToggle-agent"]').first().click(); // toggle the previously selected fields

    // Now the field selected should get defaulted to _source
    cy.get('[data-test-subj="fieldList-selected"]').should('have.length', 1);
    cy.get('[data-test-subj="fieldList-selected"]').should(
      'contain.text',
      '_source'
    );
  });
  it('check field is removed from available fields and added to selected fields when the field is selected', function () {
    // Field present in Available Field Section
    cy.get('[data-test-subj="fieldList-unpopular"]')
      .find('[data-test-subj="field-host"]')
      .should('exist');

    // Toggle to display the field
    cy.get('[data-test-subj="fieldList-unpopular"]')
      .find('[data-test-subj="fieldToggle-host"]')
      .click();

    // Check to ensure the field is no longer present in Available Field
    cy.get('[data-test-subj="fieldList-unpopular"]')
      .find('[data-test-subj="field-host"]')
      .should('not.exist');
    // Check the field is present in the Selected Field Secition
    cy.get('[data-test-subj="fieldList-selected"]').should(
      'contain.text',
      'host'
    );

    // Reseting the toggled Field
    cy.get('[data-test-subj="fieldList-selected"]')
      .find('[data-test-subj="fieldToggle-host"]')
      .click();
  });

  it('check collapsablity of left navigation display', function () {
    cy.get('[data-test-subj="euiResizableButton"]')
      .trigger('click')
      .then(() => {
        cy.get('[aria-label="Press to toggle this panel"]')
          .trigger('click')
          .then(() => {
            cy.get('[data-test-subj="datasetSelectorButton"]').should(
              'not.be.visible'
            );
          });
      });
  });

  it('check nested field are available in left navigation pane', function () {
    // Create an Index pattern
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
    cy.reload();

    cy.get('[data-test-subj="datasetSelectorButton"]').click();
    cy.get('input[aria-label="Filter options"]')
      .click()
      .type('nestedindex')
      .then(() => {
        cy.waitForSearch();
        cy.get('[title="nestedindex*"]')
          .trigger('click')
          .then(() => {
            // validate the presence of nested fields in left navigation pane
            cy.get('[data-test-subj="fieldList-unpopular"]')
              .find('[data-test-subj="field-products.base_price"]')
              .should('exist');
            cy.get('[data-test-subj="fieldList-unpopular"]')
              .find('[data-test-subj="field-products.quantity"]')
              .should('exist');
            cy.get('[data-test-subj="fieldList-unpopular"]')
              .find('[data-test-subj="field-products.discount_percentage"]')
              .should('exist');
            cy.get('[data-test-subj="fieldList-unpopular"]')
              .find('[data-test-subj="field-products.manufacturer"]')
              .should('exist');
          });
      });
  });
});
