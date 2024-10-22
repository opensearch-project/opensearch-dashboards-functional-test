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

describe('query enhancement queries', { scrollBehavior: false }, () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    cy.deleteAllIndices();
    cy.deleteSavedObjectByType('index-pattern');
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

    //   miscUtils.visitPage(`app/import_sample_data`);
    //   cy.getElementByTestId(
    //     'addSampleDataSetecommerce'
    //   ).click();
    //   cy.waitForLoaderNewHeader();

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    // Go to the Discover page
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );

    cy.get(`[class~="datasetSelector__button"]`).click();
    cy.get(`[data-test-subj="datasetOption-logstash-*"]`).click();

    cy.waitForLoaderNewHeader();
    cy.waitForSearch();
  });

  describe('send queries', () => {
    it('with DQL', function () {
      const query = `geo.src:FR`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.verifyHitCount(119);

      //query should persist across refresh
      cy.reload();
      cy.verifyHitCount(119);
    });

    it('with Lucene', function () {
      cy.get(`[data-test-subj="queryEditorLanguageSelector"]`).click();
      cy.get(`[class~="languageSelector__menuItem"]`).eq(1).click({
        force: true,
      });

      const query = `geo.src:FR`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.verifyHitCount(119);

      //query should persist across refresh
      cy.reload();
      cy.verifyHitCount(119);
    });

    it('with PPL', function () {
      cy.get(`[data-test-subj="queryEditorLanguageSelector"]`).click();
      cy.get(`[class~="languageSelector__menuItem"]`).eq(2).click({
        force: true,
      });

      // default PPL query should be set
      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.verifyHitCount('14,004');

      //query should persist across refresh
      cy.reload();
      cy.verifyHitCount('14,004');
    });

    it('with SQL', function () {
      cy.get(`[data-test-subj="queryEditorLanguageSelector"]`).click();
      cy.get(`[class~="languageSelector__menuItem"]`).eq(3).click({
        force: true,
      });

      // default SQL query should be set
      cy.waitForLoaderNewHeader();
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');

      //query should persist across refresh
      cy.reload();
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');
    });
  });
});
