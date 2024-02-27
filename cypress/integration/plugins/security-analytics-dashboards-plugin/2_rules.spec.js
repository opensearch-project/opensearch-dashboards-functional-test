/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  NODE_API,
  OPENSEARCH_DASHBOARDS_URL,
} from '../../../utils/plugins/security-analytics-dashboards-plugin/constants';
import {
  getLogTypeLabel,
  setupIntercept,
} from '../../../utils/plugins/security-analytics-dashboards-plugin/helpers';

const uniqueId = Cypress._.random(0, 1e6);
const SAMPLE_RULE = {
  name: `Cypress test rule ${uniqueId}`,
  logType: 'windows',
  description: 'This is a rule used to test the rule creation workflow.',
  detectionLine: [
    'condition: Selection_1',
    'Selection_1:',
    'FieldKey|contains:',
    '- FieldValue',
  ],
  severity: 'Critical',
  tags: [
    'attack.persistence',
    'attack.privilege_escalation',
    'attack.t1543.003',
  ],
  references: 'https://nohello.com',
  falsePositive: 'unknown',
  author: 'Cypress Test Runner',
  status: 'experimental',
};

const YAML_RULE_LINES = [
  `id:`,
  `logsource:`,
  `product: ${SAMPLE_RULE.logType}`,
  `title: ${SAMPLE_RULE.name}`,
  `description: ${SAMPLE_RULE.description}`,
  `tags:`,
  `- ${SAMPLE_RULE.tags[0]}`,
  `- ${SAMPLE_RULE.tags[1]}`,
  `- ${SAMPLE_RULE.tags[2]}`,
  `falsepositives:`,
  `- ${SAMPLE_RULE.falsePositive}`,
  `level: ${SAMPLE_RULE.severity.toLowerCase()}`,
  `status: ${SAMPLE_RULE.status}`,
  `references:`,
  `- '${SAMPLE_RULE.references}'`,
  `author: ${SAMPLE_RULE.author}`,
  `detection:`,
  ...SAMPLE_RULE.detectionLine,
];

const checkRulesFlyout = () => {
  // Search for the rule
  cy.get(`input[placeholder="Search rules"]`).sa_ospSearch(SAMPLE_RULE.name);

  // Click the rule link to open the details flyout
  cy.get(`[data-test-subj="rule_link_${SAMPLE_RULE.name}"]`).click({
    force: true,
  });

  // Confirm the flyout contains the expected values
  cy.get(`[data-test-subj="rule_flyout_${SAMPLE_RULE.name}"]`)
    .click({ force: true })
    .within(() => {
      // Validate name
      cy.get('[data-test-subj="rule_flyout_rule_name"]').contains(
        SAMPLE_RULE.name
      );

      // Validate log type
      cy.get('[data-test-subj="rule_flyout_rule_log_type"]').contains(
        getLogTypeLabel(SAMPLE_RULE.logType)
      );

      // Validate description
      cy.get('[data-test-subj="rule_flyout_rule_description"]').contains(
        SAMPLE_RULE.description
      );

      // Validate author
      cy.get('[data-test-subj="rule_flyout_rule_author"]').contains(
        SAMPLE_RULE.author
      );

      // Validate source is "custom"
      cy.get('[data-test-subj="rule_flyout_rule_source"]').contains('Custom');

      // Validate severity
      cy.get('[data-test-subj="rule_flyout_rule_severity"]').contains(
        SAMPLE_RULE.severity.toLowerCase()
      );

      // Validate tags
      SAMPLE_RULE.tags.forEach((tag) =>
        cy.get('[data-test-subj="rule_flyout_rule_tags"]').contains(tag)
      );

      // Validate references
      cy.get('[data-test-subj="rule_flyout_rule_references"]').contains(
        SAMPLE_RULE.references
      );

      // Validate false positives
      cy.get('[data-test-subj="rule_flyout_rule_false_positives"]').contains(
        SAMPLE_RULE.falsePositive
      );

      // Validate status
      cy.get('[data-test-subj="rule_flyout_rule_status"]').contains(
        SAMPLE_RULE.status
      );

      // Validate detection
      SAMPLE_RULE.detectionLine.forEach((line) =>
        cy.get('[data-test-subj="rule_flyout_rule_detection"]').contains(line)
      );

      cy.get('[data-test-subj="change-editor-type"] label:nth-child(2)').click({
        force: true,
      });

      cy.get('[data-test-subj="rule_flyout_yaml_rule"]')
        .get('[class="euiCodeBlock__line"]')
        .each((lineElement, lineIndex) => {
          if (lineIndex >= YAML_RULE_LINES.length) {
            return;
          }
          let line = lineElement.text().replaceAll('\n', '').trim();
          let expectedLine = YAML_RULE_LINES[lineIndex];

          // The document ID field is generated when the document is added to the index,
          // so this test just checks that the line starts with the ID key.
          if (expectedLine.startsWith('id:')) {
            expectedLine = 'id:';
            expect(line, `Sigma rule line ${lineIndex}`).to.contain(
              expectedLine
            );
          } else {
            expect(line, `Sigma rule line ${lineIndex}`).to.equal(expectedLine);
          }
        });

      // Close the flyout
      cy.get('[data-test-subj="close-rule-details-flyout"]').click({
        force: true,
      });
    });
};

const getCreateButton = () => cy.get('[data-test-subj="create_rule_button"]');
const getNameField = () => cy.sa_getFieldByLabel('Rule name');
const getRuleStatusField = () => cy.sa_getFieldByLabel('Rule Status');
const getDescriptionField = () =>
  cy.sa_getFieldByLabel('Description - optional');
const getAuthorField = () => cy.sa_getFieldByLabel('Author');
const getLogTypeField = () => cy.sa_getFieldByLabel('Log type');
const getRuleLevelField = () => cy.sa_getFieldByLabel('Rule level (severity)');
const getSelectionPanelByIndex = (index) =>
  cy.get(`[data-test-subj="detection-visual-editor-${index}"]`);
const getSelectionNameField = () => cy.get('[data-test-subj="selection_name"]');
const getMapKeyField = () =>
  cy.get('[data-test-subj="selection_field_key_name"]');
const getMapValueField = () =>
  cy.get('[data-test-subj="selection_field_value"]');
const getMapListField = () => cy.get('[data-test-subj="selection_field_list"]');
const getListRadioField = () => cy.get('[for="selection-map-list-0-0"]');
const getTextRadioField = () => cy.get('[for="selection-map-value-0-0"]');
const getConditionField = () =>
  cy.get('[data-test-subj="rule_detection_field"]');
const getRuleSubmitButton = () =>
  cy.get('[data-test-subj="submit_rule_form_button"]');
const getTagField = (index) =>
  cy.get(`[data-test-subj="rule_tags_field_${index}"]`);
const getReferenceFieldByIndex = (index) =>
  cy.get(`[data-test-subj="rule_references_field_${index}"]`);
const getFalsePositiveFieldByIndex = (index) =>
  cy.get(`[data-test-subj="rule_false_positives_field_${index}"]`);

const toastShouldExist = () => {
  submitRule();
  cy.get('.euiToast').contains('Failed to create rule:');
};

const submitRule = () => getRuleSubmitButton().click({ force: true });
const fillCreateForm = () => {
  // rule overview
  getNameField().type(SAMPLE_RULE.name);
  getDescriptionField().type(SAMPLE_RULE.description);
  getAuthorField().type(`${SAMPLE_RULE.author}`);

  // rule details
  getLogTypeField().sa_selectComboboxItem(getLogTypeLabel(SAMPLE_RULE.logType));
  getRuleLevelField().sa_selectComboboxItem(SAMPLE_RULE.severity);

  // rule detection
  getSelectionPanelByIndex(0).within(() => {
    getSelectionNameField().should('have.value', 'Selection_1');
    getMapKeyField().type('FieldKey');

    getTextRadioField().click({ force: true });
    getMapValueField().type('FieldValue');
  });

  // rule additional details
  SAMPLE_RULE.tags.forEach((tag, idx) => {
    getTagField(idx).type(tag);
    idx < SAMPLE_RULE.tags.length - 1 &&
      cy.sa_getButtonByText('Add tag').click({ force: true });
  });

  getReferenceFieldByIndex(0).type(SAMPLE_RULE.references);
  getFalsePositiveFieldByIndex(0).type(SAMPLE_RULE.falsePositive);
};

describe('Rules', () => {
  before(() => cy.sa_cleanUpTests());

  describe('...should validate form fields', () => {
    beforeEach(() => {
      setupIntercept(cy, `${NODE_API.RULES_BASE}/_search`, 'rulesSearch');
      // Visit Rules page
      cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/rules`);
      cy.wait('@rulesSearch').should('have.property', 'state', 'Complete');

      // Check that correct page is showing
      cy.sa_waitForPageLoad('rules', {
        contains: 'Detection rules',
      });

      getCreateButton().click({ force: true });
    });

    it('...should validate rule name', () => {
      getNameField().sa_containsHelperText(
        'Rule name must contain 5-50 characters. Valid characters are a-z, A-Z, 0-9, hyphens, spaces, and underscores'
      );

      getNameField().should('be.empty');
      getNameField().focus().blur();
      getNameField().sa_containsError('Rule name is required');
      getNameField().type('text').focus().blur();
      getNameField().sa_containsError('Invalid rule name.');

      getNameField()
        .type('{selectall}')
        .type('{backspace}')
        .type('tex&')
        .focus()
        .blur();
      getNameField().sa_containsError('Invalid rule name.');

      getNameField()
        .type('{selectall}')
        .type('{backspace}')
        .type('Rule name')
        .focus()
        .blur()
        .sa_shouldNotHaveError();
    });

    it('...should validate rule description field', () => {
      const longDescriptionText =
        'This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text. This is a long text.';

      getDescriptionField().should('be.empty');
      getDescriptionField().type(longDescriptionText).focus().blur();

      getDescriptionField()
        .parents('.euiFormRow__fieldWrapper')
        .find('.euiFormErrorText')
        .contains(
          'Description should only consist of upper and lowercase letters, numbers 0-9, commas, hyphens, periods, spaces, and underscores. Max limit of 500 characters.'
        );

      getDescriptionField()
        .type('{selectall}')
        .type('{backspace}')
        .type('Detector description...')
        .focus()
        .blur();

      getDescriptionField()
        .type('{selectall}')
        .type('{backspace}')
        .type('Detector name')
        .focus()
        .blur()
        .parents('.euiFormRow__fieldWrapper')
        .find('.euiFormErrorText')
        .should('not.exist');
    });

    it('...should validate author', () => {
      getAuthorField().sa_containsHelperText(
        'Combine multiple authors separated with a comma'
      );

      getAuthorField().should('be.empty');
      getAuthorField().focus().blur();
      getAuthorField().sa_containsError('Author name is required');
      getAuthorField().type('text').focus().blur();
      getAuthorField().sa_containsError('Invalid author.');

      getAuthorField()
        .type('{selectall}')
        .type('{backspace}')
        .type('tex&')
        .focus()
        .blur();
      getAuthorField().sa_containsError('Invalid author.');

      getAuthorField()
        .type('{selectall}')
        .type('{backspace}')
        .type('Rule name')
        .focus()
        .blur()
        .sa_shouldNotHaveError();
    });

    it('...should validate log type field', () => {
      getLogTypeField().should('be.empty');
      getLogTypeField().focus().blur();
      getLogTypeField().sa_containsError('Log type is required');

      getLogTypeField().sa_selectComboboxItem(
        getLogTypeLabel(SAMPLE_RULE.logType)
      );
      getLogTypeField().focus().blur().sa_shouldNotHaveError();
    });

    it('...should validate rule level field', () => {
      getRuleLevelField().should('be.empty');
      getRuleLevelField().focus().blur();
      getRuleLevelField().sa_containsError('Rule level is required');

      getRuleLevelField().sa_selectComboboxItem(SAMPLE_RULE.severity);
      getRuleLevelField().focus().blur().sa_shouldNotHaveError();
    });

    it('...should validate rule status field', () => {
      getRuleStatusField().sa_containsValue(SAMPLE_RULE.status);
      getRuleStatusField().focus().blur().sa_shouldNotHaveError();

      getRuleStatusField().sa_clearCombobox();
      getRuleStatusField().focus().blur();
      getRuleStatusField().sa_containsError('Rule status is required');
    });

    it('...should validate selection', () => {
      getSelectionPanelByIndex(0).within(() => {
        getSelectionNameField().should('have.value', 'Selection_1');
        getSelectionNameField().sa_clearValue();
        getSelectionNameField().focus().blur();
        getSelectionNameField()
          .parentsUntil('.euiFormRow__fieldWrapper')
          .siblings()
          .contains('Selection name is required');

        getSelectionNameField().type('Selection_1');
        getSelectionNameField()
          .focus()
          .blur()
          .parents('.euiFormRow__fieldWrapper')
          .find('.euiFormErrorText')
          .should('not.exist');
      });
    });

    it('...should validate selection map key field', () => {
      getSelectionPanelByIndex(0).within(() => {
        getMapKeyField().should('be.empty');
        getMapKeyField()
          .focus()
          .blur()
          .parents('.euiFormRow__fieldWrapper')
          .find('.euiFormErrorText')
          .should('not.exist');

        getMapKeyField().type('hello@');
        getMapKeyField()
          .parentsUntil('.euiFormRow__fieldWrapper')
          .siblings()
          .contains('Invalid key name');

        getMapKeyField().focus().type('{selectall}').type('FieldKey');
        getMapKeyField()
          .focus()
          .blur()
          .parents('.euiFormRow__fieldWrapper')
          .find('.euiFormErrorText')
          .should('not.exist');
      });
    });

    it('...should validate selection map value field', () => {
      getSelectionPanelByIndex(0).within(() => {
        getMapValueField().should('be.empty');
        getMapValueField().focus().blur();
        getMapValueField()
          .parentsUntil('.euiFormRow__fieldWrapper')
          .siblings()
          .contains('Value is required');

        getMapValueField().type('FieldValue');
        getMapValueField()
          .focus()
          .blur()
          .parents('.euiFormRow__fieldWrapper')
          .find('.euiFormErrorText')
          .should('not.exist');
      });
    });

    it('...should validate selection map list field', () => {
      getSelectionPanelByIndex(0).within(() => {
        getListRadioField().click({ force: true });
        getMapListField().should('be.empty');
        getMapListField().focus().blur();
        getMapListField()
          .parentsUntil('.euiFormRow')
          .contains('Value is required');

        getMapListField().type('FieldValue');
        getMapListField()
          .focus()
          .blur()
          .parents('.euiFormRow')
          .find('.euiFormErrorText')
          .should('not.exist');
      });
    });

    it('...should validate condition field', () => {
      getConditionField().scrollIntoView();
      getConditionField().find('.euiFormErrorText').should('not.exist');
      getRuleSubmitButton().click({ force: true });
      getConditionField()
        .parents('.euiFormRow__fieldWrapper')
        .contains('Condition is required')
        .should('not.exist');
    });

    it('...should validate tag field', () => {
      getTagField(0).should('be.empty');
      getTagField(0).type('wrong.tag').focus().blur();
      getTagField(0)
        .parents('.euiFormRow__fieldWrapper')
        .contains("Tags must start with 'attack.'");

      getTagField(0).sa_clearValue().type('attack.tag');
      getTagField(0)
        .parents('.euiFormRow__fieldWrapper')
        .find('.euiFormErrorText')
        .should('not.exist');
    });

    it('...should validate form', () => {
      toastShouldExist();
      fillCreateForm();

      // rule name field
      getNameField().sa_clearValue();
      toastShouldExist();
      getNameField().type('Rule name');

      // author field
      getAuthorField().sa_clearValue();
      toastShouldExist();
      getAuthorField().type('John Doe');

      // log field
      getLogTypeField().sa_clearCombobox();
      toastShouldExist();
      getLogTypeField().sa_selectComboboxItem(
        getLogTypeLabel(SAMPLE_RULE.logType)
      );

      // severity field
      getRuleLevelField().sa_clearCombobox();
      toastShouldExist();
      getRuleLevelField().sa_selectComboboxItem(SAMPLE_RULE.severity);

      // status field
      getRuleStatusField().sa_clearCombobox();
      toastShouldExist();
      getRuleStatusField().sa_selectComboboxItem(SAMPLE_RULE.status);

      // selection name field
      getSelectionPanelByIndex(0).within(() =>
        getSelectionNameField().type('{selectall}').type('{backspace}')
      );
      toastShouldExist();
      getSelectionPanelByIndex(0).within(() =>
        getSelectionNameField().type('Selection_1')
      );

      // selection map key field
      getSelectionPanelByIndex(0).within(() =>
        getMapKeyField().type('{selectall}').type('{backspace}')
      );
      getSelectionPanelByIndex(0).within(() =>
        getMapKeyField().type('FieldKey')
      );

      // selection map value field
      getSelectionPanelByIndex(0).within(() =>
        getMapValueField().type('{selectall}').type('{backspace}')
      );
      toastShouldExist();
      getSelectionPanelByIndex(0).within(() =>
        getMapValueField().type('FieldValue', { force: true })
      );

      // selection map list field
      getSelectionPanelByIndex(0).within(() => {
        getListRadioField().click({ force: true });
        getMapListField().sa_clearValue();
      });
      toastShouldExist();
      getSelectionPanelByIndex(0).within(() => {
        getListRadioField().click({ force: true });
        getMapListField().type('FieldValue', { force: true });
      });

      // tags field
      getTagField(0).sa_clearValue().type('wrong.tag');
      toastShouldExist();
      getTagField(0).sa_clearValue().type('attack.tag');
    });
  });

  describe('...should validate create rule flow', () => {
    beforeEach(() => {
      setupIntercept(cy, `${NODE_API.RULES_BASE}/_search`, 'rulesSearch');
      // Visit Rules page
      cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/rules`);
      cy.wait('@rulesSearch').should('have.property', 'state', 'Complete');

      // Check that correct page is showing
      cy.sa_waitForPageLoad('rules', {
        contains: 'Detection rules',
      });
    });

    it('...can be created', () => {
      getCreateButton().click({ force: true });

      fillCreateForm();

      // Switch to YAML editor
      cy.get('[data-test-subj="change-editor-type"] label:nth-child(2)').click({
        force: true,
      });

      YAML_RULE_LINES.forEach((line) =>
        cy.get('[data-test-subj="rule_yaml_editor"]').contains(line)
      );

      setupIntercept(cy, `${NODE_API.RULES_BASE}/_search`, 'getRules');

      submitRule();

      cy.wait('@getRules');

      cy.sa_waitForPageLoad('rules', {
        contains: 'Detection rules',
      });

      checkRulesFlyout();
    });

    it('...can be edited', () => {
      cy.sa_waitForPageLoad('rules', {
        contains: 'Detection rules',
      });

      cy.get(`input[placeholder="Search rules"]`).sa_ospSearch(
        SAMPLE_RULE.name
      );
      cy.get(`[data-test-subj="rule_link_${SAMPLE_RULE.name}"]`).click({
        force: true,
      });

      cy.get(`[data-test-subj="rule_flyout_${SAMPLE_RULE.name}"]`)
        .find('button')
        .contains('Action')
        .click({ force: true })
        .then(() => {
          // Confirm arrival at detectors page
          cy.get('.euiPopover__panel').find('button').contains('Edit').click();
        });

      getNameField().clear();

      SAMPLE_RULE.name += ' edited';
      getNameField().type(SAMPLE_RULE.name);
      getNameField().should('have.value', SAMPLE_RULE.name);

      getLogTypeField().sa_clearCombobox();
      SAMPLE_RULE.logType = 'dns';
      YAML_RULE_LINES[2] = `product: ${SAMPLE_RULE.logType}`;
      YAML_RULE_LINES[3] = `title: ${SAMPLE_RULE.name}`;
      getLogTypeField().sa_selectComboboxItem(
        getLogTypeLabel(SAMPLE_RULE.logType)
      );
      getLogTypeField()
        .sa_containsValue(SAMPLE_RULE.logType)
        .contains(getLogTypeLabel(SAMPLE_RULE.logType));

      SAMPLE_RULE.description += ' edited';
      YAML_RULE_LINES[4] = `description: ${SAMPLE_RULE.description}`;
      getDescriptionField().clear();
      getDescriptionField().type(SAMPLE_RULE.description);
      getDescriptionField().should('have.value', SAMPLE_RULE.description);

      setupIntercept(cy, `${NODE_API.RULES_BASE}/_search`, 'getRules');

      submitRule();

      cy.sa_waitForPageLoad('rules', {
        contains: 'Detection rules',
      });

      cy.wait('@getRules');

      checkRulesFlyout();
    });

    it('...can be deleted', () => {
      setupIntercept(cy, `${NODE_API.RULES_BASE}/_search`, 'getRules', 'POST');

      cy.get(`input[placeholder="Search rules"]`).sa_ospSearch(
        SAMPLE_RULE.name
      );

      // Click the rule link to open the details flyout
      cy.get(`[data-test-subj="rule_link_${SAMPLE_RULE.name}"]`).click({
        force: true,
      });

      cy.get(`[data-test-subj="rule_flyout_${SAMPLE_RULE.name}"]`)
        .find('button')
        .contains('Action')
        .click({ force: true })
        .then(() => {
          // Confirm arrival at detectors page
          cy.get('.euiPopover__panel')
            .find('button')
            .contains('Delete')
            .click()
            .then(() =>
              cy.get('.euiModalFooter > .euiButton').contains('Delete').click()
            );

          cy.wait(5000);
          cy.wait('@getRules');

          // Search for sample_detector, presumably deleted
          cy.wait(3000);
          cy.get(`input[placeholder="Search rules"]`).sa_ospSearch(
            SAMPLE_RULE.name
          );
          // Click the rule link to open the details flyout
          cy.get('tbody').contains(SAMPLE_RULE.name).should('not.exist');
        });
    });
  });

  after(() => cy.sa_cleanUpTests());
});
