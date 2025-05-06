/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  describe('Assistant basic spec', () => {
    before(() => {
      cy.setDefaultDataSourceForAssistant();
      // Set welcome screen tracking to false
      localStorage.setItem('home:welcome:show', 'false');
      // Set new theme modal to false
      localStorage.setItem('home:newThemeModal:show', 'false');
    });

    after(() => {
      cy.clearDataSourceForAssistant();
    });

    beforeEach(() => {
      // Visit ISM OSD
      cy.visit(`${BASE_PATH}/app/home`);

      cy.get(`button[aria-label="toggle chat flyout icon"]`, {
        timeout: 60000,
      }).should('be.length', 1);
    });

    describe('Interact with Agent framework', () => {
      it('toggle Chatbot and enable to interact', () => {
        // The header may render multiple times, wait for UI to be stable
        cy.wait(5000);

        // enable to toggle and show Chatbot
        cy.get(`button[aria-label="toggle chat flyout icon"]`).click();

        // click suggestions to generate response
        cy.contains('What are the indices in my cluster?').click();

        // should have a LLM Response
        cy.contains(
          'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
        );

        // should have a suggestion section
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 1);
        cy.contains('suggestion1');

        // Click regenerate button
        cy.get(`[aria-label="regenerate message"]`).click();

        // The previous message and the regenerate button should be gone
        cy.get(`[aria-label="regenerate message"]`).should('be.length', 0);

        // suggestions should be gone
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 0);

        // The regenrate message should be there
        cy.contains(
          'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
        );

        // should have a suggestion section
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 1);
        cy.contains('suggestion2');
      });
    });
  });
}
