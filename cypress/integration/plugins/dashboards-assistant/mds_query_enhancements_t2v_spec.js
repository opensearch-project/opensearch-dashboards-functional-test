/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const createWorkspaceWithEcommerceData = () => {
  const workspaceName = `test_workspace_analytics_${Math.random()
    .toString(36)
    .substring(7)}`;

  return cy
    .createDataSourceNoAuth()
    .then((result) => {
      const dataSourceId = result[0];
      return cy
        .createWorkspace({
          name: workspaceName,
          description: 'Workspace for cypress testing',
          features: ['use-case-all'],
          settings: {
            permissions: {
              library_write: { users: ['%me%'] },
              write: { users: ['%me%'] },
            },
            dataSources: [dataSourceId],
          },
        })
        .then((workspaceId) => ({
          workspaceId,
          dataSourceId,
        }));
    })
    .then(({ workspaceId, dataSourceId }) =>
      cy
        .loadSampleDataForWorkspace('ecommerce', workspaceId, dataSourceId)
        .then(() =>
          cy.wrap({
            workspaceId,
            dataSourceId,
          })
        )
    );
};

const inputNaturalLanguage = () => {
  // type natural language
  cy.get(
    'input[placeholder="Generate visualization with a natural language question."]'
  )
    .should('be.visible')
    .should('be.enabled')
    .type('give me number of visitors group by week{enter}');

  // should have a text2vega response
  cy.wait('@text2vega').then((interception) => {
    expect(interception.response.statusCode).to.eq(200);
    expect(interception.response.body).to.have.property('encoding');
    expect(interception.response.body).to.have.property('title');
    expect(interception.response.body).to.have.property('mark');

    const responseTitle = interception.response.body.title;
    expect(responseTitle).to.exist;

    cy.get('.text2viz-canvas')
      .should('exist')
      .and('be.visible')
      .within(() => {
        cy.get('.visualize.panel-content').should(
          'have.attr',
          'data-title',
          responseTitle
        );
        cy.get('canvas.marks').should('exist').and('be.visible');
      });
  });

  // should show visualization
  cy.get('.text2viz-canvas', { timeout: 60000 })
    .should('exist')
    .and('be.visible');
};

function textToVisualizationTestCases(url) {
  describe('Text to visualization', () => {
    let workspaceId = '';
    let dataSourceId = '';
    before(() => {
      createWorkspaceWithEcommerceData().then((result) => {
        workspaceId = result.workspaceId;
        dataSourceId = result.dataSourceId;
      });
    });

    beforeEach(() => {
      cy.intercept('POST', `/w/${workspaceId}/api/assistant/text2vega*`).as(
        'text2vega'
      );

      cy.visit(`${url}/w/${workspaceId}/app/visualize`);

      cy.getElementByTestId('createVisualizationButton', { timeout: 60000 })
        .should('exist')
        .and('be.visible')
        .and('be.enabled')
        .click();
      cy.getElementByTestId('visType-text2viz')
        .should('exist')
        .and('be.visible')
        .click();

      cy.url().should('include', `/app/text2viz`);
      cy.contains(/Get started/).should('be.visible');
      cy.contains(/New visualization/).should('be.visible');
    });

    after(() => {
      if (workspaceId) {
        if (dataSourceId) {
          cy.removeSampleDataForWorkspace(
            'ecommerce',
            workspaceId,
            dataSourceId
          );
        }
        cy.deleteWorkspaceById(workspaceId);
      }
      if (dataSourceId) {
        cy.deleteDataSource(dataSourceId);
      }
    });

    it('should create a visualization using natural language', () => {
      inputNaturalLanguage();
    });

    it('should test different visualization types with natural language', () => {
      inputNaturalLanguage();

      cy.contains('Edit visual').should('exist').and('be.visible').click();
      cy.getElementByTestId('text2vizStyleEditorModal')
        .should('exist')
        .within(() => {
          cy.contains(/How would you like to edit the visual?/);
          cy.get('[aria-label="Input instructions to tweak the visual"]')
            .should('be.visible')
            .clear()
            .type('give me a pie chart');
          cy.contains('button', 'Apply').should('be.enabled').click();
        });

      // should have a text2vega response
      cy.wait('@text2vega').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body).to.have.property('title');

        // should generate a pie chart
        if (interception.response.body.layer) {
          expect(interception.response.body).to.have.property('layer');
          expect(interception.response.body.layer[0]).should(
            'not.be.undefined'
          );
          expect(interception.response.body.layer[0].mark).to.eq('arc');
        } else {
          expect(interception.response.body).to.have.property('mark');
          expect(interception.response.body.mark).to.eq('arc');
        }

        const responseTitle = interception.response.body.title;
        expect(responseTitle).to.exist;

        cy.get('.text2viz-canvas')
          .should('exist')
          .and('be.visible')
          .within(() => {
            cy.get('.visualize.panel-content').should(
              'have.attr',
              'data-title',
              responseTitle
            );
            cy.get('canvas.marks').should('exist').and('be.visible');
          });
      });
    });
  });
}

if (
  Cypress.env('WORKSPACE_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED') &&
  Cypress.env('CYPRESS_WORKSPACE_ENABLED') &&
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')
) {
  textToVisualizationTestCases(Cypress.config().baseUrl);
}
