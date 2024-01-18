/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  SAMPLE_SQL_QUERY,
  TEST_NOTEBOOK,
  SAMPLE_URL,
  BASE_PATH,
  delayTime,
  MARKDOWN_TEXT,
} from '../../../utils/constants';

import { skipOn } from '@cypress/skip-test';

const moveToNotebookHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-notebooks#/`);
};

const moveToTestNotebook = () => {
  cy.visit(`${BASE_PATH}/app/observability-notebooks#/`, {
    timeout: delayTime * 3,
  });

  // Reload page to load notebooks if they are not flushed in OpenSearch index yet.
  cy.reload();

  cy.get('.euiTableCellContent')
    .contains(TEST_NOTEBOOK, {
      timeout: delayTime * 3,
    })
    .click();
};

describe('Testing notebook actions', () => {
  before(() => {
    moveToNotebookHome();
    cy.get('a[data-test-subj="createNotebookPrimaryBtn"]').click();
    cy.get('input[data-test-subj="custom-input-modal-input"]').focus();
    cy.get('input[data-test-subj="custom-input-modal-input"]').type(
      TEST_NOTEBOOK
    );
    cy.get(
      'button[data-test-subj="custom-input-modal-confirm-button"]'
    ).click();
    cy.get('h1[data-test-subj="notebookTitle"]')
      .contains(TEST_NOTEBOOK)
      .should('exist');
  });

  beforeEach(() => {
    moveToTestNotebook();
  });

  it('Creates a code paragraph', () => {
    cy.get('button[data-test-subj="emptyNotebookAddCodeBlockBtn"]').click();
    cy.get('textarea[data-test-subj="editorArea-0"]').should('exist');
    cy.get('button[data-test-subj="runRefreshBtn-0"]').contains('Run').click();
    cy.get('div[data-test-subj="paragraphInputErrorText"]')
      .contains('Input is required.')
      .should('exist');
  });

  it('Renders markdown', () => {
    cy.get('button[data-test-subj="paragraphToggleInputBtn"]').click();
    cy.get('.euiCodeBlock').click();
    cy.get('textarea[data-test-subj="editorArea-0"]').clear();
    cy.get('textarea[data-test-subj="editorArea-0"]').focus();
    cy.get('textarea[data-test-subj="editorArea-0"]').type(MARKDOWN_TEXT);

    cy.get('button[data-test-subj="runRefreshBtn-0"]').click();
    cy.get('textarea[data-test-subj="editorArea-0"]').should('not.exist');
    cy.get(`a[href="${SAMPLE_URL}"]`).should('exist');
    cy.get('code').contains('POST').should('exist');
    cy.get('td').contains('b2').should('exist');
  });

  it('Adds a SQL query paragraph', () => {
    cy.get('button[data-test-subj="AddParagraphButton"]').click();
    cy.get('button[data-test-subj="AddCodeBlockBtn"]').click();

    cy.get('textarea[data-test-subj="editorArea-1"]').clear();
    cy.get('textarea[data-test-subj="editorArea-1"]').focus();
    cy.get('textarea[data-test-subj="editorArea-1"]').type(SAMPLE_SQL_QUERY);
    cy.get('button[data-test-subj="runRefreshBtn-1"]').click();

    cy.get('textarea[data-test-subj="editorArea-1"]').should('not.exist');
    cy.get('div[data-test-subj="queryOutputText"]')
      .contains('select 1')
      .should('exist');

    cy.get('.euiDataGrid__overflow').should('exist');
  });
});

describe('Test reporting integration if plugin installed', () => {
  beforeEach(() => {
    moveToNotebookHome();
    cy.get('.euiTableCellContent').contains(TEST_NOTEBOOK).click();
    cy.wait(delayTime * 3); //page needs to process before checking
    cy.get('body').then(($body) => {
      skipOn($body.find('#reportingActionsButton').length <= 0);
    });
  });

  it('Create in-context PDF report from notebook', () => {
    cy.get('#reportingActionsButton').click();
    cy.get('button.euiContextMenuItem:nth-child(1)')
      .contains('Download PDF')
      .click();
    cy.get('#downloadInProgressLoadingModal').should('exist');
  });

  it('Create in-context PNG report from notebook', () => {
    cy.get('#reportingActionsButton').click();
    cy.get('button.euiContextMenuItem:nth-child(2)')
      .contains('Download PNG')
      .click();
    cy.get('#downloadInProgressLoadingModal').should('exist');
  });

  it('Create on-demand report definition from context menu', () => {
    cy.get('#reportingActionsButton').click();
    cy.get('button.euiContextMenuItem:nth-child(3)')
      .contains('Create report definition')
      .click();
    cy.location('pathname', { timeout: delayTime * 3 }).should(
      'include',
      '/reports-dashboards'
    );
    cy.get('#reportSettingsName').type('Create notebook on-demand report');
    cy.get('#createNewReportDefinition').click({ force: true });
  });

  it('View reports homepage from context menu', () => {
    cy.get('#reportingActionsButton').click();
    cy.get('button.euiContextMenuItem:nth-child(4)')
      .contains('View reports')
      .click();
    cy.location('pathname', { timeout: delayTime * 3 }).should(
      'include',
      '/reports-dashboards'
    );
  });
});

describe('clean up all test data', () => {
  it('Cleans up test notebooks', () => {
    moveToNotebookHome();
    cy.get('input[data-test-subj="checkboxSelectAll"]').click();
    cy.get('button[data-test-subj="notebookTableActionBtn"]').click();
    cy.get('button[data-test-subj="deleteNotebookBtn"]').click();
    cy.get(
      'button[data-test-subj="delete-notebook-modal-delete-button"]'
    ).should('be.disabled');

    cy.get('input[data-test-subj="delete-notebook-modal-input"]').focus();
    cy.get('input[data-test-subj="delete-notebook-modal-input"]').type(
      'delete'
    );
    cy.get(
      'button[data-test-subj="delete-notebook-modal-delete-button"]'
    ).should('not.be.disabled');
    cy.get(
      'button[data-test-subj="delete-notebook-modal-delete-button"]'
    ).click();
    moveToNotebookHome();
    cy.get('div[data-test-subj="notebookEmptyTableText"]').should('exist');
  });
});
