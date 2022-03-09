/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  delayTime,
  TEST_NOTEBOOK,
  MARKDOWN_TEXT,
  SAMPLE_URL,
  SQL_QUERY_TEXT,
  PPL_QUERY_TEXT,
  SAMPLE_PANEL,
  BASE_PATH
} from '../../../utils/constants';

import { skipOn } from '@cypress/skip-test';

describe('Adding sample data and visualization', () => {
  it('Adds sample flights data for visualization paragraph', () => {
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`);
    cy.get('div[data-test-subj="sampleDataSetCardflights"]')
      .contains(/(Add|View) data/)
      .click();
  });

  it.skip('Add sample observability data', () => {
    cy.visit(
      `${BASE_PATH}/app/observability-dashboards#/operational_panels/`
    );
    cy.get('.euiButton__text').contains('Actions').click();
    cy.get('.euiContextMenuItem__text').contains('Add samples').click();
    cy.get('.euiModalHeader__title[data-test-subj="confirmModalTitleText"]')
      .contains('Add samples')
      .should('exist');
    cy.get('.euiButton__text').contains('Yes').click();
    cy.wait(delayTime * 5);
    cy.get('.euiTableCellContent').contains(SAMPLE_PANEL).should('exist');
  });
});

describe('Testing notebooks table', () => {
  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/observability-dashboards#/notebooks`);
  });

  it('Displays error toast for invalid notebook name', () => {
    cy.get('.euiButton__text').contains('Create notebook').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .click();
    cy.wait(delayTime);

    cy.get('.euiToastHeader__title').contains('Invalid notebook name').should('exist');
  });

  it('Creates a notebook and redirects to the notebook', () => {
    cy.get('.euiButton__text').contains('Create notebook').click();
    cy.wait(delayTime);
    cy.get('input.euiFieldText').type(TEST_NOTEBOOK);
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .click();
    cy.wait(delayTime);

    cy.contains(TEST_NOTEBOOK).should('exist');
  });

  it('Duplicates and renames a notebook', () => {
    cy.get('.euiCheckbox__input[title="Select this row"]').eq(0).click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Actions').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Duplicate').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Duplicate').click();
    cy.wait(delayTime);

    cy.get('.euiCheckbox__input[title="Select this row"]').eq(1).click();
    cy.wait(delayTime);
    cy.get('.euiCheckbox__input[title="Select this row"]').eq(0).click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Actions').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Rename').click();
    cy.wait(delayTime);
    cy.get('input.euiFieldText').type(' (rename)');
    cy.get('.euiButton__text').contains('Rename').click();
    cy.wait(delayTime);
  });

  it('Searches existing notebooks', () => {
    cy.get('input.euiFieldSearch').type('this notebook should not exist');
    cy.wait(delayTime);

    cy.get('.euiTableCellContent__text').contains('No items found').should('exist');

    cy.get('.euiFormControlLayoutClearButton').click();
    cy.wait(delayTime);
    cy.get('input.euiFieldSearch').type(TEST_NOTEBOOK + ' (copy) (rename)');
    cy.wait(delayTime);

    cy.get('a.euiLink')
      .contains(TEST_NOTEBOOK + ' (copy) (rename)')
      .should('exist');
  });

  it('Deletes notebooks', () => {
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

    cy.get('.euiTextAlign').contains('No notebooks').should('exist');

    // keep a notebook for testing
    cy.get('.euiButton__text').contains('Create notebook').click();
    cy.wait(delayTime);
    cy.get('input.euiFieldText').type(TEST_NOTEBOOK);
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .click();
    cy.wait(delayTime * 2);
  });
});

describe('Test reporting integration if plugin installed', () => {
  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/observability-dashboards#/notebooks`);
    cy.get('.euiTableCellContent').contains(TEST_NOTEBOOK).click();
    cy.wait(delayTime * 3);
    cy.get('body').then(($body) => {
      skipOn($body.find('#reportingActionsButton').length <= 0);
    });
  });

  it('Create in-context PDF report from notebook', () => {
    cy.get('#reportingActionsButton').click();
    cy.wait(delayTime);
    cy.get('button.euiContextMenuItem:nth-child(1)').contains('Download PDF').click();
    cy.get('#downloadInProgressLoadingModal').should('exist');
  });

  it('Create in-context PNG report from notebook', () => {
    cy.get('#reportingActionsButton').click();
    cy.wait(delayTime);
    cy.get('button.euiContextMenuItem:nth-child(2)').contains('Download PNG').click();
    cy.get('#downloadInProgressLoadingModal').should('exist');
  });

  it('Create on-demand report definition from context menu', () => {
    cy.get('#reportingActionsButton').click();
    cy.wait(delayTime);
    cy.get('button.euiContextMenuItem:nth-child(3)').contains('Create report definition').click();
    cy.wait(delayTime);
    cy.location('pathname', { timeout: 60000 }).should('include', '/reports-dashboards');
    cy.wait(delayTime);
    cy.get('#reportSettingsName').type('Create notebook on-demand report');
    cy.get('#createNewReportDefinition').click({ force: true });
  });

  it('View reports homepage from context menu', () => {
    cy.get('#reportingActionsButton').click();
    cy.wait(delayTime);
    cy.get('button.euiContextMenuItem:nth-child(4)').contains('View reports').click();
    cy.wait(delayTime);
    cy.location('pathname', { timeout: 60000 }).should('include', '/reports-dashboards');
  });
});

describe('Testing paragraphs', () => {
  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/observability-dashboards#/notebooks`);
    cy.get('.euiTableCellContent').contains(TEST_NOTEBOOK).click();
  });

  it('Goes into a notebook and creates paragraphs', () => {
    cy.get('.euiButton__text').contains('Add').click();
    cy.wait(delayTime);

    cy.get('.euiTextArea').should('exist');

    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);
    cy.get('.euiTextColor').contains('Input is required.').should('exist');
    cy.get('.euiTextArea').clear();
    cy.get('.euiTextArea').type(MARKDOWN_TEXT);
    cy.wait(delayTime);

    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);
  });

  it('Renders markdown', () => {
    cy.get('.euiTextArea').should('not.exist');
    cy.get(`a[href="${SAMPLE_URL}"]`).should('exist');
    cy.get('code').contains('POST').should('exist');
    cy.get('td').contains('b2').should('exist');
  });

  it('Shows output message', () => {
    cy.get('button[aria-label="Toggle show input"]').click();
    cy.wait(delayTime);
    cy.get('.euiTextColor').contains('Last successful run').should('exist');

    cy.get('pre.input').eq(0).click();
    cy.wait(delayTime);
    cy.get('.euiTextArea').type('Another text');
    cy.wait(delayTime);

    cy.get('.euiTextColor').contains('Last successful run').should('exist');
  });

  it('Renders input only mode', () => {
    cy.get('.euiToggle__input[title="Input only"]').click();
    cy.wait(delayTime);

    cy.get('div.markdown-body').should('not.exist');
    cy.get('.euiLink').contains('View both').should('exist');
    cy.get('.euiLink').contains('View both').click();
    cy.wait(delayTime);

    cy.get('code').contains('POST').should('exist');
    cy.get('.euiLink').contains('View both').should('not.exist');
  });

  it('Renders output only mode', () => {
    cy.get('.euiToggle__input[title="Output only"]').click();
    cy.wait(delayTime);

    cy.get('button[aria-label="Open paragraph menu"]').should('not.exist');
    cy.get('button[aria-label="Toggle show input"]').should('not.exist');
    cy.get('code').contains('POST').should('exist');
  });

  it('Duplicates paragraphs', () => {
    cy.get('.euiButtonIcon[aria-label="Open paragraph menu"]').eq(0).click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Duplicate').eq(0).click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);

    cy.get(`a[href="${SAMPLE_URL}"]`).should('have.length.gte', 2);
  });

  it('Adds a dashboards visualization paragraph', () => {
    cy.contains('Add paragraph').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Visualization').click();
    cy.wait(delayTime);

    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);
    cy.get('.euiTextColor').contains('Visualization is required.').should('exist');

    cy.get('.euiButton__text').contains('Browse').click();
    cy.wait(delayTime);
    cy.get('.euiFieldSearch').focus().type('[Flights] Flight Count and Average Ticket Price{enter}');
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Select').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);
    cy.get('div.visualization').should('exist');
  });

  it('Adds a SQL query paragraph', () => {
    cy.contains('Add paragraph').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Code block').click();
    cy.wait(delayTime);

    cy.get('.euiTextArea').type(SQL_QUERY_TEXT);
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime * 5);

    cy.get('b').contains('select * from opensearch_dashboards_sample_data_flights limit 20');

    cy.get('.euiDataGrid__overflow').should('exist');
  });

  it.skip('Adds an observability visualization paragraph', () => {
    cy.contains('Add paragraph').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Visualization').click();
    cy.wait(delayTime);

    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);
    cy.get('.euiTextColor').contains('Visualization is required.').should('exist');

    cy.get('.euiButton__text').contains('Browse').click();
    cy.wait(delayTime);
    cy.get('.euiFieldSearch').focus().type('[Logs] Count total requests by tags{enter}');
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Select').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);
    cy.get('h5').contains('[Logs] Count total requests by tags').should('exist');
  });

  it('Adds a PPL query paragraph', () => {
    cy.contains('Add paragraph').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Code block').click();
    cy.wait(delayTime);

    cy.get('.euiTextArea').type(PPL_QUERY_TEXT);
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime * 5);

    cy.get('b').contains('source=opensearch_dashboards_sample_data_flights');

    cy.get('.euiDataGrid__overflow').should('exist');
  });

  it('Clears outputs', () => {
    cy.wait(delayTime * 3); // need to wait for paragraphs to load first
    cy.get('[data-test-subj="notebook-paragraph-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Clear all outputs').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Clear').click();
    cy.wait(delayTime);

    cy.get(`a[href="${SAMPLE_URL}"]`).should('not.exist');
  });

  it('Runs all paragraphs', () => {
    cy.wait(delayTime * 3); // need to wait for paragraphs to load first
    cy.get('[data-test-subj="notebook-paragraph-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Run all paragraphs').click();
    cy.wait(delayTime);

    cy.get(`a[href="${SAMPLE_URL}"]`).should('exist');
  });

  it('Adds paragraph to top and bottom', () => {
    cy.wait(delayTime * 3); // need to wait for paragraphs to load first
    cy.get('[data-test-subj="notebook-paragraph-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Add paragraph to top').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Code block').click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="notebook-paragraph-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Add paragraph to bottom').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Code block').click();
    cy.wait(delayTime);

    cy.get('.euiText').contains('[4] Visualization').should('exist');
    cy.get('.euiText').contains('[5] Code block').should('exist');
  });

  it('Moves paragraphs', () => {
    cy.get('.euiButtonIcon[aria-label="Open paragraph menu"').eq(0).click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem-isDisabled').should('have.length.gte', 2);
    cy.get('.euiContextMenuItem__text').contains('Move to bottom').click();
    cy.wait(delayTime);

    cy.get('.euiText').contains('[3] Visualization').should('exist');
  });

  it('Duplicates and renames the notebook', () => {
    cy.get('[data-test-subj="notebook-notebook-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Duplicate notebook').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Duplicate').click();
    cy.wait(delayTime * 3);

    cy.get('[data-test-subj="notebook-notebook-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Rename notebook').click();
    cy.wait(delayTime);
    cy.get('input.euiFieldText[data-autofocus="true"]').type(' (rename)');
    cy.wait(delayTime);
    cy.get('.euiButton__text').last().contains('Rename').click();
    cy.wait(delayTime);
    cy.reload();
    cy.wait(delayTime * 3);

    cy.get('.euiTitle')
      .contains(TEST_NOTEBOOK + ' (copy) (rename)')
      .should('exist');
    cy.get(`a[href="${SAMPLE_URL}"]`).should('have.length.gte', 2);
  });

  it('Deletes paragraphs', () => {
    cy.wait(delayTime * 3);
    cy.get('[data-test-subj="notebook-paragraph-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Delete all paragraphs').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Delete').click();
    cy.wait(delayTime);

    cy.get('.euiTextAlign').contains('No paragraphs').should('exist');
  });

  it('Deletes notebook', () => {
    cy.get('[data-test-subj="notebook-notebook-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Delete notebook').click();
    cy.wait(delayTime);

    cy.get('button.euiButton--danger').should('be.disabled');

    cy.get('input.euiFieldText[placeholder="delete"]').type('delete');
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').click();
    cy.wait(delayTime * 3);

    cy.get('.euiButton__text').contains('Create notebook').should('exist');
  });
});
