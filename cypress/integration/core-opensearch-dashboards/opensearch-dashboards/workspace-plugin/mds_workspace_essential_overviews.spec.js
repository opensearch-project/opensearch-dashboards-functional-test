/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const workspaceName = `test_workspace_${Math.random()
  .toString(36)
  .substring(7)}`;
let workspaceDescription = 'This is a workspace description.';
let workspaceId;
let datasourceId;
let workspaceFeatures = ['use-case-essentials'];

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
      // load sample data
      cy.loadSampleDataForWorkspace('ecommerce', value, datasourceId);
    });
  };

  describe('Essential workspace overview', () => {
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
        cy.removeSampleDataForWorkspace('ecommerce', workspaceId, datasourceId);
        cy.deleteWorkspaceById(workspaceId);
      }
      cy.deleteAllDataSources();
    });

    beforeEach(() => {
      // Visit workspace update page
      miscUtils.visitPage(`w/${workspaceId}/app/essentials_overview`);
      // wait for page load
      cy.contains('h1', 'Overview');
    });

    it('Get started cards display correctly', () => {
      // verify four get started cards exist
      cy.contains('Install sample data to experiment with OpenSearch.').click();
      // verify url has app/import_sample_data
      cy.url().should('include', 'app/import_sample_data');

      // browser back
      cy.go('back');
      cy.contains('Explore data to uncover and discover insights.').click();
      // verify url has app/data-explorer/discover
      cy.url().should('include', 'app/data-explorer/discover');

      // browser back
      cy.go('back');
      cy.contains(
        'Gain deeper insights by visualizing and aggregating your data.'
      ).click();
      // verify url has app/visualize
      cy.url().should('include', 'app/visualize');

      cy.go('back');
      cy.contains(
        'Monitor and explore your data using dynamic data visualization tools.'
      ).click();
      // verify url has app/dashboards
      cy.url().should('include', 'app/dashboards');
    });

    it('Assets cards display correctly', () => {
      // no recently view assets
      cy.contains('No assets to display');

      // recentlyCard
      cy.contains('Recently updated').should('be.visible').click();
      // should have 6 elements
      cy.getElementByTestId('recentlyCard').should('have.length', 6);

      // filter by dashboard
      cy.getElementByTestId('comboBoxInput').click();
      cy.get('span.euiComboBoxOption__content').contains('dashboard').click();

      // click dashboard card
      cy.getElementByTestId('recentlyCard').first().click();

      // verify url has /app/dashboards
      cy.url().should('include', 'app/dashboards');

      cy.go('back');

      // view all
      cy.contains('View all').click();
      // verify url has /app/objects
      cy.url().should('include', 'app/objects');
    });

    it('Opensearch documentation cards display correctly', () => {
      cy.contains('OpenSearch Documentation');

      // get a link with text as Quickstart guide
      cy.get('a')
        .contains('Quickstart guide')
        .should(
          'have.attr',
          'href',
          'https://opensearch.org/docs/latest/dashboards/quickstart/'
        );

      cy.get('a')
        .contains('Building data visualizations')
        .should(
          'have.attr',
          'href',
          'https://opensearch.org/docs/latest/dashboards/visualize/viz-index/'
        );

      cy.get('a')
        .contains('Creating dashboards')
        .should(
          'have.attr',
          'href',
          'https://opensearch.org/docs/latest/dashboards/dashboard/index/'
        );
    });
  });
}
