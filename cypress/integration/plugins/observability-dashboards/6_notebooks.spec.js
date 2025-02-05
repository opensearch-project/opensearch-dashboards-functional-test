/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  SAMPLE_URL,
  BASE_PATH,
  delayTime,
  MARKDOWN_TEXT,
} from '../../../utils/constants';

import { skipOn } from '@cypress/skip-test';

const testNotebookName = () => {
  let code = (Math.random() + 1).toString(36).substring(7);
  return `Test Notebook ${code}`;
};

const moveToNotebookHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-notebooks#/`);
};

const makeTestNotebook = () => {
  let notebookName = testNotebookName();

  moveToNotebookHome();
  cy.get('a[data-test-subj="createNotebookPrimaryBtn"]').click();
  cy.get('input[data-test-subj="custom-input-modal-input"]').focus();
  cy.get('input[data-test-subj="custom-input-modal-input"]').type(notebookName);
  cy.get('button[data-test-subj="custom-input-modal-confirm-button"]').click();

  cy.contains(`Notebook "${notebookName}" successfully created`);

  cy.get('[data-test-subj="notebookTitle"]')
    .contains(notebookName)
    .should('exist');

  return notebookName;
};

const makeParagraph = () => {
  cy.get('button[data-test-subj="emptyNotebookAddCodeBlockBtn"]').click();
  cy.get('textarea[data-test-subj="editorArea-0"]').should('exist');
};

const makePopulatedParagraph = () => {
  makeParagraph();
  cy.get('textarea[data-test-subj="editorArea-0"]').clear();
  cy.get('textarea[data-test-subj="editorArea-0"]').focus();
  cy.get('textarea[data-test-subj="editorArea-0"]').type(MARKDOWN_TEXT);
  cy.get('button[data-test-subj="runRefreshBtn-0"]').click();
  cy.get('textarea[data-test-subj="editorArea-0"]').should('not.exist');
};

const deleteNotebook = () => {
  cy.get('button[data-test-subj="notebook-delete-icon"]').click();
  cy.get('input[data-test-subj="delete-notebook-modal-input"]').type('delete');
  cy.get('button[data-test-subj="delete-notebook-modal-delete-button"]').should(
    'not.be.disabled'
  );
  cy.get(
    'button[data-test-subj="delete-notebook-modal-delete-button"]'
  ).click();
};

const deleteAllNotebooks = () => {
  cy.intercept('GET', '/api/observability/notebooks/savedNotebook').as(
    'getNotebooks'
  );
  cy.intercept(
    'DELETE',
    '/api/observability/notebooks/note/savedNotebook/*'
  ).as('deleteNotebook');
  moveToNotebookHome();

  cy.wait('@getNotebooks').then(() => {
    cy.contains(' (4)').should('exist');
  });

  cy.get('input[data-test-subj="checkboxSelectAll"]').click();
  cy.get('button[data-test-subj="deleteSelectedNotebooks"]')
    .contains('Delete 4 notebooks')
    .should('exist');
  cy.get('button[data-test-subj="deleteSelectedNotebooks"]').click();
  cy.get('input[data-test-subj="delete-notebook-modal-input"]').type('delete');
  cy.get('button[data-test-subj="delete-notebook-modal-delete-button"]').should(
    'not.be.disabled'
  );
  cy.get(
    'button[data-test-subj="delete-notebook-modal-delete-button"]'
  ).click();

  cy.wait('@deleteNotebook').its('response.statusCode').should('eq', 200);
};

describe('Testing notebook actions', () => {
  beforeEach(() => {
    let notebookName = makeTestNotebook();
    cy.wrap({ name: notebookName }).as('notebook');
  });

  afterEach(() => {
    deleteNotebook();
  });

  it('Creates a code paragraph', () => {
    makeParagraph();

    cy.get('button[data-test-subj="runRefreshBtn-0"]').contains('Run').click();
    cy.get('div[data-test-subj="paragraphInputErrorText"]')
      .contains('Input is required.')
      .should('exist');
  });

  it('Renders markdown', () => {
    makePopulatedParagraph();

    cy.get(`a[href="${SAMPLE_URL}"]`).should('exist');
    cy.get('code').contains('POST').should('exist');
    cy.get('td').contains('b2').should('exist');
  });
});

describe('Test reporting integration if plugin installed', () => {
  beforeEach(() => {
    let notebookName = makeTestNotebook();
    cy.wrap({ name: notebookName }).as('notebook');
    cy.get('body').then(($body) => {
      skipOn($body.find('#reportingActionsButton').length <= 0);
    });
    makePopulatedParagraph();
  });

  after(() => {
    deleteAllNotebooks();
  });

  it('Create in-context PDF report from notebook', () => {
    cy.get('button[data-test-subj="reporting-actions-button"]').click();
    cy.get('.euiContextMenuPanel').should('be.visible');
    cy.get('button.euiContextMenuItem:nth-child(1)')
      .contains('Download PDF')
      .click();
    cy.get('body').contains('Please continue report generation in the new tab');
  });

  it('Create in-context PNG report from notebook', () => {
    cy.get('button[data-test-subj="reporting-actions-button"]').click();
    cy.get('.euiContextMenuPanel').should('be.visible');
    cy.get('button.euiContextMenuItem:nth-child(2)')
      .contains('Download PNG')
      .click();
    cy.get('body').contains('Please continue report generation in the new tab');
  });

  it('Create on-demand report definition from context menu', () => {
    cy.get('button[data-test-subj="reporting-actions-button"]').click();
    cy.get('.euiContextMenuPanel').should('be.visible');
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
    cy.get('button[data-test-subj="reporting-actions-button"]').click();
    cy.get('.euiContextMenuPanel').should('be.visible');
    cy.get('button.euiContextMenuItem:nth-child(4)')
      .contains('View reports')
      .click();
    cy.location('pathname', { timeout: delayTime * 3 }).should(
      'include',
      '/reports-dashboards'
    );
  });
});
