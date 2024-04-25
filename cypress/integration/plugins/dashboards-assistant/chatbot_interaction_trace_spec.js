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

      // Common text to wait for to confirm page loaded, give up to 120 seconds for initial load
      cy.get(`input[placeholder="Ask question"]`, { timeout: 120000 }).as(
        'chatInput'
      );
      cy.get('@chatInput').should('be.length', 1);

      cy.wait(1000);

      cy.get('@chatInput')
        .click()
        .type('What are the indices in my cluster?{enter}');

      // should have a LLM Response
      cy.contains(
        'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
      );
    });

    // clean up localStorage items
    after(() => {
      localStorage.removeItem('home:welcome:show');
      localStorage.removeItem('home:newThemeModal:show');
    });

    describe('Trace page', () => {
      it('open trace page and verify page content', () => {
        // click view trace button
        cy.get(`[aria-label="How was this generated?"]`).click();

        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`).as('tracePage');
        cy.get('@tracePage')
          .find(`button[aria-label="back"]`)
          .should('have.length', 1);

        cy.get('@tracePage')
          .find(`button[aria-label="close"]`)
          .should('have.length', 0);

        // title
        cy.get('@tracePage').contains('h1', 'How was this generated');

        // question
        cy.get('@tracePage').contains('What are the indices in my cluster?');

        // result
        cy.get('@tracePage').contains(
          'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
        );
      });

      it('tools invocation displayed in trace steps', () => {
        // trace
        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`).as('tracePage');
        cy.get('@tracePage').find('.euiAccordion').should('have.length', 3);

        cy.get('@tracePage')
          .find('.euiAccordion')
          // tool name
          .contains('Step 2 - CatIndexTool')
          .click({ force: true });

        // tool output
        cy.contains('row,health,status,index');
      });

      it('trace page display correctly in fullscreen mode', () => {
        // switch to takeover mode for fullscreen
        cy.get('[id="sidecarModeIcon"]').click();
        cy.get(
          '[data-test-subj="sidecar-mode-icon-menu-item-takeover"]'
        ).click();

        // show close button
        cy.get(`.llm-chat-flyout .llm-chat-flyout-body`).as('tracePage');
        cy.get('@tracePage')
          .find(`button[aria-label="close"]`)
          .should('have.length', 1);

        cy.get('@tracePage')
          .find(`button[aria-label="back"]`)
          .should('have.length', 0);

        // both chat and trace are both displayed
        cy.get(`[aria-label="How was this generated?"]`).click();
        // trace page opend
        cy.contains('h1', 'How was this generated');
        // chat page opened
        cy.contains('suggestion1');
      });
    });
  });
}
