/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  files,
  testDataSet,
  testQueries,
  verifyDownloadData,
} from '../../../utils/constants';

describe('Dump test data', () => {
  it('Indexes test data for SQL and PPL', () => {
    const dumpDataSet = (url, index) =>
      cy.request(url).then((response) => {
        cy.request({
          method: 'POST',
          form: false,
          url: 'api/console/proxy',
          headers: {
            'content-type': 'application/json;charset=UTF-8',
            'osd-xsrf': true,
          },
          qs: {
            path: `${index}/_bulk`,
            method: 'POST',
          },
          body: response.body,
        });
      });

    testDataSet.forEach(({ url, index }) => dumpDataSet(url, index));
  });
});

describe('Test PPL UI', () => {
  beforeEach(() => {
    cy.visit('app/opensearch-query-workbench');
    cy.wait(1000);
    cy.get('[data-test-subj="PPL"]').click({ force: true });
    cy.wait(1000);
  });

  it('Test Run button', () => {
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('source=accounts', { force: true });
    cy.get('button[data-test-subj="pplRunButton"]').contains('Run').click();
    cy.get('.euiTab__content').contains('Events').click({ force: true });

    cy.get('.euiTableRow').contains('Nanette').should('exist');
  });

  it('Test Clear button', () => {
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('search source=.kibana', { force: true });
    cy.get('button[data-test-subj="pplRunButton"]').contains('Run').click();
    cy.get('.euiTab__content').contains('Events').click({ force: true });
    cy.get('button[data-test-subj="pplClearButton"]')
      .contains('Clear')
      .click({ force: true });

    cy.get('.euiTitle').should('not.exist');
  });

  it('Test full screen view', () => {
    cy.get('.euiButton__text').contains('Full screen view').should('not.exist');

    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('search source=.kibana', { force: true });
    cy.get('button[data-test-subj="pplRunButton"]').contains('Run').click();
    cy.get('button[data-test-subj="fullScreenView"]')
      .contains('Full screen view')
      .click();

    cy.get('.euiTitle').should('not.exist');
  });
});

describe('Test SQL UI', () => {
  beforeEach(() => {
    cy.visit('app/opensearch-query-workbench');
    cy.wait(1000);
    cy.get('[data-test-subj="SQL"]').click({ force: true });
    cy.wait(1000);
  });

  it('Confirm results are empty', () => {
    cy.get('.euiTextAlign')
      .contains('Enter a query in the query editor above to see results.')
      .should('have.length', 1);
  });

  it('Test Run button and field search', () => {
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('{enter}', { force: true });
    cy.get('button[data-test-subj="sqlRunButton"]').contains('Run').click();
    cy.get('.euiTab__content')
      .contains("SHOW tables LIKE '%'")
      .click({ force: true });
  });

  it('Test Translate button', () => {
    cy.get('textarea.ace_text-input').eq(0).focus().type('{enter}', {
      force: true,
    });
    cy.get('.euiButton__text').contains('Explain').click({ force: true });

    // hard to get euiCodeBlock content, check length instead
    cy.get('.euiCodeBlock__code').children().should('have.length', 25);
  });

  it('Test Clear button', () => {
    cy.get('button[data-test-subj="sqlClearButton"]')
      .contains('Clear')
      .click({ force: true });

    cy.get('.euiTitle').should('not.exist');
  });

  it('Test full screen view', () => {
    cy.get('.euiButton__text').contains('Full screen view').should('not.exist');

    cy.get('button[data-test-subj="sqlRunButton"]').contains('Run').click();
    cy.get('button[data-test-subj="fullScreenView"]')
      .contains('Full screen view')
      .click();

    cy.get('.euiTitle').should('not.exist');
  });
});

describe('Test and verify SQL downloads', () => {
  verifyDownloadData.map(({ title, url, file }) => {
    it(title, () => {
      cy.request({
        method: 'POST',
        form: false,
        url: url,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        body: {
          query:
            'select * from accounts where balance > 49500 order by account_number',
        },
      }).then((response) => {
        expect(response.body.data.resp).to.have.string(files[file]);
      });
    });
  });
});

describe('Test table display', () => {
  beforeEach(() => {
    cy.visit('app/opensearch-query-workbench');
    cy.wait(1000);
    cy.get('[data-test-subj="SQL"]').click({ force: true });
    cy.wait(1000);
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('{selectall}{backspace}', { force: true });
    cy.wait(1000);
  });

  testQueries.map(({ title, query, cell_idx, expected_string }) => {
    it(title, () => {
      cy.get('button[data-test-subj="sqlClearButton"]')
        .contains('Clear')
        .click();
      cy.get('div[data-test-subj="sqlCodeEditor"]')
        .click({ force: true })
        .type(`{selectall}{backspace}${query}`);
      cy.get('div[data-test-subj="sqlCodeEditor"]')
        .contains(`${query}`)
        .should('exist');
      cy.get('button[data-test-subj="sqlRunButton"]').contains('Run').click();
      cy.get('button[data-test-subj="sqlRunButton"]').contains('Run').click();
      // cy.get('.euiTab__content').contains('employee_nested').should('exist');
      cy.get('span.euiTableCellContent__text')
        .eq(cell_idx)
        .should((cell) => {
          expect(cell).to.contain(expected_string);
        });
    });
  });

  it('Test nested fields display', () => {
    cy.get('button[data-test-subj="sqlClearButton"]').contains('Clear').click();
    cy.get('div[data-test-subj="sqlCodeEditor"]')
      .click()
      .type(`{selectall}{backspace}select * from employee_nested;`);
    cy.get('button[data-test-subj="sqlRunButton"]').contains('Run').click();
    cy.get('button[data-test-subj="sqlRunButton"]').contains('Run').click();
    cy.get('.euiTab__content').contains('employee_nested').should('exist');
    cy.get('button.euiLink').eq(2).click();
    cy.contains('message');
  });
});
