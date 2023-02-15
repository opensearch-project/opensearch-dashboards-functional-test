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
  BASE_PATH,
} from '../../../utils/constants';

const moveToEventsHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/event_analytics/`);
  cy.wait(delayTime * 3);
};

const moveToPanelHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/operational_panels/`);
  cy.wait(delayTime * 3);
};

describe('Adding sample visualization', () => {
  it('Add sample observability data', () => {
    moveToPanelHome();
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(100);
    cy.get('.euiContextMenuItem__text')
      .contains('Add samples')
      .trigger('mouseover')
      .click();
    cy.wait(100 * 3);
    cy.get('.euiModalHeader__title[data-test-subj="confirmModalTitleText"]')
      .contains('Add samples')
      .should('exist');
    cy.wait(100);
    cy.get('.euiButton__text').contains('Yes').trigger('mouseover').click();
    cy.get('.euiTableCellContent', { timeout: delayTime })
      .contains(SAMPLE_PANEL)
      .should('exist');
    cy.wait(100);
  });
});

describe('Testing notebooks table', () => {
  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/observability-dashboards#/notebooks`);
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
    cy.get('.euiTextColor')
      .contains('Visualization is required.')
      .should('exist');

    cy.get('.euiButton__text').contains('Browse').click();
    cy.wait(delayTime);
    cy.get('.euiFieldSearch')
      .focus()
      .type('[Flights] Flight Count and Average Ticket Price{enter}');
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

    cy.get('b').contains(
      'select * from opensearch_dashboards_sample_data_flights limit 20'
    );

    cy.get('.euiDataGrid__overflow').should('exist');
  });

  it('Adds an observability visualization paragraph', () => {
    cy.contains('Add paragraph').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Visualization').click();
    cy.wait(delayTime);

    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);
    cy.get('.euiTextColor')
      .contains('Visualization is required.')
      .should('exist');

    cy.get('.euiButton__text').contains('Browse').click();
    cy.wait(delayTime);
    cy.get('.euiFieldSearch')
      .focus()
      .type('[Logs] Count total requests by tags{enter}');
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Select').click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Run').click();
    cy.wait(delayTime);
    cy.get('h5')
      .contains('[Logs] Count total requests by tags')
      .should('exist');
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

  it('Runs all paragraphs', () => {
    cy.wait(delayTime * 3); // need to wait for paragraphs to load first
    cy.get('[data-test-subj="notebook-paragraph-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Run all paragraphs').click();
    cy.wait(delayTime);

    cy.get(`a[href="${SAMPLE_URL}"]`).should('exist');
  });

  it('Deletes paragraphs', () => {
    cy.wait(delayTime * 3);
    cy.get('[data-test-subj="notebook-paragraph-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text')
      .contains('Delete all paragraphs')
      .click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Delete').click();
    cy.wait(delayTime);

    cy.get('.euiTextAlign').contains('No paragraphs').should('exist');
  });

  it('Cleans up test notebooks', () => {
    cy.get('[data-test-subj="notebook-notebook-actions-button"]').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text').contains('Delete notebook').click();
    cy.wait(delayTime);

    cy.get('button.euiButton--danger').should('be.disabled');

    cy.get('input.euiFieldText[placeholder="delete"]').type('delete');
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').click();
    cy.wait(delayTime * 3);

    cy.get('.euiText').contains('No notebooks').should('exist');
  });
});

describe('clean up all test data', () => {
  it('Delete visualizations from event analytics', () => {
    moveToEventsHome();
    cy.get('[data-test-subj="tablePaginationPopoverButton"]')
      .trigger('mouseover')
      .click();
    cy.get('.euiContextMenuItem__text')
      .contains('50 rows')
      .trigger('mouseover')
      .click();
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]')
      .trigger('mouseover')
      .click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text')
      .contains('Delete')
      .trigger('mouseover')
      .click();
    cy.wait(delayTime);
    cy.get('button.euiButton--danger').should('be.disabled');
    cy.get('input.euiFieldText[placeholder="delete"]').focus().type('delete', {
      delayTime: 50,
    });
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').trigger('mouseover').click();
    cy.wait(delayTime);
    cy.get('.euiTextAlign')
      .contains('No Queries or Visualizations')
      .should('exist');
  });

  it('Deletes test panel', () => {
    moveToPanelHome();
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]')
      .trigger('mouseover')
      .click();
    cy.wait(delayTime);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delayTime);
    cy.get('.euiContextMenuItem__text')
      .contains('Delete')
      .trigger('mouseover')
      .click();
    cy.wait(delayTime);
    cy.get('button.euiButton--danger').should('be.disabled');
    cy.get('input.euiFieldText[placeholder="delete"]').focus().type('delete', {
      delayTime: 50,
    });
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').trigger('mouseover').click();

    cy.get('.euiTextAlign').contains('No Operational Panels').should('exist');
  });
});
