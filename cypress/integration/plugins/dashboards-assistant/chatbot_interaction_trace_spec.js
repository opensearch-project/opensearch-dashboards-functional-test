/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  describe('Interaction trace spec', () => {
    before(() => {
      // Set welcome screen tracking to false
      localStorage.setItem('home:welcome:show', 'false');
      // Set new theme modal to false
      localStorage.setItem('home:newThemeModal:show', 'false');

      cy.visit(`${BASE_PATH}/app/home`);
      // cy.waitForLoader();

      // Common text to wait for to confirm page loaded, give up to 60 seconds for initial load
      cy.get(`input[placeholder="Ask question"]`, { timeout: 120000 }).should(
        'be.length',
        1
      );

      cy.get(`input[placeholder="Ask question"]`)
        .focus()
        .type('What are the indices in my cluster?{enter}');

      // should have a LLM Response
      cy.contains(
        'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
      );
    });

    describe('Trace page', () => {
      it('open trace page and verify page content', () => {
        // click How was this generated? to view trace
        cy.contains('How was this generated?').click();

        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`)
          .find(`button[aria-label="back"]`)
          .should('have.length', 1);

        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`)
          .find(`button[aria-label="close"]`)
          .should('have.length', 0);

        // title
        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`).contains(
          'h1',
          'How was this generated'
        );

        // question
        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`).contains(
          'What are the indices in my cluster?'
        );

        // result
        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`).contains(
          'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
        );
      });

      it('tools invocation displayed in trace steps', () => {
        // trace
        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`)
          .find('.euiAccordion')
          .should('have.length', 1);

        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`)
          .find('.euiAccordion')
          // tool name
          .contains('Step 1 - CatIndexTool')
          .click({ force: true });

        // tool output
        cy.contains('Output: health	status	index');
      });

      it('trace page display correctly in fullscreen mode', () => {
        cy.get(`.llm-chat-flyout-header`)
          .find(`button[aria-label="fullScreen"]`)
          .click({ force: true });

        // show close button
        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`)
          .find(`button[aria-label="close"]`)
          .should('have.length', 1);

        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`)
          .find(`button[aria-label="back"]`)
          .should('have.length', 0);

        // both chat and trace are both displayed
        cy.contains('How was this generated?').click();
      });
    });
  });
}
