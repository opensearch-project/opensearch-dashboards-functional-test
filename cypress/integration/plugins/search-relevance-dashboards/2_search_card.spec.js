/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const workspaceName = `test_workspace_search_${Math.random()
  .toString(36)
  .substring(7)}`;
let workspaceId;
let datasourceId;

if (Cypress.env('WORKSPACE_ENABLED')) {
  const createWorkspace = (datasourceId) => {
    cy.createWorkspace({
      name: workspaceName,
      features: ['use-case-search'],
      settings: {
        permissions: {
          library_write: { users: ['%me%'] },
          write: { users: ['%me%'] },
        },
        ...(datasourceId ? { dataSources: [datasourceId] } : {}),
      },
    }).then((value) => {
      workspaceId = value;
    });
  };

  describe('Search card', () => {
    before(() => {
      cy.deleteWorkspaceByName(workspaceName);
      if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
        cy.deleteAllDataSources();
        cy.createDataSourceNoAuth().then((result) => {
          datasourceId = result[0];
          expect(datasourceId).to.be.a('string').that.is.not.empty;
          createWorkspace(datasourceId);
        });
      } else {
        createWorkspace();
      }
    });

    after(() => {
      if (workspaceId) {
        cy.deleteWorkspaceById(workspaceId);
      }
      cy.deleteAllDataSources();
    });

    beforeEach(() => {
      // Visit workspace overview page
      miscUtils.visitPage(`w/${workspaceId}/app/search_overview`);
      // wait for page load
      cy.contains('h1', 'Overview');
    });

    it('Configure and evaluate search cards should display correctly', () => {
      cy.contains('Compare search results').should('be.visible').click();
      cy.url().should('contains', 'app/searchRelevance');
    });
  });
}
