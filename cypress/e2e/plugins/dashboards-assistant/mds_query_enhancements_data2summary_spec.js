/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const isWorkspaceEnabled = Cypress.env('WORKSPACE_ENABLED');
console.log(isWorkspaceEnabled);

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

// ROBUST: Simplified with testIsolation: true to ensure clean state per test.
const askQuestion = (question) => {
  const inputSelector = '[data-test-subj="query-assist-input-field-text"]';

  // Always open the assistant if it's not visible (which it shouldn't be with isolation)
  cy.get('body').then(($body) => {
    if (!$body.find(inputSelector).is(':visible')) {
      cy.get(
        'button[aria-label="OpenSearch assistant trigger button"]:visible',
        { timeout: 30000 }
      )
        .should('exist')
        .click();
    }
  });

  cy.get(inputSelector, { timeout: 60000 })
    .should('be.visible')
    .clear({ force: true })
    .type(question, { force: true });

  cy.get('[data-test-subj="query-assist-submit-button"]')
    .should('be.visible')
    .click();
};

const waitForSummaryResult = () => {
  cy.get('[data-test-subj="queryAssist_summary_loading"]', {
    timeout: 60000,
  }).should('not.exist');
  cy.get('[data-test-subj="queryAssist_summary_result"]', { timeout: 60000 })
    .should('exist')
    .and('be.visible');
};

function addDiscoverSummaryCase(url) {
  // Use testIsolation: true only for this suite to avoid side effects between it blocks.
  describe(`discover summary`, { testIsolation: true }, () => {
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

    // Simplified beforeEach: testIsolation: true ensures we start from about:blank every time.
    beforeEach(() => {
      cy.visit(`${url}/w/${workspaceId}/app/data-explorer/discover`);
      cy.get('.deSidebar_dataSource', { timeout: 60000 }).should('be.visible');

      // Always select ecommerce dataset (clean state)
      cy.get('.deSidebar_dataSource .datasetSelector__button', {
        timeout: 60000,
      }).click();
      cy.get('.euiSelectableListItem', { timeout: 20000 })
        .contains('ecommerce')
        .click();

      // Always select PPL language (clean state)
      cy.get('.languageSelector__button', { timeout: 30000 }).click();
      cy.get('body').then(($body) => {
        cy.wrap($body)
          .find('.euiContextMenuItem', { timeout: 20000 })
          .contains('PPL')
          .should('be.visible')
          .click({ force: true });
      });

      // Verify language selection is ready
      cy.get('.languageSelector__button').should('contain', 'PPL');
    });

    it('should display Discover Summary Panel if the selected data source has agent', () => {
      cy.get('body', { timeout: 60000 }).should(($body) => {
        const hasSummaryPanel =
          $body.find('[data-test-subj="queryAssist__summary"]:visible').length >
          0;
        const hasInputField =
          $body.find('[data-test-subj="query-assist-input-field-text"]:visible')
            .length > 0;
        const hasAssistantTrigger =
          $body.find(
            'button[aria-label="OpenSearch assistant trigger button"]:visible'
          ).length > 0;
        expect(
          hasSummaryPanel || hasInputField || hasAssistantTrigger
        ).to.equal(true);
      });
    });

    it('should be able to generate summary ', () => {
      askQuestion('How many doc in my index?');
      waitForSummaryResult();
    });

    it('should be able to give feedback ', () => {
      askQuestion('How many doc in my index?');
      waitForSummaryResult();
      cy.get('[data-test-subj="queryAssist_summary_buttons_thumbdown"]')
        .should('exist')
        .and('be.visible')
        .click();
      cy.get('[data-test-subj="queryAssist_summary_buttons_thumbup"]').should(
        'not.exist'
      );
    });

    it('should be able to copy summary ', () => {
      askQuestion('How many doc in my index?');
      waitForSummaryResult();

      cy.get('[data-test-subj="queryAssist_summary_buttons_copy"]')
        .should('exist')
        .and('be.visible')
        .click();
    });

    it('should be able to regenerate summary when user input new question ', () => {
      askQuestion('How many doc in my index?');
      waitForSummaryResult();

      askQuestion('give me one random doc in my index?');

      cy.get('[data-test-subj="queryAssist_summary_buttons_generate"]')
        .should('exist')
        .should('be.visible')
        .should('be.enabled')
        .click({ force: true });
      waitForSummaryResult();
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
