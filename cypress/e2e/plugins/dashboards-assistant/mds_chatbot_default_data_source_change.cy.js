/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const manualSetDefaultDataSource = (dataSourceTitle) => {
  // Go to data source list
  cy.getElementByTestId('dataSources').click();

  cy.wait(1000);

  // Goto data source detail page
  cy.contains(dataSourceTitle).click();

  if (
    cy.getElementByTestId('editSetDefaultDataSource').contains('Set as default')
  ) {
    cy.wait(2000);
    cy.getElementByTestId('editSetDefaultDataSource').click();
  }
  // Back to data source list
  cy.getElementByTestId('dataSources').click();
};

const openChatBotAndSendMessage = () => {
  cy.wait(5000);

  // enable to toggle and show Chatbot
  cy.get(`button[aria-label="toggle chat flyout icon"]`).click();

  // click suggestions to generate response
  cy.contains('What are the indices in my cluster?').click();

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
    beforeEach(function () {
      cy.deleteAllDataSources();
      // create default data source
      cy.createDataSourceNoAuth({ title: 'DefaultDataSource' }).then(
        ([dataSourceId]) => cy.setDefaultDataSource(dataSourceId)
      );
      // create new data source
      cy.createDataSourceNoAuth({ title: 'NewDataSource' }).as('newDataSource');

      // Wait 3s for data source created
      cy.wait(3000);

      cy.visit('/app/management/opensearch-dashboards/dataSources');
      cy.waitForLoader();
    });

    it('should reload history with new data source id', function () {
      // The header may render multiple times, wait for UI to be stable
      cy.wait(5000);
      // enable to toggle and show Chatbot
      cy.get(`button[aria-label="toggle chat flyout icon"]`).click();
      cy.get('.llm-chat-flyout button[aria-label="history"]')
        .should('be.visible')
        .click();

      cy.intercept('GET', '/api/assistant/conversations**').as(
        'loadConversationsRequest'
      );

      manualSetDefaultDataSource(this.newDataSource[1]);

      cy.wait('@loadConversationsRequest').then(({ request }) => {
        expect(request.url).contains(this.newDataSource[0]);
      });
    });

    it('should not reset to chat tab after data source change in history page', function () {
      openChatBotAndSendMessage();

      cy.get('.llm-chat-flyout button[aria-label="history"]')
        .should('be.visible')
        .click();

      manualSetDefaultDataSource(this.newDataSource[1]);

      // Should reset conversation and stay history page
      cy.get('h3').contains('OpenSearch Assistant').should('be.visible');
      cy.get('h3').contains('Conversations').should('be.visible');
    });

    it('should reset chat conversation after data source changed', function () {
      openChatBotAndSendMessage();

      manualSetDefaultDataSource(this.newDataSource[1]);

      // Should reset chat
      cy.get('h3').contains('OpenSearch Assistant').should('be.visible');
      cy.get('[aria-label="chat message bubble"]').should('have.length', 1);
    });

    it('should reset chat tab after data source changed in trace page', function () {
      openChatBotAndSendMessage();
      // click view trace button
      cy.get(`[aria-label="How was this generated?"]`).click();
      cy.contains('How was this generated').should('be.visible');

      manualSetDefaultDataSource(this.newDataSource[1]);

      // Should reset chat tab
      cy.get('#how-was-this-generated').should('not.exist');
      cy.get('h3').contains('OpenSearch Assistant').should('be.visible');
    });

    after(() => {
      cy.deleteAllDataSources();
    });
  });
}
