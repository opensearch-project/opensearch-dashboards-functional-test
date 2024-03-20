/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DETECTOR_TRIGGER_TIMEOUT,
  OPENSEARCH_DASHBOARDS_URL,
} from '../../../utils/plugins/security-analytics-dashboards-plugin/constants';
import sample_document from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_document.json';
import sample_index_settings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_index_settings.json';
import sample_field_mappings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_field_mappings.json';
import sample_detector from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_detector.json';

describe('Findings', () => {
  const ruleTags = ['low', 'windows'];
  const indexName = 'cypress-test-windows';

  before(() => {
    cy.cleanUpTests();

    // Visit Findings page
    cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/findings`);

    // create test index, mappings, and detector
    cy.createIndex(indexName, null, sample_index_settings);
    cy.createAliasMappings(indexName, 'windows', sample_field_mappings, true);
    cy.createDetector(sample_detector);

    // Ingest a new document
    cy.insertDocumentToIndex(indexName, '', sample_document);

    // wait for detector interval to pass
    cy.wait(DETECTOR_TRIGGER_TIMEOUT);
  });

  beforeEach(() => {
    // Visit Alerts table page
    cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/findings`);

    // Wait for page to load
    cy.url({ timeout: 60000 }).then(() => {
      cy.contains('Findings').should('be.visible');
    });
  });

  it('displays findings based on recently ingested data', () => {
    // Click refresh
    cy.get('button').contains('Refresh').click({ force: true });

    // Check for non-empty findings list
    cy.contains('No items found').should('not.exist');

    // Check for expected findings
    cy.contains('sample_detector');
    cy.contains('Windows');
    cy.contains('Low');
  });

  it('displays finding details flyout when user clicks on View details icon', () => {
    // filter table to show only sample_detector findings
    cy.triggerSearchField('Search findings', 'sample_detector');

    // Click View details icon
    cy.getTableFirstRow('[data-test-subj="view-details-icon"]').then(($el) => {
      cy.get($el).click({ force: true });
    });

    // Confirm flyout contents
    cy.contains('Finding details');
    cy.contains('Rule details');

    // Close Flyout
    cy.get('.euiFlexItem--flexGrowZero > .euiButtonIcon').click({
      force: true,
    });
  });

  it('displays finding details flyout when user clicks on Finding ID', () => {
    // filter table to show only sample_detector findings
    cy.triggerSearchField('Search findings', 'sample_detector');

    // Click findingId to trigger Finding details flyout
    cy.getTableFirstRow(
      '[data-test-subj="finding-details-flyout-button"]'
    ).then(($el) => {
      cy.get($el).click({ force: true });
    });

    // Confirm flyout contents
    cy.contains('Finding details');
    cy.contains('Rule details');

    // Close Flyout
    cy.get('.euiFlexItem--flexGrowZero > .euiButtonIcon').click({
      force: true,
    });
  });

  it('allows user to view details about rules that were triggered', () => {
    // filter table to show only sample_detector findings
    cy.triggerSearchField('Search findings', 'sample_detector');

    // open Finding details flyout via finding id link. cy.wait essential, timeout insufficient.
    cy.get(`[data-test-subj="view-details-icon"]`).eq(0).click({ force: true });

    // open rule details inside flyout
    cy.get('button', { timeout: 1000 });
    cy.get(`[data-test-subj="finding-details-flyout-rule-accordion-0"]`).click({
      force: true,
    });

    // Confirm content
    cy.contains('Documents');
    cy.contains('Detects plugged USB devices');
    cy.contains('Low');
    cy.contains('Windows');
    cy.contains(indexName);

    ruleTags.forEach((tag) => {
      cy.contains(tag);
    });
  });

  // TODO - upon reaching rules page, trigger appropriate rules detail flyout
  // see github issue #124 at https://github.com/opensearch-project/security-analytics-dashboards-plugin/issues/124

  it('opens rule details flyout when rule name inside accordion drop down is clicked', () => {
    // filter table to show only sample_detector findings
    cy.triggerSearchField('Search findings', 'sample_detector');

    // open Finding details flyout via finding id link. cy.wait essential, timeout insufficient.
    cy.getTableFirstRow('[data-test-subj="view-details-icon"]').then(($el) => {
      cy.get($el).click({ force: true });
    });

    // Click rule link
    cy.get(
      `[data-test-subj="finding-details-flyout-USB Device Plugged-details"]`
    ).click({ force: true });

    // Validate flyout appearance
    cy.get('[data-test-subj="rule_flyout_USB Device Plugged"]').within(() => {
      cy.get('[data-test-subj="rule_flyout_rule_name"]').contains(
        'USB Device Plugged'
      );
    });
  });

  it('...can delete detector', () => {
    // Visit Detectors page
    cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/detectors`);
    cy.wait(15000);
    cy.contains('Threat detectors');

    // filter table to show only sample_detector findings
    cy.triggerSearchField('Search threat detectors', 'sample_detector');

    // Click on detector to be removed
    cy.contains('sample_detector').click({ force: true });

    // Wait for detector details to load before continuing
    cy.contains('Detector details').then(() => {
      // Click "Actions" button, the click "Delete"
      cy.get('button.euiButton')
        .contains('Actions')
        .click({ force: true })
        .then(() => {
          // Confirm arrival at detectors page
          cy.get('[data-test-subj="editButton"]')
            .contains('Delete')
            .click({ force: true });

          // Confirm sample_detector no longer exists
          cy.contains('sample_detector').should('not.exist');
        });
    });
  });

  after(() => cy.cleanUpTests());
});
