/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  delayTime,
  TEST_NOTEBOOK,
  SAMPLE_URL,
  SQL_QUERY_TEXT,
  PPL_QUERY_TEXT,
  BASE_PATH,
} from '../../../utils/constants';

const moveToTestNotebook = () => {
  cy.visit(`${BASE_PATH}/app/observability-notebooks#/`, {
    timeout: delayTime * 3,
  });
  cy.get('.euiTableCellContent')
    .contains(TEST_NOTEBOOK, {
      timeout: delayTime * 3,
    })
    .click();
};

describe('Testing paragraphs', () => {
  beforeEach(() => {
    moveToTestNotebook();
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
