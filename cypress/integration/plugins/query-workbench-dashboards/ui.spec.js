/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { edit } from 'brace';
import {
  files,
  QUERY_WORKBENCH_DELAY,
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
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text[title=PPL]').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
  });

  it('Confirm results are empty', () => {
    cy.get('.euiTextAlign')
      .contains('Enter a query in the query editor above to see results.')
      .should('have.length', 1);
  });

  it('Test Run button', () => {
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('source=accounts | sort firstname', { force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text').contains('Run').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiTab__content').contains('Events').click({ force: true });

    cy.contains('Abbott');
  });

  it('Test Clear button', () => {
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('source=accounts', { force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text').contains('Run').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiTab__content').contains('Events').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text').contains('Clear').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);

    cy.get('.euiTextAlign')
      .contains('Enter a query in the query editor above to see results.')
      .should('have.length', 1);
    cy.get('.ace_content')
      .eq(0)
      .then((queryEditor) => {
        const editor = edit(queryEditor[0]);
        expect(editor.getValue()).to.equal('');
      });
  });

  it('Test full screen view', () => {
    cy.get('.euiButton__text').contains('Full screen view').should('not.exist');

    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('source=accounts', { force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text').contains('Run').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY * 5);
    cy.get('.euiButton__text')
      .contains('Full screen view')
      .click({ force: true });

    cy.get('button#exit-fullscreen-button').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text').contains('Full screen view').should('exist');
  });
});

describe('Test SQL UI', () => {
  beforeEach(() => {
    cy.visit('app/opensearch-query-workbench');
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text[title=SQL]').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
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
      .type('{enter}select * from accounts where balance > 49500;', {
        force: true,
      });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text').contains('Run').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiTab__content').contains('accounts').click({ force: true });

    cy.get('input.euiFieldSearch').type('marissa');
    cy.contains('803');
  });

  it('Test Translate button', () => {
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('{selectall}{backspace}', { force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type(
        '{selectall}{backspace}select log(balance) from accounts where abs(age) > 20;',
        {
          force: true,
        }
      );
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text').contains('Explain').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);

    cy.contains('OpenSearchQueryRequest(indexName=accounts');
  });

  it('Test Clear button', () => {
    cy.get('.euiButton__text').contains('Clear').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);

    cy.get('.ace_content')
      .eq(0)
      .then((queryEditor) => {
        const editor = edit(queryEditor[0]);
        expect(editor.getValue()).to.equal('');
      });
  });

  it('Test full screen view', () => {
    cy.get('.euiButton__text').contains('Full screen view').should('not.exist');

    cy.get('.euiButton__text').contains('Run').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY * 5);
    cy.get('.euiButton__text')
      .contains('Full screen view')
      .click({ force: true });
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
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text[title=SQL]').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type('{selectall}{backspace}', { force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
  });

  testQueries.map(({ title, query, cell_idx, expected_string }) => {
    it(title, () => {
      cy.get('textarea.ace_text-input')
        .eq(0)
        .focus()
        .type(`{selectall}{backspace}${query}`, { force: true });
      cy.wait(QUERY_WORKBENCH_DELAY);
      cy.get('.euiButton__text').contains('Run').click({ force: true });
      cy.wait(QUERY_WORKBENCH_DELAY);

      cy.get('span.euiTableCellContent__text')
        .eq(cell_idx)
        .should((cell) => {
          expect(cell).to.contain(expected_string);
        });
    });
  });

  it('Test nested fields display', () => {
    cy.get('textarea.ace_text-input')
      .eq(0)
      .focus()
      .type(`{selectall}{backspace}select * from employee_nested;`, {
        force: true,
      });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.get('.euiButton__text').contains('Run').click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);

    cy.get('button.euiLink').eq(2).click({ force: true });
    cy.wait(QUERY_WORKBENCH_DELAY);
    cy.contains('message');
  });
});
