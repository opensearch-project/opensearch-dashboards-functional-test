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

      cy.intercept('POST', 'w/*/api/assistant/agent/_execute**', (req) => {
        req.reply(() => {
          return {
            statusCode: 200,
            headers: {
              'content-type': 'application/json',
            },
            body: {
              inference_results: [
                {
                  output: [
                    {
                      name: 'response',
                      result:
                        '{"index":"opensearch_dashboards_sample_data_logs","categoryField":"geo.src","aggregationField":"bytes,memory,phpmemory","aggregationMethod":"sum,avg,max","dateFields":"utc_time,timestamp"}',
                    },
                  ],
                },
              ],
            },
          };
        });
      }).as('suggestParameters');

      cy.wait('@suggestParameters');

      // Check main UI elements are present
      cy.get('[data-test-subj="detectorNameTextInputFlyout"]').should('exist');
      cy.get('#add-anomaly-detector__title').should(
        'contain',
        'Suggested anomaly detector'
      );
      cy.get('[data-test-subj="detectionInterval"]').should('exist');
      cy.get('[data-test-subj="windowDelay"]').should('exist');

      cy.get('[id="detectorDetailsAccordion"]')
        .parent()
        .find('[data-test-subj="accordionTitleButton"]')
        .click();

      // Test empty name validation
      cy.get('[data-test-subj="detectorNameTextInputFlyout"]').clear();
      cy.get('[data-test-subj="detectorNameTextInputFlyout"]').blur();
      cy.contains('Detector name cannot be empty').should('be.visible');

      // Test valid name
      cy.get('[data-test-subj="detectorNameTextInputFlyout"]').type(
        'test-detector-name' + Math.floor(Math.random() * 100) + 1
      );
      cy.contains('Detector name cannot be empty').should('not.exist');

      // Test interval input
      cy.get('[data-test-subj="detectionInterval"]').clear().type('15');

      // Test window delay input
      cy.get('[data-test-subj="windowDelay"]').clear().type('5');

      // Mock the create detector API call
      cy.intercept('POST', 'w/*/api/anomaly_detectors/detectors/*', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            ok: true,
            response: {
              id: 'test-detector-id',
            },
          },
        });
      }).as('createDetector');

      // Mock the start detector API call
      cy.intercept(
        'POST',
        'w/*/api/anomaly_detectors/detectors/test-detector-id/start/*',
        (req) => {
          req.reply({
            statusCode: 200,
            body: {
              ok: true,
              response: {
                _id: 'test-detector-id',
              },
            },
          });
        }
      ).as('startDetector');

      // Click create button
      cy.contains('button', 'Create detector').click();
      cy.wait('@createDetector');
      cy.contains('Detector created').should('be.visible');
      cy.wait('@startDetector');
    });

    it('should handle suggest parameters error gracefully', () => {
      cy.get('button[aria-label="OpenSearch assistant trigger button"]', {
        timeout: 60000,
      }).click();
      cy.contains('Suggest anomaly detector').click();

      cy.intercept('POST', 'w/*/api/assistant/agent/_execute**', (req) => {
        req.reply({
          statusCode: 500,
          body: { message: 'Internal server error' },
        });
      }).as('suggestParametersError');

      cy.wait('@suggestParametersError');

      // Verify error toast
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

      cy.intercept('POST', 'w/*/api/assistant/agent/_execute**', (req) => {
        req.reply(() => {
          return {
            statusCode: 200,
            headers: {
              'content-type': 'application/json',
            },
            body: {
              inference_results: [
                {
                  output: [
                    {
                      name: 'response',
                      result:
                        '{"index":"opensearch_dashboards_sample_data_logs","categoryField":"geo.src","aggregationField":"bytes,memory,phpmemory","aggregationMethod":"sum,avg,max","dateFields":"utc_time,timestamp"}',
                    },
                  ],
                },
              ],
            },
          };
        });
      }).as('suggestParameters');

      cy.wait('@suggestParameters');

      // Mock failed API call
      cy.intercept('POST', 'w/*/api/anomaly_detectors/detectors/*', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            ok: false,
            error: 'Create anomaly detector failed',
          },
        });
      }).as('createDetectorError');

      // Click create button
      cy.contains('button', 'Create detector').click();

      cy.wait('@createDetectorError');

      // Verify error toast
      cy.contains('Create anomaly detector failed').should('be.visible');
    });
  });
};

if (
  Cypress.env('WORKSPACE_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED') &&
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')
) {
  testSuggestAD(Cypress.config().baseUrl);
}
