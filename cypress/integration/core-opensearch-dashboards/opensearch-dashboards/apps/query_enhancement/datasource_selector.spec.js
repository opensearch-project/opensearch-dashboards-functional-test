/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  TestFixtureHandler,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';
import { cloneDeep } from 'lodash';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('Data source selector', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );
    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/data.json.txt'
    );

    miscUtils.visitPage('app/data-explorer/discover#/');
  });

  after(() => {
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_pattern_without_timefield/mappings.json.txt'
    );
    cy.deleteSavedObjectByType('index-pattern');
  });

  it('displays all data sources by default', () => {
    // Needs validation
    cy.get('[data-test-subj="datasetSelectorButton"]').click({ force: true });
    cy.get('.euiSelectableListItem__text').should('have.length', 2);
  });

  it('filters options based on user input', () => {
    cy.get('input[aria-label="Filter options"]').click().type('without', {
      force: true,
    });
    cy.get('.euiSelectableListItem__text').should('have.length', 1);
    cy.get('.euiSelectableListItem__text')
      .first()
      .should('contain', 'without-timefield');
  });

  it('updates the visual length of the dropdown based on filtered results', () => {
    // cy.get('[data-test-subj="datasetSelectorButton"]').click({ force: true });
    cy.get('input[aria-label="Filter options"]').click().clear({
      force: true,
    });
    cy.get('input[aria-label="Filter options"]')
      .click()
      .type('without-timefield', {
        force: true,
      });
    cy.get('.euiSelectableList').then(($listAfterFilter) => {
      const heightAfterFilter = $listAfterFilter.height();
      cy.get('input[aria-label="Filter options"]').click().clear({
        force: true,
      });
      cy.get('.euiSelectableList').should(($listAll) => {
        expect($listAll.height()).to.be.greaterThan(heightAfterFilter);
      });
    });
  });

  it('selects the correct option when clicked', () => {
    // cy.get('[data-test-subj="datasetSelectorButton"]').click({ force: true });
    cy.get('input[aria-label="Filter options"]')
      .click()
      .type('with-timefield', {
        force: true,
      });

    cy.contains('.euiSelectableListItem__text', 'with-timefield').click();
    cy.get(
      '[data-test-subj="datasetSelectorButton"] .euiButton__content'
    ).should('contain', 'with-timefield');
  });
});

describe('data source selector', () => {
  before(() => {
    // Creating additional index patterns
    // logstash index pattern

    cy.createIndexPattern(
      'logstash-sample-1',
      {
        title: 'logstash-sample-1*',
        timeFieldName: 'timestamp',
      },
      {
        securitytenant: ['global'],
      }
    );
    cy.createIndexPattern(
      'logstash-sample-2',
      {
        title: 'logstash-sample-2*',
        timeFieldName: 'timestamp',
      },
      {
        securitytenant: ['global'],
      }
    );
    cy.wait(5000); // Intentional Wait
    cy.reload();
  });
  it('check data source selector options are ordered', function () {
    const indexPatterns = [];
    cy.get('[data-test-subj="datasetSelectorButton"]').click({ force: true });
    cy.get('input[aria-label="Filter options"]')
      .click()
      .type('l')
      .then(() => {
        cy.get('[role="option"]')
          .each((res) => {
            indexPatterns.push(res.text());
          })
          .then(() => {
            const sortedIndexPatterns = cloneDeep(indexPatterns);
            sortedIndexPatterns.sort();

            console.log(sortedIndexPatterns);

            cy.wrap(indexPatterns).should('deep.equal', sortedIndexPatterns);
          });
      });
  });

  it('check filtering in data source selector ', function () {
    cy.get('input[aria-label="Filter options"]')
      .click()
      .clear()
      .type('logstash-sample')
      .then(() => {
        cy.get('[role="option"]').should('have.length', 2);
      });
  });

  after(() => {
    cy.deleteIndexPattern('logstash-sample-1');
    cy.deleteIndexPattern('logstash-sample-2');
  });
});
