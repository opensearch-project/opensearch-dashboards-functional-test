/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  cleanTests,
  prepareTests,
} from '../../../../utils/dashboards/feature-anywhere/helpers';

let indexName = 'feature-anywhere-sample-index';
const indexPatternName = 'feature-anywhere-sample-*';
const visualizationName = 'Feature Anywhere Line Chart';
const dashboardName = 'Feature Anywhere Dashboard';

describe('Feature anywhere tests', () => {
  before(() => {
    cleanTests(indexName, indexPatternName, visualizationName, dashboardName);
    prepareTests(indexName, indexPatternName);
  });

  beforeEach(() => {
    cy.visit('http://localhost:5601/app/dashboards');
  });

  after(() => {
    cleanTests(indexName, indexPatternName, visualizationName, dashboardName);
  });

  let dashboardId;

  it('Create dashboard', () => {
    cy.visit('http://localhost:5601/app/dashboards');

    cy.get('[data-test-subj="createDashboardPromptButton"]')
      .should('be.visible')
      .click();

    cy.get('button').contains('Create new').click();

    cy.get('[data-test-subj="visType-line"]').click();

    cy.get('[data-test-subj="savedObjectFinderSearchInput"]').type(
      `${indexPatternName}{enter}`
    );

    cy.get(`[title="${indexPatternName}"]`).click();

    cy.get('.euiTitle')
      .contains('Buckets')
      .parent()
      .find('[data-test-subj="visEditorAdd_buckets"]')
      .click();
    cy.get('[data-test-subj="visEditorAdd_buckets_X-axis"]').click();

    cy.get('.euiTitle')
      .contains('Buckets')
      .parent()
      .within(() => {
        cy.wait(1000);
        cy.get('[data-test-subj="comboBoxInput"]')
          .find('input')
          .type('Date Histogram{enter}', { force: true });
      });

    cy.get('[data-test-subj="visualizeEditorRenderButton"]').click({
      force: true,
    });
    cy.get('[data-test-subj="visualizeSaveButton"]').click({
      force: true,
    });
    cy.get('[data-test-subj="savedObjectTitle"]').type(visualizationName);
    cy.get('[data-test-subj="confirmSaveSavedObjectButton"]').click({
      force: true,
    });
    cy.get('[data-test-subj="dashboardSaveMenuItem"]').click({
      force: true,
    });

    cy.get('[data-test-subj="savedObjectTitle"]').type(dashboardName);

    cy.intercept('POST', '/api/saved_objects/dashboard?overwrite=true').as(
      'saveDashboard'
    );
    cy.get('[data-test-subj="confirmSaveSavedObjectButton"]')
      .click({
        force: true,
      })
      .then(() => {
        cy.wait('@saveDashboard').then((interceptor) => {
          dashboardId = interceptor.response.body.id;
          cy.visit(`http://localhost:5601/app/dashboards#/view/${dashboardId}`);
        });
      });
  });

  describe('Validate Dashboard', () => {
    beforeEach(() => {
      cy.visit(`http://localhost:5601/app/dashboards#/view/${dashboardId}`);
      cy.wait(5000);
    });

    it('Visualizations should be visible', () => {
      cy.getVisPanelByTitle(visualizationName);
    });

    it('Validate visualization charts', () => {
      cy.getVisPanelByTitle(visualizationName).within(($panel) => {
        cy.wrap($panel).getLegendNodes().contains('Count');

        cy.getChart()
          .getCircleNodes()
          .then(($nodes) => {
            cy.wrap($nodes).should('have.length', 1);
            cy.wrap($nodes).realHover();
          });
      });

      cy.get('div[class="visTooltip"]').within(() => {
        cy.get('table tr')
          .eq(1)
          .then(($tr) => {
            cy.wrap($tr).within(() => {
              cy.get('.visTooltip__label').contains('Count');
              cy.get('.visTooltip__value').contains(2);
            });
          });
      });
    });

    it('Validate visualization events', () => {
      cy.getVisPanelByTitle(visualizationName)
        .openVisContextMenu()
        .clickVisPanelMenuItem('View Events');

      cy.get('.euiFlyout').find('.euiTitle').contains(visualizationName);
    });
  });
});
