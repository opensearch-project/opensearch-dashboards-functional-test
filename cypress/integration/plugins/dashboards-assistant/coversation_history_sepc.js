/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';
import '@cypress/skip-test/support';

const conversations = [];
const constructConversations = () => {
  cy.sendMessage({
    input: {
      type: 'input',
      content: 'What are the indices in my cluster?',
      contentType: 'text',
    },
  }).then((result) => {
    if (result.status !== 200) {
      throw result.body;
    }
    conversations.push(result.body);
  });
};

const clearConversations = () =>
  conversations.map(({ conversationId }) =>
    cy.deleteConversation(conversationId)
  );

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  describe('Assistant conversation history spec', () => {
    before(() => {
      // Set welcome screen tracking to false
      localStorage.setItem('home:welcome:show', 'false');
      // Hide new theme modal
      localStorage.setItem('home:newThemeModal:show', 'false');
      // Visit OSD
      cy.visit(`${BASE_PATH}/app/home`);
      // Common text to wait for to confirm page loaded, give up to 60 seconds for initial load
      cy.get(`input[placeholder="Ask question"]`, { timeout: 60000 }).should(
        'be.length',
        1
      );

      // Open chat flyout
      cy.get('body')
        .then(($body) => $body.find('.llm-chat-flyout').length !== 0)
        .then((chatFlyoutOpened) => {
          if (!chatFlyoutOpened) {
            cy.get('img[aria-label="toggle chat flyout icon"]').click();
          }
        });
    });
    after(() => {
      // Close Chat bot
      cy.get('body')
        .then(($body) => $body.find('.llm-chat-flyout').length !== 0)
        .then((chatFlyoutOpened) => {
          if (chatFlyoutOpened) {
            cy.get('img[aria-label="toggle chat flyout icon"]').click();
          }
        });
    });
    describe('panel operations', () => {
      it('should show created conversation in the history list', () => {
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();

        cy.get('.llm-chat-flyout').contains('Conversations');
        conversations.forEach(({ conversationId }) => {
          cy.get(
            `div[data-test-subj="chatHistoryItem-${conversationId}"]`
          ).should('exist');
        });
        cy.contains('What are the indices in my cluster?');
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();
      });

      it('should toggle history list', () => {
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();
        cy.get('.llm-chat-flyout-body')
          .contains('Conversations')
          .should('be.visible');

        cy.get('.llm-chat-flyout button[aria-label="history"]').click();
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

      it('should hide back button in fullscreen mode', () => {
        cy.get('.llm-chat-flyout button[aria-label="fullScreen"]').click();
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();

        cy.get('.llm-chat-flyout')
          .contains('Conversations')
          .should('be.visible');
        cy.get('textarea[placeholder="Ask me anything..."]').should('exist');
        cy.get('.llm-chat-flyout-body')
          .contains('Back', { timeout: 3000 })
          .should('not.exist');

        // Back to default mode
        cy.get('.llm-chat-flyout button[aria-label="fullScreen"]').click();
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();
      });
    });
    describe('history item operations', () => {
      before(() => {
        // Create conversations data
        constructConversations();
      });

      after(() => {
        // Clear created conversations in tests
        clearConversations();
      });

      it('should load conversation in chat panel', () => {
        cy.skipOn(conversations.length === 0);
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();

        const conversationToLoad = conversations[0];

        cy.get(
          `div[data-test-subj="chatHistoryItem-${conversationToLoad.conversationId}"]`
        )
          .contains(conversationToLoad.title)
          .click();
        cy.get('textarea[placeholder="Ask me anything..."]').should('exist');
        cy.get('div.llm-chat-bubble-panel-input').contains(
          conversationToLoad.title
        );
      });

      it('should able to update conversation title', () => {
        cy.skipOn(conversations.length === 0);
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();

        const conversationToUpdate = conversations[0];
        const newTitle = 'New title';

        cy.get(
          `div[data-test-subj="chatHistoryItem-${conversationToUpdate.conversationId}"] button[aria-label="Edit conversation name"]`
        ).click();
        cy.contains('Edit conversation name');

        cy.get('input[aria-label="Conversation name input"').type(newTitle);
        cy.get('button[data-test-subj="confirmModalConfirmButton"]')
          .contains('Confirm name')
          .click();

        conversationToUpdate.title = newTitle;
        cy.get(
          `div[data-test-subj="chatHistoryItem-${conversationToUpdate.conversationId}"]`
        ).contains(conversationToUpdate.title);
        cy.contains('Edit conversation name', { timeout: 3000 }).should(
          'not.exist'
        );

        // Reset to chat panel
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();
      });

      it('should able to delete conversation', () => {
        cy.skipOn(conversations.length === 0);
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();

        const conversationToDelete = conversations[0];

        cy.get(
          `div[data-test-subj="chatHistoryItem-${conversationToDelete.conversationId}"] button[aria-label="Delete conversation"]`
        ).click();
        cy.get('div[data-test-subj="confirmModalTitleText"]').contains(
          'Delete conversation'
        );

        cy.get('button[data-test-subj="confirmModalConfirmButton"]')
          .contains('Delete conversation')
          .click();

        cy.get(
          `div[data-test-subj="chatHistoryItem-${conversationToDelete.conversationId}"]`
        ).should('not.exist');
        conversations.shift();

        // Reset to chat panel
        cy.get('.llm-chat-flyout button[aria-label="history"]').click();
      });
    });
  });
}
