/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { BASE_PATH, PANELS_TIMEOUT } from '../../../utils/constants';

// Returns the os_query_assist_ppl config response.
const getQueryAssistantPPLAgentConfig = () => {
  return cy.request({
    method: 'POST',
    url: '/api/console/proxy?path=_plugins/_ml/config/os_query_assist_ppl&method=GET&dataSourceId=',
    headers: { 'osd-xsrf': true },
    failOnStatusCode: false,
  });
};

// Returns the agent id from the config response, or undefined.
const getAgentId = (response) =>
  response &&
  response.body &&
  response.body.configuration &&
  response.body.configuration.agent_id;

describe('Testing query assistant', () => {
  before(function () {
    getQueryAssistantPPLAgentConfig().then((response) => {
      const agentId = getAgentId(response);
      // Managed service always configures the agent, so a missing agent is a failure.
      if (Cypress.env('MANAGED_SERVICE_ENDPOINT')) {
        expect(
          agentId,
          `os_query_assist_ppl agent_id (status ${
            response.status
          }, body ${JSON.stringify(response.body)})`
        ).to.be.a('string').and.not.be.empty;
      } else if (!agentId) {
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
