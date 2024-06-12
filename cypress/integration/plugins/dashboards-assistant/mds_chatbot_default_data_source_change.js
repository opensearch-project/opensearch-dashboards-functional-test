/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const manualSetDefaultDataSource = (dataSourceTitle) => {
  // Goto data source detail page
  cy.contains(dataSourceTitle).click();
  if (
    cy.getElementByTestId('editSetDefaultDataSource').contains('Set as default')
  ) {
    cy.getElementByTestId('editSetDefaultDataSource').click();
  }
  // Back to data source list
  cy.getElementByTestId('dataSources').click();
};

const openChatBotAndSendMessage = () => {
  // Common text to wait for to confirm page loaded, give up to 120 seconds for initial load
  cy.get(`input[placeholder="Ask question"]`, { timeout: 120000 }).as(
    'chatInput'
  );
  cy.get('@chatInput').should('be.length', 1);

  cy.wait(1000);

  cy.get('@chatInput').click();

  cy.get('@chatInput').type('What are the indices in my cluster?{enter}');

  // should have a LLM Response
  cy.contains(
    'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.'
  ).should('be.visible');

  // Should have three bubbles
  cy.get('[aria-label="chat message bubble"]').should('have.length', 3);
};

if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  describe('Assistant basic spec', () => {
    let dataSource1;
    let dataSource2;
    before(() => {
      cy.deleteAllDataSources();
      // create data source 1
      cy.createDataSourceNoAuth({ title: 'NoAuthDataSource1' }).then(
        ([id, title]) => {
          dataSource1 = { id, title };
        }
      );
      // create data source 2
      cy.createDataSourceNoAuth({ title: 'NoAuthDataSource2' }).then(
        ([id, title]) => {
          dataSource2 = { id, title };
        }
      );
      cy.visit('/app/management/opensearch-dashboards/dataSources');
      cy.waitForLoader();
    });
    beforeEach(() => {
      manualSetDefaultDataSource(dataSource1.title);
    });

    it('should reload history with new data source id', () => {
      // The header may render multiple times, wait for UI to be stable
      cy.wait(5000);
      // enable to toggle and show Chatbot
      cy.get(`img[aria-label="toggle chat flyout icon"]`).click();
      cy.get('.llm-chat-flyout button[aria-label="history"]')
        .should('be.visible')
        .click();

      cy.intercept('GET', '/api/assistant/conversations**').as(
        'loadConversationsRequest'
      );

      manualSetDefaultDataSource(dataSource2.title);

      cy.wait('@loadConversationsRequest').then(({ request }) => {
        expect(request.url).contains(dataSource2.id);
      });
      // Back to chat tab
      cy.get('.llm-chat-flyout button[aria-label="history"]')
        .should('be.visible')
        .click();
      // Close chat bot
      cy.get(`img[aria-label="toggle chat flyout icon"]`).click();
    });

    it('should not reset to chat tab after data source change in history page', () => {
      openChatBotAndSendMessage();

      cy.get('.llm-chat-flyout button[aria-label="history"]')
        .should('be.visible')
        .click();

      manualSetDefaultDataSource(dataSource2.title);

      // Should reset conversation and stay history page
      cy.get('h3').contains('OpenSearch Assistant').should('be.visible');
      cy.get('h3').contains('Conversations').should('be.visible');

      // Back to chat tab
      cy.get('.llm-chat-flyout button[aria-label="history"]')
        .should('be.visible')
        .click();
      // Close chat bot
      cy.get(`img[aria-label="toggle chat flyout icon"]`).click();
    });

    it('should reset chat conversation after data source changed', () => {
      openChatBotAndSendMessage();

      manualSetDefaultDataSource(dataSource2.title);

      // Should reset chat
      cy.get('h3').contains('OpenSearch Assistant').should('be.visible');
      cy.get('[aria-label="chat message bubble"]').should('have.length', 1);

      //close chat bot
      cy.get(`img[aria-label="toggle chat flyout icon"]`).click();
    });

    it('should reset chat tab after data source changed in trace page', () => {
      openChatBotAndSendMessage();
      // click view trace button
      cy.get(`[aria-label="How was this generated?"]`).click();
      cy.contains('How was this generated').should('be.visible');

      manualSetDefaultDataSource(dataSource2.title);

      // Should reset chat tab
      cy.get('#how-was-this-generated').should('not.exist');
      cy.get('h3').contains('OpenSearch Assistant').should('be.visible');
    });

    after(() => {
      cy.deleteAllDataSources();
    });
  });
}
