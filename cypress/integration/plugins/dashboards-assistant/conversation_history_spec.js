/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';
import { setStorageItem } from '../../../utils/plugins/dashboards-assistant/helpers';
import { testHistoryItemOperations } from '../../../utils/plugins/dashboards-assistant/shared/conversation_history';

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  describe('Assistant conversation history spec', () => {
    let restoreShowHome;
    let restoreNewThemeModal;

    before(() => {
      // Set welcome screen tracking to false
      restoreShowHome = setStorageItem(
        localStorage,
        'home:welcome:show',
        'false'
      );
      // Hide new theme modal
      restoreNewThemeModal = setStorageItem(
        localStorage,
        'home:newThemeModal:show',
        'false'
      );
      // Visit OSD
      cy.visit(`${BASE_PATH}/app/home`);
      // Common text to wait for to confirm page loaded, give up to 60 seconds for initial load
      cy.get(`input[placeholder="Ask question"]`, { timeout: 60000 }).should(
        'be.length',
        1
      );

      // Open assistant flyout
      // The flyout button will be detached and can't be clicked, add 10s delayed fix it.
      cy.wait(10000);
      cy.get('img[aria-label="toggle chat flyout icon"]').click();
    });
    after(() => {
      if (restoreShowHome) {
        restoreShowHome();
      }
      if (restoreNewThemeModal) {
        restoreNewThemeModal();
      }
      // Close assistant flyout
      cy.get('img[aria-label="toggle chat flyout icon"]').click();
    });

    beforeEach(() => {
      cy.get('.llm-chat-flyout', { timeout: 60000 }).should('be.visible');
    });

    describe('panel operations', () => {
      it('should toggle history list', () => {
        cy.get('.llm-chat-flyout button[aria-label="history"]')
          .should('be.visible')
          .click();
        cy.get('.llm-chat-flyout-body')
          .contains('Conversations')
          .should('be.visible');

        cy.get('.llm-chat-flyout button[aria-label="history"]')
          .should('be.visible')
          .click();
        cy.get('textarea[placeholder="Ask me anything..."]').should('exist');
        cy.get('.llm-chat-flyout-body')
          .contains('Conversations')
          .should('not.be.visible');
      });

      it('should back to chat panel', () => {
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();
        cy.get('.llm-chat-flyout')
          .contains('Conversations')
          .should('be.visible');

        cy.get('.llm-chat-flyout-body').contains('Back').click();
        cy.get('textarea[placeholder="Ask me anything..."]').should('exist');
      });

      it('should hide back button in takeover fullscreen mode', () => {
        //switch to takeover mode for fullscreen
        cy.get('[id="sidecarModeIcon"]').click();
        cy.get(
          '[data-test-subj="sidecar-mode-icon-menu-item-takeover"]'
        ).click();
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();

        cy.get('.llm-chat-flyout')
          .contains('Conversations')
          .should('be.visible');
        cy.get('textarea[placeholder="Ask me anything..."]').should('exist');
        cy.get('.llm-chat-flyout-body')
          .contains('Back', { timeout: 3000 })
          .should('not.exist');

        // Switch to default docked right mode
        cy.get('[id="sidecarModeIcon"]').click();
        cy.get('[data-test-subj="sidecar-mode-icon-menu-item-right"]').click();
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();
      });
    });
    describe('history item operations', () => {
      testHistoryItemOperations();
    });
  });
}
