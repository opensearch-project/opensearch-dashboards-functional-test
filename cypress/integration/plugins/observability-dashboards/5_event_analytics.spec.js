/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />
import {
  delayTime,
  TEST_QUERIES,
  SAVE_QUERY2,
  querySearch,
  landOnEventHome,
  landOnEventExplorer,
  supressResizeObserverIssue,
} from '../../../utils/constants';

describe('Click actions', () => {
  beforeEach(() => {
    landOnEventHome();
  });

  it('Actions - add sample data', () => {
    cy.get('[data-test-subj="eventHomeAction"]').click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="eventHomeAction__addSamples"]').click();
    cy.get('[data-test-subj="confirmModalConfirmButton"]').click();
    cy.contains('Sample events added successfully.', { timeout: 10000 });
  });
});

describe('Saves a query on explorer page', () => {
  it('Saves a visualization on visualization tab of explorer page', () => {
    landOnEventExplorer();
    querySearch(TEST_QUERIES[1].query, TEST_QUERIES[1].dateRangeDOM);
    cy.wait(delayTime);
    supressResizeObserverIssue();
    cy.get('button[id="main-content-vis"]').contains('Visualizations').click();
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]').click();
    cy.wait(delayTime * 2);
    cy.get(
      '[data-test-subj="eventExplorer__querySaveComboBox"] [data-test-subj="comboBoxToggleListButton"]'
    ).click();
    cy.get('[data-test-subj="eventExplorer__querySaveName"]').type(SAVE_QUERY2);
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]').click();
    cy.wait(delayTime * 2);

    cy.get('.euiToastHeader__title').contains('successfully').should('exist');

    landOnEventHome();

    cy.get('[data-test-subj="eventHome__savedQueryTableName"]')
      .first()
      .contains(SAVE_QUERY2);
  });
});

describe('Override timestamp for an index', () => {
  it('Click override button to override default timestamp', () => {
    landOnEventExplorer();

    cy.get('[data-test-subj="searchAutocompleteTextArea"]').type(
      TEST_QUERIES[2].query
    );
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]')
      .contains('Refresh')
      .click();
    cy.get('.tab-title').contains('Events').click();
    cy.get(
      '[data-test-subj="eventExplorer__overrideDefaultTimestamp"]'
    ).click();
    cy.wait(delayTime);

    cy.get(
      '[data-attr-field="utc_time"] [data-test-subj="eventFields__default-timestamp-mark"'
    )
      .contains('Default Timestamp')
      .should('exist');
    cy.get(
      '[data-attr-field="timestamp"] [data-test-subj="eventFields__default-timestamp-mark"'
    ).should('not.exist');
  });
});

describe('Delete saved objects', () => {
  it('Delete visualizations/querys from event analytics', () => {
    landOnEventHome();
    cy.get('[data-test-subj="tablePaginationPopoverButton"]').click();
    cy.get('.euiContextMenuItem__text').contains('50 rows').click();
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Actions').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Delete').click();
    cy.wait(delayTime);

    cy.get('button.euiButton--danger').should('be.disabled');

    cy.get('input.euiFieldText[placeholder="delete"]').type('delete');
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').click();
    cy.wait(delayTime * 4);
    cy.get('.euiTextAlign')
      .contains('No Queries or Visualizations')
      .should('exist');
  });
});
