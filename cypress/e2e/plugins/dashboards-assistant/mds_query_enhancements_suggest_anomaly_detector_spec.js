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
    const openSuggestAnomalyDetector = () => {
      // V13 Optimized: Check for visibility using cy.get() and skip trigger if menu is already open
      cy.get('body').then(($body) => {
        if ($body.find('#add-anomaly-detector__title:visible').length > 0) {
          return;
        }

        // Use a simple query instead of expensive :contains
        const isMenuVisible = $body.find('.assistant-menu-item').length > 0; // Assuming a stable class exists, or use a better selector

        if (!isMenuVisible) {
          cy.get(
            'button[aria-label="OpenSearch assistant trigger button"]'
          ).click();
        }
      });

      cy.contains('Suggest anomaly detector', { timeout: 30000 })
        .should('be.visible')
        .click();

      cy.get('#add-anomaly-detector__title', { timeout: 30000 }).should(
        'contain',
        'Suggested anomaly detector'
      );
    };
    const selectLogsDataSet = () => {
      // V13 & testIsolation:false optimization:
      // Check if the correct dataset is already selected to avoid unnecessary UI interaction
      cy.get('body').then(($body) => {
        const $button = $body.find('[data-test-subj="datasetSelectorButton"]');
        if (
          $button.length > 0 &&
          $button.text().includes('opensearch_dashboards_sample_data_logs')
        ) {
          return;
        }

        // Otherwise, perform the selection
        cy.get('[data-test-subj="datasetSelectorButton"]', { timeout: 60000 })
          .should('be.visible')
          .click();

        // Use a more robust way to wait for the dropdown and its input
        cy.get('[data-test-subj="datasetSelectorSelectable"]', {
          timeout: 30000,
        })
          .should('be.visible')
          .within(() => {
            cy.get('input[type="search"]')
              .should('be.visible')
              .clear()
              .type('opensearch_dashboards_sample_data_logs', { delay: 50 });
          });

        // Wait for filtering and select the item
        cy.get('[data-test-subj="datasetSelectorSelectable"]')
          .contains(
            '.euiSelectableListItem',
            'opensearch_dashboards_sample_data_logs',
            { timeout: 30000 }
          )
          .should('be.visible')
          .click();

        // Ensure dropdown closes
        cy.get('[data-test-subj="datasetSelectorSelectable"]', {
          timeout: 10000,
        }).should('not.exist');
      });
    };

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
      // V13 & testIsolation:false optimization
      cy.get('body').then(($body) => {
        const isDiscover = window.location.pathname.includes('discover');
        const hasDataset = $body
          .find('[data-test-subj="datasetSelectorButton"]')
          .text()
          .includes('opensearch_dashboards_sample_data_logs');

        if (isDiscover && hasDataset) {
          // If we are on the right page with the right dataset, just ensure assistant is ready
          cy.get('button[aria-label="OpenSearch assistant trigger button"]', {
            timeout: 60000,
          }).should('be.visible');
          return;
        }

        // Otherwise, perform full setup
        cy.visit(`${url}/w/${workspaceId}/app/data-explorer/discover`);
        cy.get('.deSidebar_dataSource', { timeout: 60000 }).should(
          'be.visible'
        );
        selectLogsDataSet();
        cy.get('button[aria-label="OpenSearch assistant trigger button"]', {
          timeout: 60000,
        }).should('be.visible');
      });
    });

    afterEach(() => {
      // V13 & testIsolation:false: Efficient batch cleanup
      // This minimizes the number of commands and snapshots in memory
      cy.get('body').then(($body) => {
        const $closeButtons = $body.find(
          'button[aria-label="flyout close button"]:visible, [data-test-subj="euiFlyoutCloseButton"]:visible, .euiFlyout__closeButton:visible, button[aria-label="Close Assistant"]:visible'
        );
        if ($closeButtons.length > 0) {
          cy.wrap($closeButtons).click({ force: true, multiple: true });
        }

        // Only toggle assistant if it's actually blocking
        if ($body.find('#add-anomaly-detector__title:visible').length > 0) {
          cy.get(
            'button[aria-label="OpenSearch assistant trigger button"]'
          ).click();
        }
      });

      // Simple ESC without excessive waits
      cy.get('body').type('{esc}', { force: true });
    });

    it('should create detector successfully', () => {
      openSuggestAnomalyDetector();

      cy.get('[data-test-subj="accordionTitleButton"]', { timeout: 20000 })
        .first()
        .should('be.visible')
        .click();

      cy.get('[data-test-subj="detectorNameTextInputFlyout"]', {
        timeout: 10000,
      })
        .should('be.visible')
        .clear()
        .type('test-detector-name' + Math.floor(Math.random() * 100) + 1);

      cy.get('[data-test-subj="detectionInterval"]', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('15');

      cy.get('[data-test-subj="windowDelay"]', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('5');

      cy.contains('button', 'Create detector', { timeout: 30000 })
        .should('be.visible')
        .and('be.enabled')
        .click();

      cy.contains('Detector created', { timeout: 60000 }).should('be.visible');
    });

    it('should handle suggest parameters error gracefully', () => {
      cy.intercept('POST', 'w/*/api/assistant/agent/_execute**', (req) => {
        req.reply({
          statusCode: 500,
          body: { message: 'Internal server error' },
        });
      }).as('suggestParametersError');

      openSuggestAnomalyDetector();
      cy.wait('@suggestParametersError');

      // Verify error toast
      cy.contains(
        'Generate parameters for creating anomaly detector failed'
      ).should('be.visible');
      cy.contains('Cancel').click();
    });

    it('should handle create anomaly detector error gracefully', () => {
      cy.intercept('POST', 'w/*/api/anomaly_detectors/detectors/*', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            ok: false,
            error: 'Create anomaly detector failed',
          },
        });
      }).as('createDetectorError');

      openSuggestAnomalyDetector();
      cy.contains('button', 'Create detector', { timeout: 30000 })
        .should('be.visible')
        .and('be.enabled')
        .click({ force: true });

      cy.wait('@createDetectorError');

      // Verify error toast
      cy.contains('Create anomaly detector failed', { timeout: 60000 }).should(
        'be.visible'
      );
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
