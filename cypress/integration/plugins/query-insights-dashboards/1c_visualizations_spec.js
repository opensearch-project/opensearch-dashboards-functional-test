/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import MIXED from '../../../fixtures/stub_top_queries.json';
import { makeTimestampedBody } from '../../../utils/plugins/query-insights-dashboards/helpers';

describe('Query Insights — Stats & Visualizations Panel', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/top_queries/**', (req) => {
      req.reply({ statusCode: 200, body: makeTimestampedBody(MIXED) });
    }).as('topQueries');

    cy.waitForQueryInsightsPlugin();
    cy.wait('@topQueries');
  });

  it('displays visualizations panel with Query/Group toggle', () => {
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Query').should('be.visible');
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Group').should('be.visible');
  });

  it('hides content and Query/Group toggle when collapsed, restores when expanded', () => {
    // Verify content is visible initially
    cy.contains('P90 LATENCY').should('be.visible');
    cy.contains('Queries by Node').should('be.visible');
    cy.contains('Performance Analysis').should('be.visible');
    // Query/Group toggle should be visible
    cy.get('[data-test-subj="visualizationModeToggle"]').should('be.visible');

    // Collapse accordion by clicking the Visualizations heading
    cy.contains('h3', 'Stats & Visualizations').click();

    // Content should be hidden
    cy.contains('P90 LATENCY').should('not.be.visible');
    cy.contains('Queries by Node').should('not.be.visible');
    cy.contains('Performance Analysis').should('not.be.visible');
    // Query/Group toggle should not exist when collapsed (rendered as null)
    cy.get('[data-test-subj="visualizationModeToggle"]').should('not.exist');

    // Expand accordion
    cy.contains('h3', 'Stats & Visualizations').click();

    // Content and toggle should be restored
    cy.contains('P90 LATENCY').should('be.visible');
    cy.contains('Queries by Node').should('be.visible');
    cy.contains('Performance Analysis').should('be.visible');
    cy.get('[data-test-subj="visualizationModeToggle"]').should('be.visible');
  });

  it('displays percentile metrics in Query mode', () => {
    cy.contains('P90 LATENCY').should('be.visible');
    cy.contains('P90 CPU TIME').should('be.visible');
    cy.contains('P90 MEMORY').should('be.visible');
    cy.contains('P99 LATENCY').should('be.visible');
    cy.contains('P99 CPU TIME').should('be.visible');
    cy.contains('P99 MEMORY').should('be.visible');
  });

  it('shows empty state when Group mode is selected', () => {
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Group').click();
    cy.contains('No Visualization Available').should('be.visible');
    cy.contains('Visualizations for grouped queries are coming soon').should('be.visible');
  });

  it('switches back to Query mode and shows visualizations', () => {
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Group').click();
    cy.contains('No Visualization Available').should('be.visible');
    cy.get('[data-test-subj="visualizationModeToggle"]').contains('Query').click();
    cy.contains('P90 LATENCY').should('be.visible');
  });

  describe('Pie Chart', () => {
    it('displays Queries by Node chart with table', () => {
      cy.contains('Queries by Node').should('be.visible');
      // Verify the pie chart table has expected columns
      cy.contains('Queries by Node')
        .closest('.euiPanel')
        .within(() => {
          cy.contains('Query Count').should('be.visible');
          cy.contains('Percentage').should('be.visible');
        });
    });

    it('changes grouping via dropdown', () => {
      cy.contains('h3', 'Queries by Node')
        .closest('.euiPanel')
        .find('select')
        .first()
        .as('groupByDropdown');

      cy.get('@groupByDropdown').should('have.value', 'node');

      cy.get('@groupByDropdown').select('index');
      cy.contains('h3', 'Queries by Index').should('be.visible');

      cy.contains('h3', 'Queries by Index')
        .closest('.euiPanel')
        .find('select')
        .first()
        .select('username');
      cy.contains('h3', 'Queries by Username').should('be.visible');
    });

    it('table is sortable', () => {
      cy.contains('Queries by Node')
        .closest('.euiPanel')
        .within(() => {
          // Click Query Count header to sort
          cy.contains('Query Count').click();
          // Verify sorting changed (header should have sort indicator)
          cy.get('.euiTableHeaderCell').contains('Query Count').should('exist');
        });
    });
  });

  describe('Performance Analysis', () => {
    it('displays section with chart type toggle and metric dropdown', () => {
      cy.contains('h3', 'Performance Analysis').should('be.visible');
      cy.contains('h3', 'Performance Analysis')
        .closest('.euiPanel')
        .within(() => {
          // Chart type toggle visible
          cy.get('.euiButtonGroup').contains('Line Chart').should('be.visible');
          cy.get('.euiButtonGroup').contains('Heatmap').should('be.visible');
          // Metric dropdown works
          cy.get('select').first().as('metricDropdown');
          cy.get('@metricDropdown').should('have.value', 'latency');
          cy.get('@metricDropdown').select('cpu').should('have.value', 'cpu');
          cy.get('@metricDropdown').select('memory').should('have.value', 'memory');
        });
    });

    it('shows heatmap options and disables aggregation for Count metric', () => {
      cy.contains('h3', 'Performance Analysis').closest('.euiPanel').as('perfPanel');

      // Line Chart mode: Count not available, only 1 dropdown
      cy.get('@perfPanel').find('select').should('have.length', 1);
      cy.get('@perfPanel').find('select').first().find('option').should('not.contain', 'Count');

      // Switch to Heatmap
      cy.get('@perfPanel').find('.euiButtonGroup').contains('Heatmap').click();

      // Heatmap mode: 3 dropdowns (groupBy, metric, aggregation)
      cy.get('@perfPanel').find('select').should('have.length', 3);

      // GroupBy options
      cy.get('@perfPanel')
        .find('select')
        .first()
        .within(() => {
          cy.get('option').should('contain', 'Index');
          cy.get('option').should('contain', 'Node');
          cy.get('option').should('contain', 'Username');
        });

      // Aggregation options
      cy.get('@perfPanel')
        .find('select')
        .last()
        .within(() => {
          cy.get('option').should('contain', 'Avg');
          cy.get('option').should('contain', 'Max');
          cy.get('option').should('contain', 'Min');
        });

      // Count metric available and disables aggregation
      cy.get('@perfPanel').find('select').eq(1).select('count');
      cy.get('@perfPanel').find('select').last().should('be.disabled');

      // Switch back to Line Chart
      cy.get('@perfPanel').find('.euiButtonGroup').contains('Line Chart').click();
      cy.get('@perfPanel').find('select').should('have.length', 1);
    });
  });
});
