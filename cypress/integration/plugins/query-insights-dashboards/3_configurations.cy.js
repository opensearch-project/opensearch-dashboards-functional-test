/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QUERY_INSIGHTS_METRICS } from '../../../utils/constants';

const clearAll = () => {
  cy.disableTopQueries(QUERY_INSIGHTS_METRICS.LATENCY);
  cy.disableTopQueries(QUERY_INSIGHTS_METRICS.CPU);
  cy.disableTopQueries(QUERY_INSIGHTS_METRICS.MEMORY);
};

const toggleMetricEnabled = async () => {
  cy.get('button[data-test-subj="top-n-metric-toggle"]').trigger('mouseover');
  cy.wait(1000);
  cy.get('button[data-test-subj="top-n-metric-toggle"]').click({ force: true });
  cy.wait(1000);
};

describe('Query Insights Configurations Page', () => {
  beforeEach(() => {
    clearAll();
    cy.navigateToConfiguration();
  });

  /**
   * Validate the presence and structure of the Configuration page
   */
  it('should display the Configuration page with correct structure', () => {
    // Validate the page title
    cy.get('h1')
      .contains('Query insights - Configuration')
      .should('be.visible');
    // Validate the tabs
    cy.get('.euiTabs').should('be.visible');
    cy.get('.euiTab').should('have.length', 2); // Two tabs: 'Top N queries' and 'Configuration'
    cy.contains('button', 'Top N queries').should('be.visible');
    cy.contains('button', 'Configuration').should(
      'have.class',
      'euiTab-isSelected'
    );
    // Validate the panels
    // 6 panels: Settings, Status, Group Settings, Group Status, Delete After Settings, Delete After Status
    cy.get('.euiPanel').should('have.length', 6);
  });

  /**
   * Validate the metric type dropdown has 3 metrics
   */
  it('should display 3 metrics in the metric type drop down', () => {
    // Validate default value
    cy.get('select').first().find('option').should('have.length', 3);
    const expectedMetrics = ['Latency', 'CPU', 'Memory'];
    cy.get('select')
      .first()
      .find('option')
      .each((option, index) => {
        cy.wrap(option).should('have.text', expectedMetrics[index]);
      });
  });

  /**
   * Validate the metric type dropdown
   */
  it('should allow selecting a metric type', () => {
    // Select the Metric Type dropdown
    cy.get('select').first().should('be.visible');
    // Validate default value
    cy.get('select').first().find(':selected').should('have.value', 'latency');
    // Change the selection to 'Memory'
    cy.get('select').first().select('memory').should('have.value', 'memory');
    // Change the selection to 'CPU'
    cy.get('select').first().select('cpu').should('have.value', 'cpu');
  });

  /**
   *  Validate enabling/disabling metrics
   */
  it('should allow enabling and disabling metrics', () => {
    // Validate the switch for enabling/disabling metrics
    cy.get('button[data-test-subj="top-n-metric-toggle"]')
      .should('exist')
      .and('have.attr', 'aria-checked', 'false') // Initially disabled)
      .trigger('mouseover')
      .click();
    cy.wait(1000);

    cy.get('button[data-test-subj="top-n-metric-toggle"]').should(
      'have.attr',
      'aria-checked',
      'true'
    ); // After toggling, it should be enabled
    // Re-enable the switch
    cy.get('button[data-test-subj="top-n-metric-toggle"]')
      .trigger('mouseover')
      .click()
      .should('have.attr', 'aria-checked', 'false');
  });

  /**
   * Validate the value of N (count) input
   */
  it('should allow updating the value of N (count)', () => {
    toggleMetricEnabled();
    // Locate the input for N
    cy.get('input[type="number"]').should('have.attr', 'value', '10'); // Default 10
    // Change the value to 50
    cy.get('input[type="number"]')
      .first()
      .clear()
      .type('50')
      .should('have.value', '50');
    // Validate invalid input
    cy.get('input[type="number"]').first().clear().type('200'); // Enter value above max limit
    cy.get('.euiFormHelpText').should('contain.text', 'Max allowed limit 100');
  });

  /**
   * Validate the window size dropdowns
   */
  it('should allow selecting a window size and unit', () => {
    toggleMetricEnabled();
    // Validate default values
    cy.get('select#timeUnit').should('have.value', 'MINUTES'); // Default unit is "Minute(s)"
    cy.get('select#minutes').should('have.value', '5');
    // Test valid time unit selection
    cy.get('select#timeUnit').select('HOURS').should('have.value', 'HOURS');
    cy.get('select#timeUnit').select('MINUTES').should('have.value', 'MINUTES');

    // Test valid window size selection
    cy.get('select#minutes').select('5');
    cy.get('select#minutes').should('have.value', '5');
    cy.get('select#minutes').select('10');
    cy.get('select#minutes').should('have.value', '10');
    cy.get('select#minutes').select('30');
    cy.get('select#minutes').should('have.value', '30');

    // Validate constraints
    cy.get('select#minutes').select('30'); // Select "30" minutes
    cy.get('select#timeUnit')
      .select('HOURS')
      .then(() => {
        cy.get('.euiFormHelpText').should(
          'contain.text',
          'Max allowed limit 24 hours'
        ); // Ensure constraint message is shown
      });
  });

  /**
   * Validate configuration status panel
   */
  it('should display statuses for configuration metrics', () => {
    // Validate the status panel header
    cy.get('.euiPanel')
      .eq(1) // Selects the second panel (index 1)
      .within(() => {
        cy.get('h2')
          .contains('Statuses for configuration metrics')
          .should('be.visible');
      });
    // Validate metric statuses (Latency, CPU Usage, Memory)
    const metrics = ['Latency', 'CPU Usage', 'Memory'];
    metrics.forEach((metric) => {
      cy.get('.euiText').contains(metric).should('be.visible');
      cy.get('.euiHealth').contains('Disabled').should('be.visible');
    });
  });

  /**
   * Validate configuration settings panel for group by
   */
  it('should display settings for configuration metrics for group by', () => {
    cy.get('.euiPanel')
      .eq(2)
      .within(() => {
        cy.get('h2')
          .contains('Top n queries grouping configuration settings')
          .should('be.visible');
      });
  });

  /**
   * Validate the group by drop-down has 2 options
   */
  it('should display 2 metrics in the group by drop-down', () => {
    cy.get('.euiPanel')
      .eq(2)
      .find('select')
      .should('exist')
      .then(($select) => {
        cy.wrap($select).find('option').should('have.length', 2);

        const expectedMetrics = ['None', 'Similarity'];

        cy.wrap($select)
          .find('option')
          .each((option, index) => {
            cy.wrap(option).should('have.text', expectedMetrics[index]);
          });
      });
  });

  /**
   * Validate configuration status panel for group by
   */
  it('should display configuration statuses for group by metrics', () => {
    cy.get('.euiPanel')
      .eq(3)
      .within(() => {
        cy.get('h2')
          .should('be.visible')
          .and('have.text', 'Statuses for group by');

        const metrics = [{ name: 'Group By', status: 'Disabled' }];

        metrics.forEach(({ name, status }) => {
          cy.get('.euiText').contains(name).should('be.visible');
          cy.get('.euiHealth').contains(status).should('be.visible');
        });
      });
  });

  /**
   * Validate the save button, changes should be saved and redirect to overview
   * After saving the status panel should show the correct status
   */
  it('should allow saving the configuration', () => {
    toggleMetricEnabled();
    cy.get('select#timeUnit').select('MINUTES');
    cy.get('select#minutes').select('5');
    cy.get('button[data-test-subj="save-config-button"]').click();
    cy.url().should('include', '/queryInsights');
    cy.navigateToConfiguration();
    cy.get('.euiHealth').contains('Enabled').should('be.visible');
    cy.get('.euiText').contains('Latency').should('be.visible');
  });

  after(() => clearAll());
});
