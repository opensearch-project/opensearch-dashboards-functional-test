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

const indexSet = ['query-enhance'];

describe('query enhancement queries', { scrollBehavior: false }, () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    cy.deleteAllIndices();
    cy.deleteSavedObjectByType('index-pattern');

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/query_enhancement/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/query_enhancement/data.json.txt'
    );

    // Go to the Discover page
    miscUtils.visitPage(`app/data-explorer/discover#/`);

    cy.waitForLoaderNewHeader();
  });

  describe('send queries', () => {
    it.skip('with DQL', function () {
      const query = `geo.src:FR`;
      cy.setSingleLineQueryEditor(query);
      cy.waitForLoaderNewHeader();
      cy.waitForSearch();
      cy.verifyHitCount(119);

      //query should persist across refresh
      cy.reload();
      cy.verifyHitCount(119);
    });

    it.skip('with Lucene', function () {
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

    it('with SQL', function () {
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
      cy.get(`[title="Indexes"]`).click();
      cy.get(`[title="Default Cluster"]`).click();
      cy.get(`[title="timestamp-nanos"]`).click();
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
      cy.getElementByTestId('advancedSelectorLanguageSelect').select('PPL');
      cy.getElementByTestId(`advancedSelectorTimeFieldSelect`).select(
        'timestamp'
      );
      cy.getElementByTestId('advancedSelectorConfirmButton').click();

      cy.waitForLoaderNewHeader();
      cy.reload();
    });

    it.skip('with SQL', function () {
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
