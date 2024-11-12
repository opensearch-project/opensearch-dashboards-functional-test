/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const workspaceName = `test_workspace_search_${Math.random()
  .toString(36)
  .substring(7)}`;
let workspaceDescription = 'This is a  search workspace description.';
let workspaceId;
let datasourceId;
let workspaceFeatures = ['use-case-search'];

const MDSEnabled = Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

if (Cypress.env('WORKSPACE_ENABLED')) {
  const createWorkspace = (datasourceId) => {
    cy.createWorkspace({
      name: workspaceName,
      description: workspaceDescription,
      features: workspaceFeatures,
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

  describe('Search workspace overview', () => {
    before(() => {
      cy.deleteWorkspaceByName(workspaceName);
      if (MDSEnabled) {
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
      // Visit workspace update page
      miscUtils.visitPage(`w/${workspaceId}/app/search_overview`);
      // wait for page load
      cy.contains('h1', 'Overview');
    });

    it('Set up search cards display correctly', () => {
      cy.contains(
        'Explore search capabilities and functionality of OpenSearch.'
      );
      cy.contains(
        'Create a document collection (an index) to query your data.'
      );

      cy.contains('Explore data to uncover and discover insights.').click();
      // verify url has app/data-explorer/discover
      cy.url().should('include', 'app/data-explorer/discover');
    });

    it('Different search techniques section display correctly', () => {
      cy.contains('h3', 'Text search').should('be.visible');
      cy.contains('h3', 'Analyzers').should('be.visible');
      cy.contains('h3', 'Semantic vector search').should('be.visible');
      cy.contains('h3', 'Neural sparse search').should('be.visible');
      cy.contains('h3', 'Hybrid search').should('be.visible');
    });

    it('Configure and evaluate search cards display correctly', () => {
      cy.contains('Compare search results').should('be.visible').click();
      cy.url().should('contains', 'app/searchRelevance');
    });
  });
}
