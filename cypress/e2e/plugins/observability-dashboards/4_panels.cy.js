/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  PANEL_DELAY as delay,
  TEST_PANEL,
  PPL_VISUALIZATIONS,
  PPL_VISUALIZATIONS_NAMES,
  supressResizeObserverIssue,
  BASE_PATH,
} from '../../../utils/constants';

const moveToEventsHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-logs#`);
  cy.wait(delay * 3);
};

const moveToPanelHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#`);
  cy.wait(delay * 3);
};

const moveToTestPanel = () => {
  moveToPanelHome();
  cy.get('.euiTableCellContent')
    .contains(TEST_PANEL)
    .trigger('mouseover')
    .click();
  cy.wait(delay * 3);
  cy.get('h1').contains(TEST_PANEL).should('exist');
  cy.wait(delay);
};

describe('Creating visualizations', () => {
  beforeEach(() => {
    moveToEventsHome();
  });

  it('Create first visualization in event analytics', () => {
    cy.get('[id^=autocomplete-textarea]').focus().type(PPL_VISUALIZATIONS[0], {
      delay: 50,
    });
    cy.get('.euiButton__text').contains('Refresh').trigger('mouseover').click();
    cy.wait(delay);
    supressResizeObserverIssue();
    cy.get('button[id="main-content-vis"]')
      .contains('Visualizations')
      .trigger('mouseover')
      .click();
    cy.wait(delay * 2);
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]')
      .trigger('mouseover')
      .click();
    cy.wait(1000);
    cy.get('[data-test-subj="eventExplorer__querySaveName"]')
      .focus()
      .type(PPL_VISUALIZATIONS_NAMES[0], {
        delay: 50,
      });
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiToastHeader__title').contains('successfully').should('exist');
  });
});

describe('Testing panels table', () => {
  beforeEach(() => {
    moveToPanelHome();
  });

  it('Creates a panel and redirects to the panel', () => {
    cy.get('.euiButton__text')
      .contains('Create Dashboard')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('input.euiFieldText').focus().type(TEST_PANEL, {
      delay: 50,
    });
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .trigger('mouseover')
      .click();
    cy.wait(delay);

    cy.contains(TEST_PANEL).should('exist');
  });

  it('Duplicates a panel', () => {
    cy.get('.euiCheckbox__input[title="Select this row"]')
      .eq(0)
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.get('.euiButton__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
  });

  it('Deletes panels', () => {
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Delete')
      .trigger('mouseover')
      .click();
    cy.wait(delay);

    cy.get('button.euiButton--danger').should('be.disabled');

    cy.get('input.euiFieldText[placeholder="delete"]').focus().type('delete', {
      delay: 50,
    });
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').trigger('mouseover').click();

    cy.get('.euiTextAlign')
      .contains('No Observability Dashboards')
      .should('exist');

    // keep a panel for testing
    cy.get('.euiButton__text')
      .contains('Create Dashboard')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('input.euiFieldText').focus().type(TEST_PANEL, {
      delay: 50,
    });
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .trigger('mouseover')
      .click();
    cy.wait(delay * 2);
  });
});

describe('Testing a panel', () => {
  it('Move to test panel', () => {
    moveToTestPanel();
  });

  it('Change date filter of the panel', () => {
    cy.get(
      '.euiButtonEmpty[data-test-subj="superDatePickerToggleQuickMenuButton"]'
    ).click({
      force: true,
    });
    cy.get('.euiLink').contains('This year').trigger('mouseover').click();
    cy.wait(delay * 2);
    cy.get(
      '.euiSuperDatePicker__prettyFormat[data-test-subj="superDatePickerShowDatesButton"]'
    )
      .contains('This year')
      .should('exist');
    cy.wait(delay);
  });
});

describe('Clean up all test data', () => {
  it('Deletes test panel', () => {
    moveToPanelHome();
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Delete')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('button.euiButton--danger').should('be.disabled');
    cy.get('input.euiFieldText[placeholder="delete"]').focus().type('delete', {
      delay: 50,
    });
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').trigger('mouseover').click();

    cy.get('.euiTextAlign')
      .contains('No Observability Dashboards')
      .should('exist');
  });
});
