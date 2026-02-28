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
import sample_windows_index_settings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_windows_index_settings.json';
import sample_dns_index_settings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_dns_index_settings.json';
import dns_name_rule_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/rule/create_dns_rule_with_name_selection.json';
import dns_type_rule_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/rule/create_dns_rule_with_type_selection.json';
import _ from 'lodash';
import { BACKEND_BASE_PATH } from '../../../utils/base_constants';

const cypressIndexDns = 'cypress-index-dns';
const cypressIndexWindows = 'cypress-index-windows';
const detectorName = 'test detector';
const cypressLogTypeDns = 'dns';
const creationFailedMessage = 'Create detector failed.';

const cypressDNSRule = dns_name_rule_data.title;

const getNameField = () =>
  cy.sa_getInputByPlaceholder('Enter a name for the detector.');

const getNextButton = () => cy.sa_getButtonByText('Next');
const getCreateDetectorButton = () => cy.sa_getButtonByText('Create detector');

const validateAlertPanel = (alertName) =>
  cy
    .sa_getElementByText('.euiTitle', 'Alert triggers')
    .parentsUntil('.euiPanel')
    .siblings()
    .eq(2)
    .within(() => cy.sa_getElementByText('button', alertName));

const dataSourceLabel = 'Select indexes/aliases';

const getDataSourceField = () => cy.sa_getFieldByLabel(dataSourceLabel);

const logTypeLabel = 'Log type';

const getLogTypeField = () =>
  // This log type dropdown is populated asynchronously. Adding short wait to reduce flakiness.
  cy.sa_getFieldByLabel(logTypeLabel).click().wait(5000);

const openDetectorDetails = (detectorName) => {
  cy.sa_getInputByPlaceholder('Search threat detectors')
    .type(`${detectorName}`)
    .sa_pressEnterKey();
  cy.sa_getElementByText('.euiTableCellContent button', detectorName).click();
};

const getMappingFields = (properties, items = [], prefix = '') => {
  for (let field in properties) {
    const fullFieldName = prefix ? `${prefix}.${field}` : field;
    const nextProperties = properties[field].properties;
    if (!nextProperties) {
      items.push({
        ruleFieldName: fullFieldName,
        logFieldName: properties[field].path,
      });
    } else {
      getMappingFields(nextProperties, items, fullFieldName);
    }
  }
  return items;
};

const validateFieldMappingsTable = (message = '') => {
  cy.wait('@getMappingsView').then((interception) => {
    cy.wait(10000).then(() => {
      cy.get('.reviewFieldMappings').should('be.visible');
      const properties = interception.response.body.response.properties;
      const unmapped_field_aliases =
        interception.response.body.response.unmapped_field_aliases
          .map((field) => [field])
          .sort()
          .slice(0, 10);

      Cypress.log({
        message: `Validate table data - ${message}`,
      });
      if (_.isEmpty(properties)) {
        validatePendingFieldMappingsPanel(unmapped_field_aliases);
      } else {
        let items = getMappingFields(properties, [], '');
        items = items.map((item) => [item.ruleFieldName, item.logFieldName]);
        validateAutomaticFieldMappingsPanel(items);
      }
    });
  });
};

const editDetectorDetails = (detectorName, panelTitle) => {
  cy.sa_urlShouldContain('detector-details').then(() => {
    cy.sa_getElementByText('.euiTitle', detectorName);
    cy.sa_getElementByText('.euiPanel .euiTitle', panelTitle);
    cy.sa_getElementByText('.euiPanel .euiTitle', panelTitle)
      .parent()
      .siblings()
      .within(() => cy.get('button').contains('Edit').click());
  });
};

const validateAutomaticFieldMappingsPanel = (mappings) =>
  cy.get('.editFieldMappings').within(() => {
    cy.get('.euiAccordion__triggerWrapper button').then(($btn) => {
      cy.get($btn).contains(`Automatically mapped fields (${mappings.length})`);

      // first check if the accordion is expanded, if not than expand the accordion
      if ($btn[0].getAttribute('aria-expanded') === 'false') {
        cy.get($btn[0])
          .click()
          .then(() => {
            cy.sa_getElementByTestSubject('auto-mapped-fields-table')
              .find('.euiBasicTable')
              .sa_validateTable(mappings);
          });
      }
    });
  });

const validatePendingFieldMappingsPanel = (mappings) => {
  cy.get('.editFieldMappings').within(() => {
    // Pending field mappings
    cy.sa_getElementByText('.euiTitle', 'Pending field mappings')
      .parents('.euiPanel')
      .within(() => {
        cy.sa_getElementByTestSubject('pending-mapped-fields-table')
          .find('.euiBasicTable')
          .sa_validateTable(mappings);
      });
  });
};

const fillDetailsForm = (
  detectorName,
  dataSource,
  isCustomDataSource = false
) => {
  getNameField().type(detectorName);

  if (isCustomDataSource) {
    getDataSourceField()
      .focus()
      .type(dataSource + '{enter}');
  } else {
    getDataSourceField().sa_selectComboboxItem(dataSource);
  }

  getDataSourceField().focus().blur();
  getLogTypeField().sa_selectComboboxItem(getLogTypeLabel(cypressLogTypeDns));
  getLogTypeField().focus().blur();
};

const createDetector = (detectorName, dataSource, expectFailure) => {
  getCreateDetectorButton().click({ force: true });

  fillDetailsForm(detectorName, dataSource, expectFailure);

  cy.sa_getElementByText(
    '.euiAccordion .euiTitle',
    'Selected detection rules (14)'
  )
    .click({ force: true, timeout: 5000 })
    .then(() =>
      cy.contains('.euiTable .euiTableRow', getLogTypeLabel(cypressLogTypeDns))
    );

  cy.sa_getElementByText('.euiAccordion .euiTitle', 'Field mapping - optional');
  cy.get('[aria-controls="mappedTitleFieldsAccordion"]').then(($btn) => {
    // first check if the accordion is expanded, if not than expand the accordion
    if ($btn && $btn[0] && $btn[0].getAttribute('aria-expanded') === 'false') {
      $btn[0].click();
    }
  });

  // go to the alerts page
  getNextButton().click({ force: true });

  // TEST ALERTS PAGE
  // Open the trigger details accordion
  cy.get('[data-test-subj="trigger-details-btn"]').click({ force: true });
  cy.sa_getElementByText('.euiTitle.euiTitle--medium', 'Set up alert triggers');
  cy.sa_getElementByTestSubject('alert-tags-combo-box')
    .type(`attack.defense_evasion{enter}`)
    .find('input')
    .focus()
    .blur();

  setupIntercept(cy, NODE_API.MAPPINGS_BASE, 'createMappingsRequest');
  setupIntercept(cy, NODE_API.DETECTORS_BASE, 'createDetectorRequest');

  // create the detector
  cy.sa_getElementByText('button', 'Create').click({ force: true });

  // TEST DETECTOR DETAILS PAGE
  cy.wait('@createMappingsRequest');

  if (!expectFailure) {
    cy.wait('@createDetectorRequest').then((interceptor) => {
      const detectorId = interceptor.response.body.response._id;

      cy.url()
        .should('contain', detectorId)
        .then(() => {
          // Confirm detector state
          cy.sa_getElementByText('.euiTitle', detectorName);
          cy.sa_getElementByText('.euiHealth', 'Active').then(() => {
            cy.sa_validateDetailsItem('Detector name', detectorName);
            cy.sa_validateDetailsItem('Description', '-');
            cy.sa_validateDetailsItem('Detector schedule', 'Every 1 minute');
            cy.sa_validateDetailsItem('Detection rules', '14');
            cy.sa_validateDetailsItem(
              'Detector dashboard',
              'Not available for this log type'
            );

            cy.wait(5000); // waiting for the page to be reloaded after pushing detector id into route
            cy.sa_getElementByText('button.euiTab', 'Alert triggers')
              .should('be.visible')
              .click({ force: true });
            validateAlertPanel('Trigger 1');
          });
        });
    });
  }
};

const openCreateForm = () => getCreateDetectorButton().click({ force: true });

const getDescriptionField = () =>
  cy.sa_getTextareaByLabel('Description - optional');
const getTriggerNameField = () => cy.sa_getFieldByLabel('Trigger name');

describe('Detectors', () => {
  before(() => {
    cy.sa_cleanUpTests();

    cy.sa_createIndex(cypressIndexWindows, sample_windows_index_settings);

    // Create test index
    cy.sa_createIndex(cypressIndexDns, sample_dns_index_settings).then(() =>
      cy
        .request(
          'POST',
          `${BACKEND_BASE_PATH}${NODE_API.RULES_BASE}/_search?pre_packaged=true`,
          {
            from: 0,
            size: 5000,
            query: {
              nested: {
                path: 'rule',
                query: {
                  bool: { must: [{ match: { 'rule.category': 'dns' } }] },
                },
              },
            },
          }
        )
        .should('have.property', 'status', 200)
    );

    cy.sa_createRule(dns_name_rule_data);
    cy.sa_createRule(dns_type_rule_data);
  });

  describe('...should validate form fields', () => {
    beforeEach(() => {
      setupIntercept(cy, NODE_API.SEARCH_DETECTORS, 'detectorsSearch');

      // Visit Detectors page before any test
      cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/detectors`);
      cy.wait('@detectorsSearch').should('have.property', 'state', 'Complete');

      openCreateForm();
    });

    it('...should validate name field', () => {
      getNameField().should('be.empty');
      getNameField().focus().blur();
      getNameField()
        .parentsUntil('.euiFormRow__fieldWrapper')
        .siblings()
        .contains('Enter a name.');

      getNameField().type('text').focus().blur();

      getNameField()
        .parents('.euiFormRow__fieldWrapper')
        .find('.euiFormErrorText')
        .contains(
          'Name should only consist of upper and lowercase letters, numbers 0-9, hyphens, spaces, and underscores. Use between 5 and 50 characters.'
        );

      getNameField()
        .type('{selectall}')
        .type('{backspace}')
        .type('tex&')
        .focus()
        .blur();

      getNameField()
        .parents('.euiFormRow__fieldWrapper')
        .find('.euiFormErrorText')
        .contains(
          'Name should only consist of upper and lowercase letters, numbers 0-9, hyphens, spaces, and underscores. Use between 5 and 50 characters.'
        );

      getNameField()
        .type('{selectall}')
        .type('{backspace}')
        .type('Detector name')
        .focus()
        .blur()
        .parents('.euiFormRow__fieldWrapper')
        .find('.euiFormErrorText')
        .should('not.exist');
    });

    it('...should validate description field', () => {
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

    it('...should validate data source field', () => {
      getDataSourceField()
        .focus()
        .blur()
        .parentsUntil('.euiFormRow__fieldWrapper')
        .siblings()
        .contains('Select an input source.');

      getDataSourceField().sa_selectComboboxItem(cypressIndexDns);
      getDataSourceField()
        .focus()
        .blur()
        .parentsUntil('.euiFormRow__fieldWrapper')
        .find('.euiFormErrorText')
        .should('not.exist');
    });

    it('...should validate next button', () => {
      getNextButton().should('be.disabled');

      fillDetailsForm(detectorName, cypressIndexDns);
      getNextButton().should('be.enabled');
    });

    it('...should validate alerts page', () => {
      fillDetailsForm(detectorName, cypressIndexDns);
      getNextButton().click({ force: true });
      // Open the trigger details accordion
      cy.get('[data-test-subj="trigger-details-btn"]').click({ force: true });
      getTriggerNameField().should('have.value', 'Trigger 1');

      getTriggerNameField()
        .parents('.euiFormRow__fieldWrapper')
        .find('.euiFormErrorText')
        .should('not.exist');

      getCreateDetectorButton().should('be.enabled');

      getTriggerNameField()
        .type('{selectall}')
        .type('{backspace}')
        .focus()
        .blur();
      getCreateDetectorButton().should('be.disabled');

      cy.sa_getButtonByText('Remove').click({ force: true });
      getCreateDetectorButton().should('be.enabled');
    });

    it('...should show mappings warning', () => {
      fillDetailsForm(detectorName, cypressIndexDns);

      getDataSourceField().sa_selectComboboxItem(cypressIndexWindows);
      getDataSourceField().focus().blur();

      cy.get('[data-test-subj="define-detector-diff-log-types-warning"]')
        .should('be.visible')
        .contains(
          'To avoid issues with field mappings, we recommend creating separate detectors for different log types.'
        );
    });
  });

  describe('...validate create detector flow', () => {
    beforeEach(() => {
      setupIntercept(cy, NODE_API.SEARCH_DETECTORS, 'detectorsSearch');

      // Visit Detectors page before any test
      cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/detectors`);
      cy.wait('@detectorsSearch').should('have.property', 'state', 'Complete');
    });

    it('...can fail creation', () => {
      createDetector(`${detectorName}_fail`, '.kibana_1', true);
      cy.sa_getElementByText('.euiCallOut', creationFailedMessage);
    });

    it('...can be created', () => {
      createDetector(detectorName, cypressIndexDns, false);
      cy.contains(creationFailedMessage).should('not.exist');
    });

    it('...basic details can be edited', () => {
      setupIntercept(cy, NODE_API.INDICES_BASE, 'getIndices', 'GET');
      openDetectorDetails(detectorName);

      editDetectorDetails(detectorName, 'Detector details');

      cy.sa_urlShouldContain('edit-detector-details').then(() => {
        cy.sa_getElementByText('.euiTitle', 'Edit detector details');
      });

      cy.wait('@getIndices');
      getNameField()
        .type('{selectall}{backspace}')
        .type('test detector edited');
      cy.sa_getTextareaByLabel('Description - optional').type(
        'Edited description'
      );

      getDataSourceField().sa_clearCombobox();
      getDataSourceField().sa_selectComboboxItem(cypressIndexWindows);

      cy.sa_getFieldByLabel('Run every')
        .type('{selectall}{backspace}')
        .type('10');
      cy.sa_getFieldByLabel('Run every', 'select').select('Hours');

      cy.sa_getElementByText('button', 'Save changes').click({ force: true });

      cy.sa_urlShouldContain('detector-details').then(() => {
        cy.sa_validateDetailsItem('Detector name', 'test detector edited');
        cy.sa_validateDetailsItem('Description', 'Edited description');
        cy.sa_validateDetailsItem('Detector schedule', 'Every 10 hours');
        cy.sa_validateDetailsItem('Data source', cypressIndexWindows);
      });
    });

    it('...rules can be edited', () => {
      openDetectorDetails(detectorName);

      editDetectorDetails(detectorName, 'Active rules');
      cy.sa_getElementByText('.euiTitle', 'Detection rules (14)');

      cy.sa_getInputByPlaceholder('Search...')
        .type(`${cypressDNSRule}`)
        .sa_pressEnterKey();

      cy.sa_getElementByText('.euiTableCellContent button', cypressDNSRule)
        .parents('td')
        .prev()
        .find('.euiTableCellContent button')
        .click();

      cy.sa_getElementByText('.euiTitle', 'Detection rules (13)');
      cy.sa_getElementByText('button', 'Save changes').click({ force: true });
      cy.sa_urlShouldContain('detector-details').then(() => {
        cy.sa_getElementByText('.euiTitle', detectorName);
        cy.sa_getElementByText('.euiPanel .euiTitle', 'Active rules (13)');
      });
    });

    xit('...should update field mappings if data source is changed', () => {
      setupIntercept(
        cy,
        `${NODE_API.MAPPINGS_VIEW}?indexName=cypress-index-dns&ruleTopic=dns`,
        'getMappingsView',
        'GET'
      );
      setupIntercept(cy, NODE_API.INDICES_BASE, 'getIndices', 'GET');
      openDetectorDetails(detectorName);

      editDetectorDetails(detectorName, 'Detector details');

      cy.sa_urlShouldContain('edit-detector-details').then(() => {
        cy.sa_getElementByText('.euiTitle', 'Edit detector details');
      });

      cy.wait('@getIndices');
      cy.get('.reviewFieldMappings').should('not.exist');

      getDataSourceField().sa_clearCombobox();
      getDataSourceField().should('not.have.value');
      getDataSourceField().type(`${cypressIndexDns}{enter}`);

      validateFieldMappingsTable('data source is changed');

      cy.sa_getElementByText('button', 'Save changes').click({ force: true });
    });

    xit('...should show field mappings if rule selection is changed', () => {
      setupIntercept(cy, `${NODE_API.MAPPINGS_VIEW}`, 'getMappingsView', 'GET');

      openDetectorDetails(detectorName);

      editDetectorDetails(detectorName, 'Active rules');

      cy.sa_urlShouldContain('edit-detector-rules').then(() => {
        cy.sa_getElementByText('.euiTitle', 'Edit detector rules');
      });

      cy.get('.reviewFieldMappings').should('not.exist');

      cy.wait('@detectorsSearch');

      // Toggle single search result to unchecked
      cy.get(
        '[data-test-subj="edit-detector-rules-table"] table thead tr:first th:first button'
      ).click({ force: true });

      validateFieldMappingsTable('rules are changed');
    });

    it('...can be stopped and started back from detectors list action menu', () => {
      cy.wait(1000);
      cy.get('tbody > tr')
        .first()
        .within(() => {
          cy.get('[class="euiCheckbox__input"]').click({ force: true });
        });

      // Waiting for Actions menu button to be enabled
      cy.wait(1000);

      setupIntercept(
        cy,
        `${NODE_API.DETECTORS_BASE}/_search`,
        'detectorsSearch'
      );

      cy.get('[data-test-subj="detectorsActionsButton').click({ force: true });
      cy.get('[data-test-subj="toggleDetectorButton').contains('Stop');
      cy.get('[data-test-subj="toggleDetectorButton').click({ force: true });

      cy.wait('@detectorsSearch').should('have.property', 'state', 'Complete');
      // Need this extra wait time for the Actions button to become enabled again
      cy.wait(2000);

      setupIntercept(
        cy,
        `${NODE_API.DETECTORS_BASE}/_search`,
        'detectorsSearch'
      );
      cy.get('[data-test-subj="detectorsActionsButton').click({ force: true });
      cy.get('[data-test-subj="toggleDetectorButton').contains('Start');
      cy.get('[data-test-subj="toggleDetectorButton').click({ force: true });

      cy.wait('@detectorsSearch').should('have.property', 'state', 'Complete');
      // Need this extra wait time for the Actions button to become enabled again
      cy.wait(2000);

      cy.get('[data-test-subj="detectorsActionsButton').click({ force: true });
      cy.get('[data-test-subj="toggleDetectorButton').contains('Stop');
    });

    it('...can be deleted', () => {
      setupIntercept(cy, `${NODE_API.RULES_BASE}/_search`, 'getSigmaRules');
      openDetectorDetails(detectorName);

      cy.wait('@detectorsSearch');
      cy.wait('@getSigmaRules');

      cy.sa_getButtonByText('Actions')
        .click({ force: true })
        .then(() => {
          setupIntercept(cy, `${NODE_API.DETECTORS_BASE}/_search`, 'detectors');
          cy.sa_getElementByText('.euiContextMenuItem', 'Delete').click({
            force: true,
          });
          cy.wait('@detectors').then(() => {
            cy.contains('There are no existing detectors');
          });
        });
    });
  });

  after(() => cy.sa_cleanUpTests());
});
