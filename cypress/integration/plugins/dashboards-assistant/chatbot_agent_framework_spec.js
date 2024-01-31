/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  describe('Assistant basic spec', () => {
    before(() => {
      // Set welcome screen tracking to false
      localStorage.setItem('home:welcome:show', 'false');
      // Set new theme modal to false
      localStorage.setItem('home:newThemeModal:show', 'false');
    });

    beforeEach(() => {
      // Visit ISM OSD
      cy.visit(`${BASE_PATH}/app/home`);

      // Common text to wait for to confirm page loaded, give up to 60 seconds for initial load
      cy.get(`input[placeholder="Ask question"]`, { timeout: 60000 }).should(
        'be.length',
        1
      );
    });

    describe('Interact with Agent framework', () => {
      it('toggle Chatbot and enable to interact', () => {
        // input question
        cy.wait(1000);
        cy.get(`input[placeholder="Ask question"]`)
          .click()
          .type('What are the indices in my cluster?{enter}');

        // should have a LLM Response
        cy.contains(
          'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
        );

        // should have a suggestion section
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 1);

        // Click regenerate button
        cy.get(`button[title="regenerate message"]`).click();

        // The previous message should be gone
        cy.get(`button[title="regenerate message"]`).should('be.length', 0);

        // suggestions should be gone
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 0);

        // wait for 1 second
        cy.wait(1000);

        // The regenrate message should be there
        cy.contains(
          'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
        );

        // should have a suggestion section
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 1);
      });
    });
  });
}
