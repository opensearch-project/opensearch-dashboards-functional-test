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
    before(() => {
      clearAll();
      createWorkspaceWithEcommerceData().then((result) => {
        cy.wrap(result.workspaceId).as('workspaceId');
        cy.wrap(result.dataSourceId).as('dataSourceId');

        cy.get('@workspaceId').then((workspaceId) => {
          cy.createMonitor(
            sampleQueryLevelMonitorForAlertSummary,
            dataSourceUrl
          );
          cy.wait(80000);
          cy.visit(`${url}/w/${workspaceId}/app/monitors#`);
          cy.contains(sampleQueryLevelMonitorForAlertSummary.name, {
            timeout: 60000,
          });
        });
      });
    });

    after(function () {
      clearAll();
      const { workspaceId, dataSourceId } = this;
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

    beforeEach(function () {
      cy.get('@workspaceId').then((workspaceId) => {
        cy.visit(`${url}/w/${workspaceId}/app/alerts#/`);
        cy.get('.incontextInsightAnchorIcon', { timeout: 60000 }).should(
          'exist'
        );
      });
    });

    it('should display the summary panel with appropriate content', () => {
      cy.get('.incontextInsightAnchorIcon').first().click();

      cy.get('.incontextInsightPopoverBody').within(() => {
        cy.get('.euiLoadingContent').should('exist');
        cy.get('.euiLoadingContent', { timeout: 60000 }).should('not.exist');

        cy.get('.incontextInsightGeneratePopoverContent').should(($popover) => {
          const popoverText = $popover.text();
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

      const triggerInsightPopover = () => {
        cy.get('.incontextInsightAnchorIcon').should('exist');
        cy.get('.incontextInsightAnchorIcon').first().click();
        cy.get('.incontextInsightGeneratePopoverFooter').should('exist');
      };

      triggerInsightPopover();
      cy.get(upButton).should('exist');
      cy.get(downButton).should('exist');
      cy.get(copyButton).should('exist');
      cy.get(upButton).first().click();
      cy.get(downButton).should('not.exist');

      cy.reload();
      cy.get('.incontextInsightAnchorIcon', { timeout: 60000 }).should('exist');

      triggerInsightPopover();
      cy.get(downButton).first().click();
      cy.get(upButton).should('not.exist');

      cy.reload();
      cy.get('.incontextInsightAnchorIcon', { timeout: 60000 }).should('exist');

      triggerInsightPopover();
      cy.window().then((win) => {
        cy.spy(win.document, 'execCommand').as('copyCommand');
      });
      cy.get(copyButton).first().click();
      cy.get('@copyCommand').should('be.calledWith', 'copy');
    });

    it('should allow users to interact with view insight button inside the panel', () => {
      cy.get('.incontextInsightAnchorIcon').should('exist');
      cy.get('.incontextInsightAnchorIcon').first().click();

      cy.get('.incontextInsightPopoverBody').within(() => {
        cy.get('.euiLoadingContent').should('exist');
        cy.get('.euiLoadingContent', { timeout: 60000 }).should('not.exist');
      });

      cy.get('body').then(($body) => {
        if ($body.find(':contains("View insight")').length > 0) {
          cy.get('.euiButton')
            .contains(/View insight/)
            .should('exist')
            .click();

          cy.get('.euiLoadingContent').should('exist');
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
