/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const workspaceName = 'chatbot-test-workspace';
const question = 'Hello assistant, what are the indices in my cluster?';

const askQuestion = (question) => {
  cy.get('textarea[placeholder="Ask me anything..."]')
    .should('be.visible')
    .and('be.enabled')
    .clear()
    .type(`${question}{enter}`);

  cy.wait('@sendMessage').then((interception) => {
    expect(interception.response.statusCode).to.eq(200);
    expect(interception.response.body).to.have.property('interactions');

    expect(interception.response.body.interactions).to.exist;
    expect(interception.response.body.interactions[0]).to.exist;
    const responseText = interception.response.body.interactions[0].response;
    expect(responseText).to.exist;
    cy.contains(responseText)
      .scrollIntoView()
      .should('exist')
      .and('be.visible');
  });
};

function addChatbotTestCase(url) {
  describe(`Verify chatbot function`, () => {
    let workspaceId;
    before(() => {
      if (
        Cypress.env('WORKSPACE_ENABLED') &&
        Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
      ) {
        cy.deleteWorkspaceByName(workspaceName);
        cy.createDataSourceNoAuth().then(([result]) => {
          expect(result).to.not.be.undefined;
          cy.createWorkspace({
            name: workspaceName,
            settings: {
              permissions: {
                library_write: { users: ['%me%'] },
                write: { users: ['%me%'] },
              },
              dataSources: [result],
            },
          }).then((value) => {
            workspaceId = value;
            cy.wrap(value);
          });
        });
      }
    });

    after(() => {
      if (Cypress.env('WORKSPACE_ENABLED')) {
        cy.deleteWorkspaceByName(workspaceName);
      }
    });

    beforeEach(() => {
      localStorage.setItem('home:welcome:show', 'false');
      localStorage.setItem('home:newThemeModal:show', 'false');
      const workspacePrefix = workspaceId ? `/w/${workspaceId}` : '';
      cy.intercept('POST', `${workspacePrefix}/api/assistant/send_message*`).as(
        'sendMessage'
      );

      cy.visit(
        Cypress.env('WORKSPACE_ENABLED')
          ? `${url}${workspacePrefix}/app/objects`
          : `${url}/app/home`
      );

      cy.openAssistantChatbot();

      cy.get('textarea[placeholder="Ask me anything..."]', { timeout: 60000 })
        .should('be.visible')
        .should('be.enabled');

      cy.startNewAssistantConversation();
    });

    it('should return a response after asking a question', () => {
      askQuestion(question);
    });

    it('should load previous conversation after open the chat bot', () => {
      askQuestion(question);

      cy.get('button[aria-label="toggle chat flyout icon"]')
        .should('be.visible')
        .click();

      cy.get('body').then(($body) => {
        const flyout = $body.find('.llm-chat-flyout');
        if (flyout.length > 0 && flyout.is(':visible')) {
          cy.log(
            'Flyout still visible after close click, proceeding with reopen'
          );
        } else {
          cy.log('Flyout closed successfully or not found');
        }
      });

      cy.get('[aria-label="toggle chat flyout icon"]')
        .should('be.visible')
        .click();

      cy.get('.llm-chat-flyout').should('exist');

      cy.get('.llm-chat-flyout-body')
        .contains(question, { timeout: 60000 })
        .should('exist');
    });
  });
}

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  addChatbotTestCase(Cypress.config().baseUrl);
}
