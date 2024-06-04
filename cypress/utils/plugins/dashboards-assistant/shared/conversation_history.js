/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const testHistoryItemOperations = (dataSourceId) => {
  const conversations = [];

  before(() => {
    // Create conversations data
    cy.sendAssistantMessage(
      {
        input: {
          type: 'input',
          content: 'What are the indices in my cluster?',
          contentType: 'text',
        },
      },
      dataSourceId
    ).then((result) => {
      if (result.status !== 200) {
        throw result.body;
      }
      conversations.push(result.body);
    });
  });

  after(() => {
    // Clear created conversations in tests
    conversations.map(({ conversationId }) =>
      cy.deleteConversation(conversationId, dataSourceId)
    );
  });

  it('should show created conversation in the history list', () => {
    cy.get('.llm-chat-flyout button[aria-label="history"]').click();

    cy.get('.llm-chat-flyout').contains('Conversations');
    conversations.forEach(({ conversationId }) => {
      cy.getElementByTestId(`chatHistoryItem-${conversationId}`).should(
        'exist'
      );
    });
    cy.contains('What are the indices in my cluster?');
    cy.get('.llm-chat-flyout button[aria-label="history"]').click();
  });

  it('should load conversation in chat panel', () => {
    cy.get('.llm-chat-flyout button[aria-label="history"]').click();

    const conversationToLoad = conversations[0];

    cy.getElementByTestId(
      `chatHistoryItem-${conversationToLoad.conversationId}`
    )
      .contains(conversationToLoad.title)
      .click();
    cy.get('textarea[placeholder="Ask me anything..."]').should('exist');
    cy.get('div.llm-chat-bubble-panel-input').contains(
      conversationToLoad.title
    );
  });

  it('should able to update conversation title', () => {
    cy.get('.llm-chat-flyout button[aria-label="history"]').click();

    const conversationToUpdate = conversations[0];
    const newTitle = 'New title';

    cy.getElementByTestId(
      `chatHistoryItem-${conversationToUpdate.conversationId}`
    )
      .find('button[aria-label="Edit conversation name"]')
      .click();
    cy.contains('Edit conversation name');

    cy.get('input[aria-label="Conversation name input"').type(newTitle);
    cy.getElementByTestId('confirmModalConfirmButton')
      .contains('Confirm name')
      .click();

    conversationToUpdate.title = newTitle;
    cy.getElementByTestId(
      `chatHistoryItem-${conversationToUpdate.conversationId}`
    ).contains(conversationToUpdate.title);
    cy.contains('Edit conversation name', { timeout: 3000 }).should(
      'not.exist'
    );

    // Reset to chat panel
    cy.get('.llm-chat-flyout button[aria-label="history"]').click();
  });

  it('should able to delete conversation', () => {
    cy.get('.llm-chat-flyout button[aria-label="history"]').click();

    const conversationToDelete = conversations[0];

    cy.getElementByTestId(
      `chatHistoryItem-${conversationToDelete.conversationId}`
    )
      .find('button[aria-label="Delete conversation"]')
      .click();
    cy.getElementByTestId('confirmModalTitleText').contains(
      'Delete conversation'
    );

    cy.getElementByTestId('confirmModalConfirmButton')
      .contains('Delete conversation')
      .click();

    cy.getElementByTestId(
      `chatHistoryItem-${conversationToDelete.conversationId}`
    ).should('not.exist');
    conversations.shift();

    // Reset to chat panel
    cy.get('.llm-chat-flyout button[aria-label="history"]').click();
  });
};
