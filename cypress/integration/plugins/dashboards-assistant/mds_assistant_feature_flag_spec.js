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
  cy.getElementByTestId('advancedSetting-resetField-enableAIFeatures').click();
  cy.getElementByTestId('advancedSetting-editField-enableAIFeatures').should(
    'have.attr',
    'aria-checked',
    'true'
  );
  cy.getElementByTestId('advancedSetting-saveButton')
    .should('be.visible')
    .click();
};

const toggleOffAIFeature = () => {
  cy.getElementByTestId('advancedSetting-editField-enableAIFeatures').click();
  cy.getElementByTestId('advancedSetting-editField-enableAIFeatures').should(
    'have.attr',
    'aria-checked',
    'false'
  );
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

        cy.get('.languageSelector__button').should('be.visible').click();
        cy.contains('button', 'PPL').should('be.visible').click();
        cy.getElementByTestId('languageReferenceButton')
          .should('be.visible')
          .click();
        cy.getElementByTestId('queryAssist__summary').should('be.visible');

        cy.get('button[aria-label="OpenSearch assistant trigger button', {
          timeout: 60000,
        }).click();
        cy.contains('Suggest anomaly detector').click();
        cy.get('.add-anomaly-detector').should('be.visible');
      });

      it('Chatbot should be available on the overview page', () => {
        cy.visit(`w/${workspaceId}/app/all_overview`);

        cy.openAssistantChatbot();
      });

      it('Alert summary should be available on the alert', () => {
        const dataSourceUrl = Cypress.env('remoteDataSourceBasicAuthUrl');
        cy.createMonitor(sampleQueryLevelMonitorForAlertSummary, dataSourceUrl);

        cy.wait(80000);

        cy.visit(`w/${workspaceId}/app/alerts`);
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
          if ($el.attr('aria-checked') === 'true') {
            toggleOffAIFeature();
          } else {
            cy.getElementByTestId(
              'advancedSetting-resetField-enableAIFeatures'
            ).should('be.visible');
          }
        });
        cy.getElementByTestId(
          'advancedSetting-resetField-enableAIFeatures'
        ).should('be.visible');
      });

      it('Data2summary and suggested AD should be unavailable on the discover', () => {
        cy.visit(`w/${workspaceId}/app/discover`);

        cy.get('.languageSelector__button').should('be.visible').click();
        cy.contains('button', 'PPL').should('be.visible').click();
        cy.getElementByTestId('languageReferenceButton')
          .should('be.visible')
          .click();

        cy.getElementByTestId('queryAssist__summary').should('not.exist');
        cy.get('button[aria-label="OpenSearch assistant trigger button').should(
          'not.exist'
        );
      });

      it('Chatbot should be unavailable on the overview page', () => {
        cy.visit(`w/${workspaceId}/app/all_overview`);

        cy.get('button[aria-label="toggle chat flyout icon').should(
          'not.exist'
        );
      });

      it('Alert summary should be unavailable on the alert', () => {
        const dataSourceUrl = Cypress.env('remoteDataSourceBasicAuthUrl');
        cy.createMonitor(sampleQueryLevelMonitorForAlertSummary);

        cy.wait(80000);

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
        cy.visit(`${BASE_PATH}/app/settings`);

        cy.contains('Enable AI features');

        cy.getElementByTestId(
          'advancedSetting-editField-enableAIFeatures'
        ).then(($el) => {
          if ($el.attr('aria-checked') === 'false') {
            toggleOnAIFeature();

            cy.reload();
          }
          toggleOffAIFeature();
        });
      });

      it('can delete dashboard admin settings saved object', () => {
        cy.visit(`${BASE_PATH}/app/objects`);

        cy.getElementByTestId('savedObjectsTableRow row-_dashboard_admin')
          .contains('_dashboard_admin')
          .getElementByTestId('checkboxSelectRow-_dashboard_admin')
          .click();

        cy.getElementByTestId('savedObjectsManagementDelete')
          .should('exist')
          .click();
        cy.getElementByTestId('confirmModalConfirmButton')
          .should('exist')
          .click();

        cy.visit(`${BASE_PATH}/app/settings`);
      });
    });

    describe('Non-dashboard admin user', () => {
      const NONE_DASHBOARDS_ADMIN_USERNAME = 'workspace-test';
      const WORKSPACE_TEST_ROLE_NAME = 'workspace-test-role';
      const originalUser = ADMIN_AUTH.username;
      const originalPassword = ADMIN_AUTH.password;

      before(() => {
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

        cy.contains('Enable AI features');
        cy.getElementByTestId(
          'advancedSetting-editField-enableAIFeatures'
        ).should('be.disabled');
      });

      it('cannot see admin settings saved object in assets page', () => {
        cy.visit(`${BASE_PATH}/app/objects`);

        cy.getElementByTestId('savedObjectsTable').within(() => {
          cy.get('.euiTableRow').should('be.visible');
          cy.contains('_dashboard_admin').should('not.exist');
        });
      });
    });
  });
}

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  dashboardsAssistantFeatureFlagTestCases();

  if (Cypress.env('SECURITY_ENABLED')) {
    dashboardAdminUiSettingsTestCases();
  }
}
