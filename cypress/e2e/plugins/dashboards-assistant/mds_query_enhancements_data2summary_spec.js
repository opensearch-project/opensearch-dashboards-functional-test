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

const askQuestion = (question) => {
  // Enter the question into the query assistant input box

  cy.getElementByTestId('query-assist-input-field-text')
    .should('exist')
    .then(($input) => {
      // Get the current value
      const content = $input.val();
      if (content) {
        // Clear the input if not empty
        cy.wrap($input).clear({ force: true });
      }
    });

  cy.getElementByTestId('query-assist-input-field-text')
    .should('exist')
    .type(question, { force: true });

  cy.getElementByTestId('query-assist-submit-button').should('exist').click();
};

function addDiscoverSummaryCase(url) {
  describe(`discover summary`, () => {
    let workspaceId = '';
    let dataSourceId = '';
    before(() => {
      createWorkspaceWithEcommerceData().then((result) => {
        workspaceId = result.workspaceId;
        dataSourceId = result.dataSourceId;
      });
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

    beforeEach(() => {
      cy.visit(`${url}/w/${workspaceId}/app/all_overview`);
      cy.getElementByTestId('toggleNavButton', { timeout: 60000 })
        .eq(0)
        .should('exist')
        .should('be.visible')
        .click();

      cy.getElementByTestId('collapsibleNavAppLink-discover')
        .should('exist')
        .and('be.visible')
        .click();
      cy.get('.deSidebar_dataSource .datasetSelector__button')
        .should('exist')
        .and('be.visible')
        .click();

      cy.get('.euiSelectableListItem')
        .should('exist')
        .and('be.visible')
        .first()
        .click();

      cy.get('.languageSelector__button')
        .should('exist')
        .and('be.visible')
        .and('be.enabled')
        .click();
      cy.contains('button', 'PPL').should('exist').and('be.visible').click();
      cy.getElementByTestId('languageReferenceButton')
        .should('exist')
        .and('be.visible')
        .click();
    });

    it('should display Discover Summary Panel if the selected data source has agent', () => {
      cy.getElementByTestId('queryAssist__summary')
        .should('exist')
        .and('be.visible');
    });

    it('should be able to generate summary ', () => {
      askQuestion('How many doc in my index?');
      // loading first
      cy.getElementByTestId('queryAssist_summary_loading')
        .should('exist')
        .then(() => {
          cy.getElementByTestId('queryAssist_summary_loading').should(
            'not.exist'
          );
        });
      // Verify summary is generated
      cy.getElementByTestId('queryAssist_summary_result').should('exist');
    });

    it('should be able to give feedback ', () => {
      askQuestion('How many doc in my index?');
      // loading first
      cy.getElementByTestId('queryAssist_summary_loading')
        .should('exist')
        .then(() => {
          cy.getElementByTestId('queryAssist_summary_loading').should(
            'not.exist'
          );
        });
      // click thumbdown button and once clicked, thumbdown button should not be visible and thumbdown button should be disabled
      cy.getElementByTestId('queryAssist_summary_buttons_thumbdown')
        .should('exist')
        .click();
      cy.getElementByTestId('queryAssist_summary_buttons_thumbup').should(
        'not.exist'
      );
    });

    it('should be able to copy summary ', () => {
      askQuestion('How many doc in my index?');
      // loading first
      cy.getElementByTestId('queryAssist_summary_loading')
        .should('exist')
        .then(() => {
          cy.getElementByTestId('queryAssist_summary_loading').should(
            'not.exist'
          );
        });
      // Verify summary is generated
      cy.getElementByTestId('queryAssist_summary_result').should('exist');

      cy.getElementByTestId('queryAssist_summary_buttons_copy')
        .should('exist')
        .click();
    });

    it('should be able to regenerate summary when user input new question ', () => {
      askQuestion('How many doc in my index?');
      cy.getElementByTestId('queryAssist_summary_loading', { timeout: 60000 })
        .should('exist')
        .then(() => {
          cy.getElementByTestId('queryAssist_summary_loading').should(
            'not.exist'
          );
        });
      // Verify summary is generated
      cy.getElementByTestId('queryAssist_summary_result').should('exist');

      askQuestion('give me one random doc in my index?');

      cy.getElementByTestId('queryAssist_summary_buttons_generate')
        .should('exist')
        .should('be.visible')
        .should('be.enabled')
        .click({ force: true });
      cy.getElementByTestId('queryAssist_summary_loading').should('exist');
      // Verify new summary is generated
      cy.getElementByTestId('queryAssist_summary_result').should('exist');
    });
  });
}

if (
  Cypress.env('WORKSPACE_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED') &&
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')
) {
  addDiscoverSummaryCase(Cypress.config().baseUrl);
}
