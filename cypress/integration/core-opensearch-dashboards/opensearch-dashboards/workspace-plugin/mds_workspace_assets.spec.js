/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../../utils/base_constants';

let sourceWorkspaceName = 'test_source_workspace';
let targetWorkspaceName = 'test_target_workspace';

let sourceWorkspaceId = '';
let targetWorkspaceId = '';
let datasourceId = '';

const setupWorkspace = (workspaceName, datasourceId) => {
  return cy
    .createWorkspace({
      name: workspaceName,
      settings: {
        ...(datasourceId ? { dataSources: [datasourceId] } : {}),
      },
    })
    .then((value) => {
      // load sample data
      cy.loadSampleDataForWorkspace('ecommerce', value, datasourceId);
      cy.wrap(value);
    });
};

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Workspace assets', () => {
    before(() => {
      cy.deleteWorkspaceByName(sourceWorkspaceName);
      cy.deleteWorkspaceByName(targetWorkspaceName);
      if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
        cy.createDataSourceNoAuth().then((result) => {
          datasourceId = result[0];
          expect(datasourceId).to.be.a('string').that.is.not.empty;
          setupWorkspace(sourceWorkspaceName, datasourceId).then(
            (value) => (sourceWorkspaceId = value)
          );
          setupWorkspace(targetWorkspaceName, datasourceId).then(
            (value) => (targetWorkspaceId = value)
          );
        });
      } else {
        setupWorkspace(sourceWorkspaceName).then(
          (value) => (sourceWorkspaceId = value)
        );
        setupWorkspace(targetWorkspaceName).then(
          (value) => (targetWorkspaceId = value)
        );
      }
    });

    after(() => {
      cy.deleteWorkspaceByName(sourceWorkspaceName);
      cy.deleteWorkspaceByName(targetWorkspaceName);
      sourceWorkspaceId = '';
      targetWorkspaceId = '';
    });

    it('Should not list assets from other workspace and generate correct url for inspect url inside a workspace', () => {
      cy.visit(`${BASE_PATH}/w/${sourceWorkspaceId}/app/objects`);
      cy.getElementByTestId('savedObjectsTableRowTitle').should('exist');
      cy.getElementByTestId('savedObjectsTableColumn-workspace_column').should(
        'not.exist'
      );
      cy.contains('opensearch_dashboards_sample_data_ecommerce');
      // Electron old version may not support search event, so we manually trigger a search event
      cy.getElementByTestId('savedObjectSearchBar')
        .type('opensearch_dashboards_sample_data_ecommerce{enter}')
        .trigger('search');
      cy.getElementByTestId('savedObjectsTableRowTitle').should(
        'have.length',
        1
      );

      // Click more -> inspect
      cy.getElementByTestId('euiCollapsedItemActionsButton')
        .click()
        .getElementByTestId('savedObjectsTableAction-inspect')
        .click();
      cy.location('pathname').should(
        'include',
        `/w/${sourceWorkspaceId}/app/indexPatterns`
      );
    });

    it('Should list assets from workspaces with permission and generate correct url for inspect url outside workspace', () => {
      cy.visit(`${BASE_PATH}/app/objects`);
      cy.getElementByTestId('savedObjectsTableColumn-workspace_column').should(
        'exist'
      );
      // Electron old version may not support search event, so we manually trigger a search event
      cy.getElementByTestId('savedObjectSearchBar')
        .type('opensearch_dashboards_sample_data_ecommerce{enter}')
        .trigger('search');
      cy.getElementByTestId('savedObjectsTableRowTitle').should(
        'have.length',
        2
      );

      // Find the row belong to the target workspace
      cy.contains(targetWorkspaceName)
        .parents('.euiTableRow')
        // Click more -> inspect
        .find('[data-test-subj="euiCollapsedItemActionsButton"]')
        .click()
        .getElementByTestId('savedObjectsTableAction-inspect')
        .click();
      cy.location('pathname').should(
        'include',
        `/w/${targetWorkspaceId}/app/indexPatterns`
      );
    });

    it('Should not show set as default button when outside workspace', () => {
      cy.request({
        url: `${BASE_PATH}/api/opensearch-dashboards/management/saved_objects/_find?workspaces=${targetWorkspaceId}&page=1&type=index-pattern`,
        headers: {
          'Osd-Xsrf': 'osd-fetch',
        },
      })
        .then((resp) => {
          cy.wrap(resp.body.saved_objects).should('have.length', 1);
          cy.wrap(resp.body.saved_objects[0].id);
        })
        .then((indexPatternId) => {
          cy.visit(`${BASE_PATH}/app/indexPatterns/patterns/${indexPatternId}`);
          cy.contains('opensearch_dashboards_sample_data_ecommerce');
          cy.getElementByTestId('setDefaultIndexPatternButton').should(
            'not.exist'
          );
        });
    });

    it('Short url should be able to be generated multiple times and preserve workspace info', () => {
      cy.visit(`${BASE_PATH}/w/${sourceWorkspaceId}/app/visualize`);
      cy.getElementByTestId('visListingTitleLink-[eCommerce]-Markdown').click();
      cy.getElementByTestId('shareTopNavButton')
        .click()
        .getElementByTestId('sharePanel-Permalinks')
        .click()
        .getElementByTestId('useShortUrl')
        .as('generateShortUrlButton')
        .click();

      // Should generate successfully
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .should('include', `${BASE_PATH}/goto`);

      // Regeneration should work without error
      cy.get('@generateShortUrlButton').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .should('include', `${BASE_PATH}/w/${sourceWorkspaceId}`);
      cy.get('@generateShortUrlButton').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .then((shortUrl) => {
          cy.wrap(shortUrl).should('include', `${BASE_PATH}/goto`);
          cy.visit(`${BASE_PATH}/w/${sourceWorkspaceId}/app/objects`);
          cy.contains('Workspace assets');
          cy.visit(shortUrl);
          cy.location('pathname').should('include', `/w/${sourceWorkspaceId}`);
          cy.contains('[eCommerce] Markdown');
        });
    });
  });
}