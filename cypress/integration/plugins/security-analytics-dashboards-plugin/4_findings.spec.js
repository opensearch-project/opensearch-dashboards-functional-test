/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createDetector,
  DETECTOR_TRIGGER_TIMEOUT,
  OPENSEARCH_DASHBOARDS_URL,
} from '../../../utils/plugins/security-analytics-dashboards-plugin/constants';
import indexSettings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_windows_index_settings.json';
import aliasMappings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_alias_mappings.json';
import indexDoc from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_document.json';
import ruleSettings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/rule/create_windows_usb_rule.json';

const indexName = 'test-index';
const detectorName = 'test-detector';
const ruleName = 'Cypress USB Rule';

describe('Findings', () => {
  const ruleTags = ['high', 'windows'];

  before(() => {
    createDetector(
      detectorName,
      indexName,
      indexSettings,
      aliasMappings,
      ruleSettings,
      indexDoc,
      4
    );

    // Wait for the detector to execute
    cy.wait(DETECTOR_TRIGGER_TIMEOUT);
  });

  beforeEach(() => {
    // Visit Alerts table page
    cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/findings`);

    // Wait for page to load
    cy.sa_waitForPageLoad('findings', {
      contains: 'Findings',
    });

    cy.wait(5000);
  });

  it('displays findings based on recently ingested data', () => {
    // Click refresh
    cy.get('button').contains('Refresh').click({ force: true });

    // Check for non-empty findings list
    cy.contains('No items found').should('not.exist');

    // Check for expected findings
    cy.contains('System Activity: Windows');
    cy.contains('High');
  });

  it('displays finding details flyout when user clicks on View details icon', () => {
    // filter table to show only sample_detector findings
    cy.get(`input[placeholder="Search findings"]`).sa_ospSearch(indexName);

    // Click View details icon
    cy.sa_getTableFirstRow('[data-test-subj="view-details-icon"]').then(
      ($el) => {
        cy.get($el).click({ force: true });
      }
    );

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
    cy.get(`input[placeholder="Search findings"]`).sa_ospSearch(indexName);

    // Click findingId to trigger Finding details flyout
    cy.sa_getTableFirstRow(
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
    cy.get(`input[placeholder="Search findings"]`).sa_ospSearch(indexName);

    // open Finding details flyout via finding id link. cy.wait essential, timeout insufficient.
    cy.get(`[data-test-subj="view-details-icon"]`).eq(0).click({ force: true });

    // open rule details inside flyout
    cy.get('button', { timeout: 1000 });
    cy.get(`[data-test-subj="finding-details-flyout-rule-accordion-0"]`).click({
      force: true,
    });

    // Confirm content
    cy.contains('Documents');
    cy.contains('USB plugged-in rule');
    cy.contains('High');
    cy.contains('Windows');

    ruleTags.forEach((tag) => {
      cy.contains(tag);
    });
  });

  // TODO - upon reaching rules page, trigger appropriate rules detail flyout
  // see github issue #124 at https://github.com/opensearch-project/security-analytics-dashboards-plugin/issues/124

  it('opens rule details flyout when rule name inside accordion drop down is clicked', () => {
    // filter table to show only sample_detector findings
    cy.get(`input[placeholder="Search findings"]`).sa_ospSearch(indexName);

    // open Finding details flyout via finding id link. cy.wait essential, timeout insufficient.
    cy.sa_getTableFirstRow('[data-test-subj="view-details-icon"]').then(
      ($el) => {
        cy.get($el).click({ force: true });
      }
    );

    // Click rule link
    cy.get(
      `[data-test-subj="finding-details-flyout-${ruleName}-details"]`
    ).click({
      force: true,
    });

    // Validate flyout appearance
    cy.get(`[data-test-subj="rule_flyout_${ruleName}"]`).within(() => {
      cy.get('[data-test-subj="rule_flyout_rule_name"]').contains(ruleName);
    });
  });

  after(() => cy.sa_cleanUpTests());
});
