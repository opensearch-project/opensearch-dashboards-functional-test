/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const workspaceName = `test_workspace_analytics_${Math.random()
  .toString(36)
  .substring(7)}`;
let workspaceDescription = 'This is a analytics workspace description.';
let workspaceId;
let workspaceFeatures = ['use-case-all'];

if (Cypress.env('WORKSPACE_ENABLED')) {
  const createWorkspace = () => {
    cy.createWorkspace({
      name: workspaceName,
      description: workspaceDescription,
      features: workspaceFeatures,
      settings: {
        permissions: {
          library_write: { users: ['%me%'] },
          write: { users: ['%me%'] },
        },
      },
    }).then((value) => {
      workspaceId = value;
    });
  };

  describe('Breadcrumbs in workspace', () => {
    before(() => {
      cy.deleteWorkspaceByName(workspaceName);
      createWorkspace();
    });

    after(() => {
      if (workspaceId) {
        cy.deleteWorkspaceById(workspaceId);
      }
    });

    it('should show workspace name in breadcrumbs', () => {
      miscUtils.visitPage(`w/${workspaceId}/app/dashboards`);
      // wait for page load
      cy.contains('h1', 'Dashboards');

      // get div with class newTopNavHeader
      cy.get('.newTopNavHeader').within(() => {
        cy.getElementByTestId('breadcrumb first')
          .should('exist')
          .within(() => {
            // Check for the icon
            cy.getElementByTestId(`${workspaceId}-icon`).should('exist');
            // Check for the workspace name
            cy.contains(workspaceName).should('exist').click();
            // click on breadcrumbs goes to overview page
            cy.url().should('include', `w/${workspaceId}/app/all_overview`);
          });
      });
    });

    it('should show breadcrumbs in recent popover', () => {
      miscUtils.visitPage(`w/${workspaceId}/app/workspace_detail`);
      // wait for page load
      cy.contains('h1', 'Workspace details');
      cy.getElementByTestId('recentItemsSectionButton')
        .should('exist')
        .click({ force: true });

      cy.get('.euiPopover__panel').within(() => {
        cy.getElementByTestId('breadcrumbs').within(() => {
          // Check for the icon
          cy.getElementByTestId(`${workspaceId}-icon`).should('exist');
          // Check for the workspace name
          cy.contains(workspaceName).should('exist');
          // page title exists in breadcrumbs
          cy.contains('Workspace details');
        });
      });
    });
  });

  describe('Breadcrumbs out of workspace', () => {
    it('breadcrumbs display correctly in settings and setup', () => {
      miscUtils.visitPage('app/workspace_list');
      cy.contains('h1', 'Workspaces');

      cy.get('.newTopNavHeader').within(() => {
        cy.getElementByTestId('breadcrumb first')
          .should('exist')
          .within(() => {
            // Check for the use case name
            cy.contains('Settings and setup').click();
            cy.url().should('include', 'app/settings_landing');
          });
      });

      // check breadcrumbs in recent popover
      cy.getElementByTestId('recentItemsSectionButton').should('exist').click();

      cy.get('.euiPopover__panel').within(() => {
        cy.getElementByTestId('breadcrumbs').within(() => {
          cy.contains('Settings and setup');
          cy.contains('Settings and setup overview');
        });
      });
    });

    it('breadcrumbs display correctly in data administration', () => {
      miscUtils.visitPage('app/data_administration_landing');
      cy.contains('h1', 'Data administration overview');

      cy.get('.newTopNavHeader').within(() => {
        cy.getElementByTestId('breadcrumb first')
          .should('exist')
          .within(() => {
            // Check for the use case name
            cy.contains('Data administration');
          });
      });

      // check breadcrumbs in recent popover
      cy.getElementByTestId('recentItemsSectionButton')
        .should('exist')
        .click({ force: true });

      cy.get('.euiPopover__panel').within(() => {
        cy.getElementByTestId('breadcrumbs').within(() => {
          cy.contains('Data administration');
          cy.contains('Data administration overview');
        });
      });
    });
  });
}
