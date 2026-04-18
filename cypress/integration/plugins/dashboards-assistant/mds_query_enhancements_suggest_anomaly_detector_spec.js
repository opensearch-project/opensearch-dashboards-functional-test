/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const createWorkspaceWithLogsData = () => {
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
        .loadSampleDataForWorkspace('logs', workspaceId, dataSourceId)
        .then(() =>
          cy.wrap({
            workspaceId,
            dataSourceId,
          })
        )
    );
};

const testSuggestAD = (url) => {
  describe('SuggestAnomalyDetector', () => {
    let workspaceId = '';
    let dataSourceId = '';
    before(() => {
      createWorkspaceWithLogsData().then((result) => {
        workspaceId = result.workspaceId;
        dataSourceId = result.dataSourceId;
      });
    });

    after(() => {
      if (workspaceId) {
        if (dataSourceId) {
          cy.removeSampleDataForWorkspace('logs', workspaceId, dataSourceId);
        }
        cy.deleteWorkspaceById(workspaceId);
      }
      if (dataSourceId) {
        cy.deleteDataSource(dataSourceId);
      }
    });

    beforeEach(() => {
      cy.visit(`${url}/w/${workspaceId}/app/data-explorer/discover`);
      cy.wait(5000);

      cy.get('[data-test-subj="datasetSelectorButton"]', {
        timeout: 60000,
      }).click();

      // Type in the search box
      cy.get(
        '[data-test-subj="datasetSelectorSelectable"] input[type="search"]'
      ).type('opensearch_dashboards_sample_data_logs');

      // Wait for and select the filtered result
      cy.get('[data-test-subj="datasetSelectorSelectable"]')
        .contains(
          '.euiSelectableListItem',
          'opensearch_dashboards_sample_data_logs'
        )
        .should('be.visible')
        .click();
    });

    it('should create detector successfully', () => {
      cy.get('button[aria-label="OpenSearch assistant trigger button"]', {
        timeout: 60000,
      }).click();
      cy.contains('Suggest anomaly detector').click();

      cy.get('#add-anomaly-detector__title').should(
        'contain',
        'Suggested anomaly detector'
      );

      cy.get('[data-test-subj="accordionTitleButton"]', { timeout: 10000 })
        .first()
        .should('be.visible')
        .click();

      cy.get('[data-test-subj="detectorNameTextInputFlyout"]').clear();

      cy.get('[data-test-subj="detectorNameTextInputFlyout"]').type(
        'test-detector-name' + Math.floor(Math.random() * 100) + 1
      );

      cy.get('[data-test-subj="detectionInterval"]').clear().type('15');

      cy.get('[data-test-subj="windowDelay"]').clear().type('5');

      cy.wait(5000);
      cy.contains('button', 'Create detector').click();
      cy.contains('Detector created').should('be.visible');
    });

    it('should handle suggest parameters error gracefully', () => {
      // Set up intercept before triggering the request
      cy.intercept('POST', 'w/*/api/assistant/agent/_execute**', (req) => {
        req.reply({
          statusCode: 500,
          body: { message: 'Internal server error' },
        });
      }).as('suggestParametersError');

      cy.get('button[aria-label="OpenSearch assistant trigger button"]', {
        timeout: 60000,
      }).click();
      cy.contains('Suggest anomaly detector').click();

      cy.wait('@suggestParametersError');

      cy.contains(
        'Generate parameters for creating anomaly detector failed'
      ).should('be.visible');
      cy.contains('Cancel').click();
    });

    it('should handle create anomaly detector error gracefully', () => {
      cy.get('button[aria-label="OpenSearch assistant trigger button"]', {
        timeout: 60000,
      }).click();
      cy.contains('Suggest anomaly detector').click();

      cy.intercept('POST', 'w/*/api/anomaly_detectors/detectors/*', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            ok: false,
            error: 'Create anomaly detector failed',
          },
        });
      }).as('createDetectorError');

      cy.contains('button', 'Create detector').click();

      cy.wait('@createDetectorError');

      cy.contains('Create anomaly detector failed').should('be.visible');
    });
  });
};

if (
  Cypress.env('WORKSPACE_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED') &&
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')
) {
  if (Cypress.env('SKIP_HEAVY_DISCOVER_TESTS')) {
    describe('SuggestAnomalyDetector - SKIPPED (renderer memory limit)', () => {
      it('skipped due to CI memory constraints', () => {});
    });
  } else {
    testSuggestAD(Cypress.config().baseUrl);
  }
}
