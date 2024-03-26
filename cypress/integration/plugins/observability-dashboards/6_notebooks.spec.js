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
  OBSERVABILITY_INDEX_NAME,
} from '../../../utils/constants';

import { skipOn } from '@cypress/skip-test';

const testNotebookName = () => {
  let code = (Math.random() + 1).toString(36).substring(7);
  return `Test Notebook ${code}`;
};

const moveToNotebookHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-notebooks#/`);
};

const moveToTestNotebook = (notebookName) => {
  cy.visit(`${BASE_PATH}/app/observability-notebooks#/`, {
    timeout: delayTime * 3,
  });

  // Force refresh the observablity index and reload page to load notebooks.
  cy.request({
    method: 'POST',
    failOnStatusCode: false,
    form: false,
    url: 'api/console/proxy',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
    },
    qs: {
      path: `${OBSERVABILITY_INDEX_NAME}/_refresh`,
      method: 'POST',
    },
  });
  cy.reload();

  cy.get('.euiTableCellContent')
    .contains(notebookName, {
      timeout: delayTime * 3,
    })
    .click();
};

const makeTestNotebook = () => {
  let notebookName = testNotebookName();

  moveToNotebookHome();
  cy.get('a[data-test-subj="createNotebookPrimaryBtn"]').click();
  cy.get('input[data-test-subj="custom-input-modal-input"]').focus();
  cy.get('input[data-test-subj="custom-input-modal-input"]').type(notebookName);
  cy.get('button[data-test-subj="custom-input-modal-confirm-button"]').click();
  cy.get('h1[data-test-subj="notebookTitle"]')
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
};

const deleteNotebook = (notebookName) => {
  moveToNotebookHome();

  cy.contains('.euiTableRow', notebookName)
    .find('input[type="checkbox"]')
    .check();

  cy.get('button[data-test-subj="notebookTableActionBtn"]').click();
  cy.get('button[data-test-subj="deleteNotebookBtn"]').click();

  cy.get('input[data-test-subj="delete-notebook-modal-input"]').focus();
  cy.get('input[data-test-subj="delete-notebook-modal-input"]').type('delete');
  cy.get('button[data-test-subj="delete-notebook-modal-delete-button"]').should(
    'not.be.disabled'
  );
  cy.get(
    'button[data-test-subj="delete-notebook-modal-delete-button"]'
  ).click();
  moveToNotebookHome();

  cy.contains('.euiTableRow', notebookName).should('not.exist');
};

describe('Testing notebook actions', () => {
  beforeEach(() => {
    let notebookName = makeTestNotebook();
    moveToTestNotebook(notebookName);
    cy.wrap({ name: notebookName }).as('notebook');
  });

  afterEach(function () {
    //      ^^^^^^^^ Cannot use arrow callback to access beforeEach wrapper state
    deleteNotebook(this.notebook.name);
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
    cy.get('textarea[data-test-subj="editorArea-0"]').should('not.exist');
    cy.get(`a[href="${SAMPLE_URL}"]`).should('exist');
    cy.get('code').contains('POST').should('exist');
    cy.get('td').contains('b2').should('exist');
  });
});

describe('Test reporting integration if plugin installed', () => {
  beforeEach(() => {
    let notebookName = makeTestNotebook();
    cy.get('body').then(($body) => {
      skipOn($body.find('#reportingActionsButton').length <= 0);
    });
    makePopulatedParagraph();
    cy.wrap({ name: notebookName }).as('notebook');
  });

  afterEach(function () {
    //      ^^^^^^^^ Cannot use arrow callback to access beforeEach wrapper state
    deleteNotebook(this.notebook.name);
  });

  it('Create in-context PDF report from notebook', () => {
    cy.get('#reportingActionsButton').click();
    cy.get('button.euiContextMenuItem:nth-child(1)')
      .contains('Download PDF')
      .click();
    cy.get('body').contains('Please continue report generation in the new tab');
  });

  it('Create in-context PNG report from notebook', () => {
    cy.get('#reportingActionsButton').click();
    cy.get('button.euiContextMenuItem:nth-child(2)')
      .contains('Download PNG')
      .click();
    cy.get('body').contains('Please continue report generation in the new tab');
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
