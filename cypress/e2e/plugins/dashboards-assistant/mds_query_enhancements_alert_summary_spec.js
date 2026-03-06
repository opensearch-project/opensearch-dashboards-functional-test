/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sampleQueryLevelMonitorForAlertSummary from '../../../fixtures/plugins/alerting-dashboards-plugin/sample_query_level_monitor_for_alert_summary.json';

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

const dataSourceUrl = Cypress.env('remoteDataSourceNoAuthUrl');

const clearAll = () => {
  cy.deleteAllAlerts(dataSourceUrl);
  cy.deleteAllMonitors(dataSourceUrl);
};

function alertSummaryTestCases(url) {
  describe('alert summary', () => {
    let workspaceId = '';
    let dataSourceId = '';
    before(() => {
      clearAll();
      createWorkspaceWithEcommerceData().then((result) => {
        workspaceId = result.workspaceId;
        dataSourceId = result.dataSourceId;

        cy.createMonitor(sampleQueryLevelMonitorForAlertSummary, dataSourceUrl);
        // Waiting for alert to be triggered
        cy.wait(80000);

        cy.visit(`${url}/w/${workspaceId}/app/monitors#`);
        cy.contains(sampleQueryLevelMonitorForAlertSummary.name, {
          timeout: 60000,
        });
      });
    });

    after(() => {
      clearAll();

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
      cy.visit(`${url}/w/${workspaceId}/app/alerts#/`);
      // Wait until the page is fully loaded so that the summary button is visible
      cy.get('.incontextInsightAnchorIcon', { timeout: 60000 }).should('exist');
    });

    it('should display the summary panel with appropriate content', () => {
      // Click on the first one since we could have multiple alerts
      cy.get('.incontextInsightAnchorIcon').first().click();

      cy.get('.incontextInsightPopoverBody').within(() => {
        cy.get('.euiLoadingContent').should('exist');
        // Allow additional loading time to avoid flakiness
        cy.get('.euiLoadingContent', { timeout: 60000 }).should('not.exist');

        cy.get('.incontextInsightGeneratePopoverContent').should(($popover) => {
          const popoverText = $popover.text();
          // Validate the generated content has reasonable structure
          expect(popoverText.trim()).to.not.be.empty;
          expect(popoverText.length).to.be.greaterThan(0);
          expect(popoverText).to.match(/[.!?]$/);
          expect(popoverText.split(' ').length).to.be.greaterThan(1);
        });
      });
    });

    it('should allow users to interact with the response and copy buttons inside the panel', () => {
      const upButton = '[aria-label="feedback thumbs up"]';
      const downButton = '[aria-label="feedback thumbs down"]';
      const copyButton = '[aria-label="copy message"]';

      const triggerInsightPopoverAndGetFooter = () => {
        return cy
          .get('.incontextInsightAnchorIcon')
          .should('exist')
          .first()
          .click()
          .then(() => {
            return cy
              .get('.incontextInsightGeneratePopoverFooter')
              .within(() => {});
          });
      };

      triggerInsightPopoverAndGetFooter().then(() => {
        // Verify fotter buttons
        cy.get(upButton).should('exist');
        cy.get(downButton).should('exist');
        cy.get(copyButton).should('exist');

        // Click on thumb up feedback button so that thumb down is hidden
        cy.get(upButton).first().click();
        cy.get(downButton).should('not.exist');
      });

      cy.reload();

      triggerInsightPopoverAndGetFooter().then(() => {
        // Click on thumb down feedback button so that thumb up is hidden
        cy.get(downButton).first().click();
        cy.get(upButton).should('not.exist');
      });

      cy.reload();

      triggerInsightPopoverAndGetFooter().then(() => {
        cy.window().then((win) => {
          cy.spy(win.document, 'execCommand').as('copyCommand');
        });
        cy.get(copyButton).first().click();
        // Verify the text copy is triggered
        cy.get('@copyCommand').should('be.calledWith', 'copy');
      });
    });

    it('should allow users to interact with view insight button inside the panel', () => {
      cy.get('.incontextInsightAnchorIcon').should('exist').first().click();

      cy.get('.incontextInsightPopoverBody').within(() => {
        cy.get('.euiLoadingContent').should('exist');
        // Allow additional loading time to avoid flakiness
        cy.get('.euiLoadingContent', { timeout: 60000 }).should('not.exist');
      });

      cy.get('body').then(($body) => {
        // Check if the button exists for this alert
        if ($body.find(':contains("View insight")').length > 0) {
          cy.get('.euiButton')
            .contains(/View insight/)
            .should('exist')
            .click();

          // Trigger the loading for insight
          cy.get('.euiLoadingContent').should('exist');
          // Allow additional loading time to avoid flakiness
          cy.get('.euiLoadingContent', { timeout: 60000 }).should('not.exist');

          cy.get('.incontextInsightGeneratePopoverContent').should(
            ($popover) => {
              const popoverText = $popover.text();
              expect(popoverText.trim()).to.not.be.empty;
            }
          );

          cy.contains('button:visible', /Back to summary/).click();
          cy.get('.euiButton')
            .contains(/Back to summary/)
            .should('not.exist');
          cy.get('.euiButton')
            .contains(/View insight/)
            .should('exist');
        }
      });
    });
  });
}

if (
  Cypress.env('WORKSPACE_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED') &&
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')
) {
  alertSummaryTestCases(Cypress.config().baseUrl);
}
