/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import sampleQueryLevelMonitorForAlertSummary from '../../../fixtures/plugins/alerting-dashboards-plugin/sample_query_level_monitor_for_alert_summary.json';
import { ADMIN_AUTH } from '../../../utils/commands';
import workspaceTestUser from '../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestUser.json';
import workspaceTestRole from '../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRole.json';

const workspaceName = `test_workspace_${Math.random()
  .toString(36)
  .substring(7)}`;

const toggleOnAIFeature = () => {
  // Click on the AI feature toggle and the toggle should be toggled on
  cy.getElementByTestId('advancedSetting-resetField-enableAIFeatures').click();
  cy.getElementByTestId('advancedSetting-editField-enableAIFeatures').should(
    'have.attr',
    'aria-checked',
    'true'
  );

  // Save the change of settings
  cy.getElementByTestId('advancedSetting-saveButton')
    .should('be.visible')
    .click();
};

const toggleOffAIFeature = () => {
  // Click on the AI feature toggle and the toggle should be toggled off
  cy.getElementByTestId('advancedSetting-editField-enableAIFeatures').click();
  cy.getElementByTestId('advancedSetting-editField-enableAIFeatures').should(
    'have.attr',
    'aria-checked',
    'false'
  );

  // Save the change of settings
  cy.getElementByTestId('advancedSetting-saveButton')
    .should('be.visible')
    .click();
};

function dashboardsAssistantFeatureFlagTestCases() {
  describe('Dashboards assistant feature flag', () => {
    let workspaceId;
    let dataSourceId;
    before(() => {
      cy.createDataSourceNoAuth().then((result) => {
        dataSourceId = result[0];
        cy.createWorkspace({
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
          .then((wsId) => {
            workspaceId = wsId;
          })
          .then(() =>
            cy.loadSampleDataForWorkspace(
              'ecommerce',
              workspaceId,
              dataSourceId
            )
          );
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

    describe('AI feature flag enabled', () => {
      it('AI feature flag toggle on advanced settings page should be enabled', () => {
        cy.visit(`${BASE_PATH}/app/settings`);

        cy.getElementByTestId(
          'advancedSetting-editField-enableAIFeatures'
        ).then(($el) => {
          // Enable AI feature setting if it is turned off
          if ($el.attr('aria-checked') === 'false') {
            toggleOnAIFeature();
          } else {
            cy.getElementByTestId(
              'advancedSetting-resetField-enableAIFeatures'
            ).should('not.exist');
          }
        });
      });

      it('Data2summary and suggested AD should be available on the discover', () => {
        cy.visit(`w/${workspaceId}/app/discover`);

        // Switch to PPL
        cy.get('.languageSelector__button').should('be.visible').click();
        cy.contains('button', 'PPL').should('be.visible').click();
        cy.getElementByTestId('languageReferenceButton')
          .should('be.visible')
          .click();

        // Result panel should be visible
        cy.getElementByTestId('queryAssist__summary').should('be.visible');

        // Suggested AD should be availble
        cy.get('button[aria-label="OpenSearch assistant trigger button', {
          timeout: 60000,
        }).click();
        cy.contains('Suggest anomaly detector').click();
        cy.get('.add-anomaly-detector').should('be.visible');
      });

      it('Chatbot should be available on the overview page', () => {
        cy.visit(`w/${workspaceId}/app/all_overview`);

        // Can toggle chatbot flyout
        cy.openAssistantChatbot();
      });

      it('Alert summary should be available on the alert', () => {
        const dataSourceUrl = Cypress.env('remoteDataSourceNoAuthUrl');
        cy.createMonitor(sampleQueryLevelMonitorForAlertSummary, dataSourceUrl);

        cy.wait(80000);
        cy.visit(`w/${workspaceId}/app/alerts`);

        // Alert summary icon should be visible
        cy.get('.incontextInsightAnchorIcon', { timeout: 60000 }).should(
          'be.visible'
        );

        cy.deleteAllAlerts(dataSourceUrl);
        cy.deleteAllMonitors(dataSourceUrl);
      });
    });

    describe('AI feature flag disabled', () => {
      after(() => {
        cy.visit(`${BASE_PATH}/app/settings`);

        cy.reload();

        // Re-enable the AI features to restore the test environment
        cy.getElementByTestId('advancedSetting-editField-enableAIFeatures')
          .should('exist')
          .and('be.visible')
          .click();
        cy.getElementByTestId('advancedSetting-saveButton')
          .should('be.visible')
          .click();
      });

      it('AI feature flag on advanced settings page can be toggle off', () => {
        cy.visit(`${BASE_PATH}/app/settings`);

        cy.contains('Enable AI features');
        cy.getElementByTestId(
          'advancedSetting-editField-enableAIFeatures'
        ).then(($el) => {
          // Toggle off the AI feature flag if it hasn't already
          if ($el.attr('aria-checked') === 'true') {
            toggleOffAIFeature();
          } else {
            cy.getElementByTestId(
              'advancedSetting-resetField-enableAIFeatures'
            ).should('be.visible');
          }
        });
        // Reset to default button is available
        cy.getElementByTestId(
          'advancedSetting-resetField-enableAIFeatures'
        ).should('be.visible');
      });

      it('Data2summary and suggested AD should be unavailable on the discover', () => {
        cy.visit(`w/${workspaceId}/app/discover`);

        // Switch to PPL
        cy.get('.languageSelector__button').should('be.visible').click();
        cy.contains('button', 'PPL').should('be.visible').click();
        cy.getElementByTestId('languageReferenceButton')
          .should('be.visible')
          .click();

        // Result summary panel and assistant button that opens suggested AD should not exist
        cy.getElementByTestId('queryAssist__summary').should('not.exist');
        cy.get('button[aria-label="OpenSearch assistant trigger button').should(
          'not.exist'
        );
      });

      it('Chatbot should be unavailable on the overview page', () => {
        cy.visit(`w/${workspaceId}/app/all_overview`);

        // No chatbot button should be available
        cy.get('button[aria-label="toggle chat flyout icon').should(
          'not.exist'
        );
      });

      it('Alert summary should be unavailable on the alert', () => {
        const dataSourceUrl = Cypress.env('remoteDataSourceNoAuthUrl');
        cy.createMonitor(sampleQueryLevelMonitorForAlertSummary, dataSourceUrl);

        cy.wait(80000);

        // Alert should be visible but no alert summary button should be there
        cy.visit(`w/${workspaceId}/app/alerts`);
        cy.get('.euiTableRow').should('exist').and('be.visible');
        cy.get('.incontextInsightAnchorIcon').should('not.exist');

        cy.deleteAllAlerts(dataSourceUrl);
        cy.deleteAllMonitors(dataSourceUrl);
      });
    });
  });
}

function dashboardAdminUiSettingsTestCases() {
  describe('Dashboard admin UI settings', () => {
    describe('Dashboard amin user', () => {
      it('can toggle AI feature flag', () => {
        // Already login as dashboard admin
        cy.visit(`${BASE_PATH}/app/settings`);

        cy.contains('Enable AI features');

        cy.getElementByTestId(
          'advancedSetting-editField-enableAIFeatures'
        ).then(($el) => {
          // Ensure the AI feature toggle is on
          if ($el.attr('aria-checked') === 'false') {
            toggleOnAIFeature();

            cy.reload();
          }
          toggleOffAIFeature();
        });
      });

      it('can delete dashboard admin settings saved object', () => {
        cy.visit(`${BASE_PATH}/app/objects`);

        // Dashboard admin settings saved object should be visible
        cy.getElementByTestId('savedObjectsTableRow row-_dashboard_admin')
          .contains('_dashboard_admin')
          .getElementByTestId('checkboxSelectRow-_dashboard_admin')
          .click();

        // Delete the dashboard admin settings saved object
        cy.getElementByTestId('savedObjectsManagementDelete')
          .should('exist')
          .click();
        cy.getElementByTestId('confirmModalConfirmButton')
          .should('exist')
          .click();

        cy.visit(`${BASE_PATH}/app/settings`);

        // AI feature toggle should be restored back to default
        cy.getElementByTestId(
          'advancedSetting-editField-enableAIFeatures'
        ).should('have.attr', 'aria-checked', 'true');
      });
    });

    describe('Non-dashboard admin user', () => {
      const NONE_DASHBOARDS_ADMIN_USERNAME = 'workspace-test';
      const WORKSPACE_TEST_ROLE_NAME = 'workspace-test-role';
      const originalUser = ADMIN_AUTH.username;
      const originalPassword = ADMIN_AUTH.password;

      before(() => {
        // Prepare non OSD admin user
        cy.createInternalUser(
          NONE_DASHBOARDS_ADMIN_USERNAME,
          workspaceTestUser
        );
        cy.createRole(WORKSPACE_TEST_ROLE_NAME, workspaceTestRole);
        cy.createRoleMapping(WORKSPACE_TEST_ROLE_NAME, {
          users: [NONE_DASHBOARDS_ADMIN_USERNAME],
        });
      });

      beforeEach(() => {
        // Login as non OSD admin user
        ADMIN_AUTH.newUser = NONE_DASHBOARDS_ADMIN_USERNAME;
        ADMIN_AUTH.newPassword = workspaceTestUser.password;
      });

      after(() => {
        ADMIN_AUTH.newUser = originalUser;
        ADMIN_AUTH.newPassword = originalPassword;
        cy.deleteRoleMapping(WORKSPACE_TEST_ROLE_NAME);
        cy.deleteInternalUser(NONE_DASHBOARDS_ADMIN_USERNAME);
        cy.deleteRole(WORKSPACE_TEST_ROLE_NAME);
      });

      it('cannot toggle AI feature flag', () => {
        cy.visit(`${BASE_PATH}/app/settings`);

        // The AI feature toggle should be unavailble to be toggled
        cy.contains('Enable AI features');
        cy.getElementByTestId(
          'advancedSetting-editField-enableAIFeatures'
        ).should('be.disabled');
        cy.contains('This setting is controlled by dashboard admin only.');
      });

      it('cannot see admin settings saved object in assets page', () => {
        cy.visit(`${BASE_PATH}/app/objects`);

        // Dashboard admin settings saved object should not be visible
        cy.getElementByTestId('savedObjectsTable').within(() => {
          cy.get('.euiTableRow').should('be.visible');
          cy.contains('_dashboard_admin').should('not.exist');
        });
      });
    });
  });
}

if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  Cypress.env('SECURITY_ENABLED')
) {
  dashboardAdminUiSettingsTestCases();
}

if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  Cypress.env('CYPRESS_DATASOURCE_MANAGEMENT_ENABLED')
) {
  dashboardsAssistantFeatureFlagTestCases();
}
