/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const currentDate = Date.now();
const workspaceName = 'foo-workspace' + currentDate;
const workspaceDescription = 'foo-workspace-desc' + currentDate;

if (Cypress.env('WORKSPACE_ENABLED')) {
  let workspaceId = '';

  describe('Workspace overview', () => {
    before(() => {
      cy.createWorkspace({
        workspaceName,
        description: workspaceDescription,
        features: [
          'management',
          'discover',
          'workspace_overview',
          'workspace_update',
          'dashboards',
          'visualize',
        ],
      }).then((id) => {
        workspaceId = id;
      });
      cy.log(`workspace ${workspaceName} create successfully`);
    });

    after(() => {
      // cy.deleteWorkspaceById(workspaceId);
    });

    beforeEach(() => {
      // Visit workspace overview page
      cy.intercept('GET', `/w/${workspaceId}/api/workspaces/${workspaceId}`).as(
        'getWorkspace'
      );
      miscUtils.visitPage(`/w/${workspaceId}/app/workspace_overview`);
      cy.wait('@getWorkspace');
    });

    it('should successfully load the page', () => {
      // workspace name is correctly displayed
      cy.contains(workspaceName, { timeout: 60000 });
      // dashboars and visualization cards are visiable
      cy.get('div[data-test-subj="workspaceGetStartCards"')
        .as('getStartCards')
        .should('be.visible');
      cy.get('@getStartCards').contains('with Dashboards');
      cy.get('@getStartCards').contains('with Visualizations');

      // tabs
      cy.getElementByTestId('workspaceTabs')
        .find('.euiTab')
        .as('tabs')
        .should('have.length', 3);
    });

    it('should collpase start working section when collpase button clicked', () => {
      // workspace name is correctly displayed
      cy.contains(workspaceName, { timeout: 60000 });
      // dashboars and visualization cards are visiable
      cy.getElementByTestId('workspaceGetStartCards')
        .as('getStartCards')
        .should('be.visible');
      cy.get('@getStartCards').contains('with Dashboards');
      cy.get('@getStartCards').contains('with Visualizations');

      // click Collpase
      cy.getElementByTestId('Collapse').click();
      cy.get('@getStartCards').should('not.exist');

      // click Expand
      cy.getElementByTestId('Expand').click();
      cy.get('@getStartCards').should('be.visible');
    });

    it('should display workspace description correctly in overview tab', () => {
      // click on overview tab
      cy.get('div[data-test-subj="workspaceTabs"] #overview').click();
      cy.contains(workspaceDescription);
    });

    it('should redirect to saved objects page when click on library tab', () => {
      // click on library tab
      cy.get('div[data-test-subj="workspaceTabs"] #library').click();
      cy.location('pathname', { timeout: 6000 }).should(
        'include',
        'app/management/opensearch-dashboards/objects'
      );
    });

    it('should show wokrspace update when click on settings tab', () => {
      // click on settings tab
      cy.getElementByTestId('workspaceTabs').find('#settings').click();
      cy.contains('Workspace Details');

      cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText')
        .clear()
        .type(`${workspaceDescription}-updated`);
      cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click({
        force: true,
      });

      // workspace update successfully and overview page refreshed
      cy.contains('h1', `${workspaceDescription}-updated`);
    });
  });
}
