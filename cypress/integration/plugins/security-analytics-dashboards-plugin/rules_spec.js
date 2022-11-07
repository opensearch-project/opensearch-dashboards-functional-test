/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME, TWENTY_SECONDS_TIMEOUT } from '../../../utils/plugins/security-analytics-dashboards-plugin/constants'
import {BASE_PATH} from "../../../utils/base_constants";

const SAMPLE_RULE = {
  name: 'Cypress test rule',
  logType: 'windows',
  description: 'This is a rule used to test the rule creation workflow. Not for production use.',
  detection:
    'selection:\n  Provider_Name: Service Control Manager\nEventID: 7045\nServiceName: ZzNetSvc\n{backspace}{backspace}condition: selection',
  detectionLine: [
    'selection:',
    'Provider_Name: Service Control Manager',
    'EventID: 7045',
    'ServiceName: ZzNetSvc',
    'condition: selection',
  ],
  severity: 'critical',
  tags: ['attack.persistence', 'attack.privilege_escalation', 'attack.t1543.003'],
  references: 'https://nohello.com',
  falsePositive: 'unknown',
  author: 'Cypress Test Runner',
  status: 'experimental',
};

describe('Rules', () => {
  before(() => {
    // Deleting pre-existing test rules
    cy.deleteRule(SAMPLE_RULE.name);
  });
  beforeEach(() => {
    // Visit Rules page
    cy.visit(`${BASE_PATH}/app/${PLUGIN_NAME}#/rules`);
  });

  describe('Can be created', () => {
    it('manually using UI', () => {
      // Click "create new rule" button
      cy.get('[data-test-subj="create_rule_button"]', TWENTY_SECONDS_TIMEOUT).click({
        force: true,
      });

      // Enter the name
      cy.get('[data-test-subj="rule_name_field"]', TWENTY_SECONDS_TIMEOUT).type(SAMPLE_RULE.name);

      // Enter the log type
      cy.get('[data-test-subj="rule_type_dropdown"]', TWENTY_SECONDS_TIMEOUT).select(
        SAMPLE_RULE.logType
      );

      // Enter the description
      cy.get('[data-test-subj="rule_description_field"]', TWENTY_SECONDS_TIMEOUT).type(
        SAMPLE_RULE.description
      );

      // Enter the detection
      cy.get('[data-test-subj="rule_detection_field"]', TWENTY_SECONDS_TIMEOUT).type(
        SAMPLE_RULE.detection
      );

      // Enter the severity
      cy.get('[data-test-subj="rule_severity_dropdown"]', TWENTY_SECONDS_TIMEOUT).select(
        SAMPLE_RULE.severity
      );

      // Enter the tags
      SAMPLE_RULE.tags.forEach((tag) =>
        cy
          .get('[data-test-subj="rule_tags_dropdown"]', TWENTY_SECONDS_TIMEOUT)
          .type(`${tag}{enter}{esc}`)
      );

      // Enter the reference
      cy.get('[data-test-subj="rule_references_field_0"]', TWENTY_SECONDS_TIMEOUT).type(
        SAMPLE_RULE.references
      );

      // Enter the false positive cases
      cy.get('[data-test-subj="rule_false_positive_cases_field_0"]', TWENTY_SECONDS_TIMEOUT).type(
        SAMPLE_RULE.falsePositive
      );

      // Enter the author
      cy.get('[data-test-subj="rule_author_field"]', TWENTY_SECONDS_TIMEOUT).type(
        SAMPLE_RULE.author
      );

      // Enter the log type
      cy.get('[data-test-subj="rule_status_dropdown"]', TWENTY_SECONDS_TIMEOUT).select(
        SAMPLE_RULE.status
      );

      // Click "create" button
      cy.get('[data-test-subj="create_rule_button"]', TWENTY_SECONDS_TIMEOUT).click({
        force: true,
      });

      // Wait for the page to finish loading
      cy.wait(5000);
      cy.contains('No items found', TWENTY_SECONDS_TIMEOUT).should('not.exist');

      // Search for the rule
      cy.get(`input[type="search"]`, TWENTY_SECONDS_TIMEOUT)
        // .focus()
        .type(`${SAMPLE_RULE.name}{enter}`);

      // Click the rule link to open the details flyout
      cy.get(`[data-test-subj="rule_link_${SAMPLE_RULE.name}"]`, TWENTY_SECONDS_TIMEOUT).click();

      // Confirm the flyout contains the expected values
      cy.get(`[data-test-subj="rule_flyout_${SAMPLE_RULE.name}"]`, TWENTY_SECONDS_TIMEOUT)
        .click({ force: true })
        .within(() => {
          // Validate name
          cy.get('[data-test-subj="rule_flyout_rule_name"]', TWENTY_SECONDS_TIMEOUT).contains(
            SAMPLE_RULE.name,
            TWENTY_SECONDS_TIMEOUT
          );

          // Validate log type
          cy.get('[data-test-subj="rule_flyout_rule_log_type"]', TWENTY_SECONDS_TIMEOUT).contains(
            SAMPLE_RULE.logType,
            TWENTY_SECONDS_TIMEOUT
          );

          // Validate description
          cy.get(
            '[data-test-subj="rule_flyout_rule_description"]',
            TWENTY_SECONDS_TIMEOUT
          ).contains(SAMPLE_RULE.description, TWENTY_SECONDS_TIMEOUT);

          // Validate author
          cy.get('[data-test-subj="rule_flyout_rule_author"]', TWENTY_SECONDS_TIMEOUT).contains(
            SAMPLE_RULE.author,
            TWENTY_SECONDS_TIMEOUT
          );

          // Validate source is "custom"
          cy.get('[data-test-subj="rule_flyout_rule_source"]', TWENTY_SECONDS_TIMEOUT).contains(
            'Custom',
            TWENTY_SECONDS_TIMEOUT
          );

          // Validate severity
          cy.get('[data-test-subj="rule_flyout_rule_severity"]', TWENTY_SECONDS_TIMEOUT).contains(
            SAMPLE_RULE.severity,
            TWENTY_SECONDS_TIMEOUT
          );

          // Validate tags
          SAMPLE_RULE.tags.forEach((tag) =>
            cy
              .get('[data-test-subj="rule_flyout_rule_tags"]', TWENTY_SECONDS_TIMEOUT)
              .contains(tag, TWENTY_SECONDS_TIMEOUT)
          );

          // Validate references
          cy.get('[data-test-subj="rule_flyout_rule_references"]', TWENTY_SECONDS_TIMEOUT).contains(
            SAMPLE_RULE.references,
            TWENTY_SECONDS_TIMEOUT
          );

          // Validate false positives
          cy.get(
            '[data-test-subj="rule_flyout_rule_false_positives"]',
            TWENTY_SECONDS_TIMEOUT
          ).contains(SAMPLE_RULE.falsePositive, TWENTY_SECONDS_TIMEOUT);

          // Validate status
          cy.get('[data-test-subj="rule_flyout_rule_status"]', TWENTY_SECONDS_TIMEOUT).contains(
            SAMPLE_RULE.status,
            TWENTY_SECONDS_TIMEOUT
          );

          // Validate detection
          SAMPLE_RULE.detectionLine.forEach((line) =>
            cy
              .get('[data-test-subj="rule_flyout_rule_detection"]', TWENTY_SECONDS_TIMEOUT)
              .contains(line, TWENTY_SECONDS_TIMEOUT)
          );

          // Close the flyout
          cy.get('[data-test-subj="euiFlyoutCloseButton"]', TWENTY_SECONDS_TIMEOUT).click({
            force: true,
          });
        });

      // Confirm flyout closed
      cy.contains(`[data-test-subj="rule_flyout_${SAMPLE_RULE.name}"]`).should('not.exist');
    });
  });

  after(() => {
    // Deleting test rules
    cy.deleteRule(SAMPLE_RULE.name);
  });
});
