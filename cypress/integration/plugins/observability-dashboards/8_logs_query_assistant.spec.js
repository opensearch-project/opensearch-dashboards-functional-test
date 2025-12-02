/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { BASE_PATH, PANELS_TIMEOUT } from '../../../utils/constants';

const isQueryAssistantPPlAgentAvailable = () => {
  return cy
    .request({
      method: 'POST',
      url: '/api/console/proxy?path=_plugins/_ml/config/os_query_assist_ppl&method=GET&dataSourceId=',
      headers: { 'osd-xsrf': true },
      failOnStatusCode: false,
    })
    .then((response) => {
      return !!(
        response &&
        response.body &&
        response.body.configuration &&
        response.body.configuration.agent_id
      );
    });
};

describe('Testing query assistant', () => {
  before(function () {
    isQueryAssistantPPlAgentAvailable().then((isAvailable) => {
      if (!isAvailable) {
        this.skip();
      }
    });
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/observability-logs#`);
  });

  it('Query assistant should work normally', () => {
    cy.get('.euiPageContentHeaderSection', {
      timeout: PANELS_TIMEOUT,
    }).contains('Queries and Visualizations');

    cy.getElementByTestId('eventHomeAction__explorer').click();

    cy.get('.globalQueryBar', { timeout: PANELS_TIMEOUT }).contains(
      'Query Assist'
    );

    cy.getElementByTestId('query-assist-ppl-callout').should('not.exist');

    cy.get('input[placeholder="Ask me a question"]')
      .should('be.visible')
      .clear()
      .type(`How many docs in my index?{esc}`);

    cy.getElementByTestId('splitButton--primary').should('be.visible').click();

    cy.getElementByTestId('query-assist-ppl-callout').should(
      'have.text',
      'PPL query generated'
    );

    cy.getElementByTestId('codeEditorContainer')
      .get('.ace_line')
      .first()
      .should('not.be.empty');
  });
});
