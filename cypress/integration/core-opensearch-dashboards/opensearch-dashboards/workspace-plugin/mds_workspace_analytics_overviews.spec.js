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
let datasourceId;
let workspaceFeatures = ['use-case-all'];

const MDSEnabled = Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

if (Cypress.env('WORKSPACE_ENABLED')) {
  const createWorkspace = (dsId) => {
    cy.createWorkspace({
      name: workspaceName,
      description: workspaceDescription,
      features: workspaceFeatures,
      settings: {
        permissions: {
          library_write: { users: ['%me%'] },
          write: { users: ['%me%'] },
        },
        ...(dsId ? { dataSources: [dsId] } : {}),
      },
    }).then((value) => {
      workspaceId = value;
      // load sample data
      cy.loadSampleDataForWorkspace('ecommerce', value, dsId);
    });
  };

  describe('Analytics workspace overview', () => {
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
      miscUtils.visitPage(`w/${workspaceId}/app/all_overview`);
      // wait for page load
      cy.contains('h1', 'Overview');
    });

    it('should display get started sections', () => {
      cy.get('.euiCard__footer').contains('Observability').should('be.visible');
      // this is depends on observability plugin been installed
      // cy.url().should('include', 'app/observability-overview');

      cy.get('.euiCard__footer')
        .contains('Security Analytics')
        .should('be.visible');
      // this is depends on security analytics plugin been installed
      // cy.url().should('include', 'app/sa_overview');

      cy.get('.euiCard__footer')
        .contains('Search')
        .should('be.visible')
        .click();
      cy.url().should('include', 'app/search_overview');
    });

    it('should display asset section correctly', () => {
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

    // Alerts and threat Alerts cards are depends on plugins

    it('should display OpenSearch Documentation panel', () => {
      cy.contains('OpenSearch Documentation').should('be.visible');
      cy.get('.euiLink')
        .contains('Quickstart guide')
        .should('be.visible')
        .and('have.attr', 'href')
        .and((href) => {
          expect(href).to.match(
            /https:\/\/opensearch.org\/docs\/(latest|(\d.)+)\/dashboards\/quickstart\/$/
          );
        });
      cy.get('.euiLink')
        .contains('Building data visualizations')
        .should('be.visible')
        .and('have.attr', 'href')
        .and((href) => {
          expect(href).to.match(
            /https:\/\/opensearch.org\/docs\/(latest|(\d.)+)\/dashboards\/visualize\/viz-index\/$/
          );
        });
      cy.get('.euiLink')
        .contains('Creating dashboards')
        .should('be.visible')
        .and('have.attr', 'href')
        .and((href) => {
          expect(href).to.match(
            /https:\/\/opensearch.org\/docs\/(latest|(\d.)+)\/dashboards\/dashboard\/index\/$/
          );
        });
      cy.contains('Learn more in Documentation')
        .should('be.visible')
        .and('have.attr', 'href')
        .and((href) => {
          expect(href).to.match(
            /https:\/\/opensearch.org\/docs\/(latest|(\d.)+)\/dashboards\/index\/$/
          );
        });
    });
  });
}
