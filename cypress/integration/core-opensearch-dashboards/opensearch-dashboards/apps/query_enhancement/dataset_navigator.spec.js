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

describe('dataset navigator', { scrollBehavior: false }, () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    cy.deleteAllIndices();
    cy.deleteSavedObjectByType('index-pattern');
  });

  describe('empty state', () => {
    it('no index pattern', function () {
      // Go to the Discover page
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );

      cy.waitForLoaderNewHeader();
      cy.getElementByTestId('discoverNoIndexPatterns');
    });
  });

  describe('select indices', () => {
    before(() => {
      // import logstash functional
      testFixtureHandler.importJSONDocIfNeeded(
        indexSet,
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
      );

      // Go to the Discover page
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
    });

    it('with SQL as default language', function () {
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Indexes"]`).click();
      cy.get(`[title="Default Cluster"]`).click();
      cy.get(`[title="logstash-2015.09.20"]`).click();
      cy.getElementByTestId('datasetSelectorNext').click();

      cy.get(`[class="euiModalHeader__title"]`).should(
        'contain',
        'Step 2: Configure data'
      );
      // should have two options: SQL and PPL
      cy.getElementByTestId('advancedSelectorLanguageSelect')
        .get('option')
        .should('have.length', 2);

      //select SQL
      cy.getElementByTestId('advancedSelectorLanguageSelect').select('SQL');
      cy.getElementByTestId('advancedSelectorConfirmButton').click();

      cy.waitForLoaderNewHeader();

      // Selected language in the language picker should be SQL
      cy.getElementByTestId('queryEditorLanguageSelector').should(
        'contain',
        'SQL'
      );

      // The following steps are needed because when selecting SQL, discover loaded with data but the
      // multi-line query editor are not loaded properly(it renders a single line query bar) unless we select SQL again
      // This bug only exist in cypress test; can not reproduce manually
      cy.get(`[data-test-subj="queryEditorLanguageSelector"]`).click();
      cy.get(`[class~="languageSelector__menuItem"]`)
        .should('have.length', 2)
        .eq(1)
        .click({
          force: true,
        });
      cy.waitForLoaderNewHeader();
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');

      // Switch language to PPL
      cy.get(`[data-test-subj="queryEditorLanguageSelector"]`).click();
      cy.get(`[class~="languageSelector__menuItem"]`).eq(0).click({
        force: true,
      });
      cy.waitForLoaderNewHeader();
      cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');
    });

    it('with PPL as default language', function () {
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Indexes"]`).click();
      cy.get(`[title="Default Cluster"]`).click();
      cy.get(`[title="logstash-2015.09.21"]`).click();
      cy.getElementByTestId('datasetSelectorNext').click();

      cy.get(`[class="euiModalHeader__title"]`).should(
        'contain',
        'Step 2: Configure data'
      );

      // should have two options: SQL and PPL
      cy.getElementByTestId('advancedSelectorLanguageSelect')
        .get('option')
        .should('have.length', 2);

      //select PPL
      cy.getElementByTestId('advancedSelectorLanguageSelect').select('PPL');

      cy.getElementByTestId(`advancedSelectorTimeFieldSelect`).select(
        '@timestamp'
      );
      cy.getElementByTestId('advancedSelectorConfirmButton').click();

      cy.waitForLoaderNewHeader();

      // Selected language should be PPL
      cy.getElementByTestId('queryEditorLanguageSelector').should(
        'contain',
        'PPL'
      );

      cy.waitForLoaderNewHeader();

      // Query should finish running with timestamp and finish time in the footer
      cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
      cy.getElementByTestId('queryEditorFooterTimestamp').should(
        'contain',
        '@timestamp'
      );

      // Switch language to SQL
      cy.getElementByTestId('queryEditorLanguageSelector').click();
      cy.get(`[class~="languageSelector__menuItem"]`)
        .should('have.length', 2)
        .eq(1)
        .click({
          force: true,
        });
      cy.waitForLoaderNewHeader();
      cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
      cy.getElementByTestId('queryEditorFooterTimestamp').should(
        'contain',
        '@timestamp'
      );
    });
  });

  describe('index pattern', () => {
    it('create index pattern and select it', function () {
      testFixtureHandler.importJSONMapping(
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
      );

      testFixtureHandler.importJSONDoc(
        'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
      );

      // Go to the Discover page
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );

      cy.get(`[class~="datasetSelector__button"]`).click();
      cy.getElementByTestId(`datasetOption-logstash-*`).click();

      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.verifyHitCount('14,004');
    });
  });
});
