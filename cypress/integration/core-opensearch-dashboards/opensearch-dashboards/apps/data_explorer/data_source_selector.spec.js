/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  TestFixtureHandler,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('Data source selector', () => {
  before(() => {
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );
    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/data.json.txt'
    );

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );
    cy.deleteSavedObjectByType('index-pattern');
  });

  it('displays all data sources by default', () => {
    cy.get('[data-test-subj="dataExplorerDSSelect"]').click();
    cy.get('.euiComboBoxOptionsList').should('exist');
    cy.get('.euiComboBoxOption__content').should('have.length', 2);
  });

  it('filters options based on user input', () => {
    cy.get('[data-test-subj="dataExplorerDSSelect"] input').type('without', {
      force: true,
    });
    cy.get('.euiComboBoxOption__content').should('have.length', 1);
    cy.get('.euiComboBoxOption__content')
      .first()
      .should('contain', 'without-timefield');
  });

  it('updates the visual length of the dropdown based on filtered results', () => {
    cy.get('[data-test-subj="dataExplorerDSSelect"] input').clear({
      force: true,
    });
    cy.get('[data-test-subj="dataExplorerDSSelect"] input').type(
      'without-timefield',
      {
        force: true,
      }
    );
    cy.get('.euiComboBoxOptionsList').then(($listAfterFilter) => {
      const heightAfterFilter = $listAfterFilter.height();
      cy.get('[data-test-subj="dataExplorerDSSelect"] input').clear({
        force: true,
      });
      cy.get('.euiComboBoxOptionsList').should(($listAll) => {
        expect($listAll.height()).to.be.greaterThan(heightAfterFilter);
      });
    });
  });

  it('selects the correct option when clicked', () => {
    cy.get('[data-test-subj="dataExplorerDSSelect"] input').type(
      'with-timefield',
      {
        force: true,
      }
    );

    cy.contains('.euiComboBoxOption__content', 'with-timefield').click();
    cy.get('[data-test-subj="dataExplorerDSSelect"] .euiComboBoxPill').should(
      'contain',
      'with-timefield'
    );
  });
});
