/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { BASE_PATH } from '../../../../../utils/base_constants';
import { enterEditMode } from '../../../../../utils/dashboards/dashboard_variable/helpers.js';

const miscUtils = new MiscUtils(cy);
const WORKSPACE_NAME = 'test_workspace_variable';
const DASHBOARD_NAME = 'variable_crud_test_dashboard';
const MDSEnabled = Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');
const EXPLORE_NAME = 'Explore With Variable';

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Dashboard Variables Interaction', () => {
    let workspaceId;
    let datasourceId;
    let dashboardId;

    before(() => {
      cy.deleteWorkspaceByName(WORKSPACE_NAME);

      const createWorkspaceWithSampleData = (dsId) => {
        cy.createWorkspace({
          name: WORKSPACE_NAME,
          features: ['use-case-observability'],
          settings: {
            permissions: {
              library_write: { users: ['%me%'] },
              write: { users: ['%me%'] },
            },
            ...(dsId ? { dataSources: [dsId] } : {}),
          },
        }).then((id) => {
          workspaceId = id;
          cy.loadSampleDataForWorkspace('flights', id, dsId);
        });
      };

      if (MDSEnabled) {
        cy.deleteAllDataSources();
        cy.createDataSourceNoAuth().then((result) => {
          datasourceId = result[0];
          expect(datasourceId).to.be.a('string').that.is.not.empty;
          createWorkspaceWithSampleData(datasourceId);
        });
      } else {
        createWorkspaceWithSampleData();
      }
    });

    after(() => {
      if (workspaceId) {
        cy.removeSampleDataForWorkspace('flights', workspaceId, datasourceId);
        cy.deleteWorkspaceById(workspaceId);
      }
      if (MDSEnabled) {
        cy.deleteAllDataSources();
      }
    });

    before(() => {
      const url = `${BASE_PATH}/w/${workspaceId}/api/saved_objects/dashboard`;

      cy.request({
        method: 'POST',
        url,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        body: JSON.stringify({
          attributes: {
            title: DASHBOARD_NAME,
            description: 'Test dashboard for variable CRUD operations',
            variablesJSON:
              '{"variables":[{"current":["max"],"customOptions":["max","min","avg"],"id":"test-id","includeAll":false,"multi":false,"name":"function","type":"custom"}]}',
          },
        }),
      }).then((response) => {
        expect(response.status).to.equal(200);
        dashboardId = response.body.id;
        cy.log(`Dashboard created with ID: ${dashboardId}`);
      });
    });

    beforeEach(() => {
      miscUtils.visitPage(
        `w/${workspaceId}/app/dashboards#/view/${dashboardId}`
      );
      cy.reload();
      enterEditMode();
    });
    it('should interact with explore visualization in query editor page', () => {
      cy.getElementByTestId('dashboardAddPanelButton')
        .should('be.visible')
        .click();
      cy.getElementByTestId(
        'embeddablePanelAction-add_vis_action_VisualizationEditor'
      )
        .should('be.visible')
        .click();

      cy.getElementByTestId('dashboardVariablesBar')
        .should('exist')
        .getElementByTestId('variable-function')
        .should('be.visible');

      // Verify current value is displayed
      cy.getElementByTestId('variable-function')
        .find('[data-test-subj="variable-selector-current"]')
        .should('not.be.empty')
        .and('contain', 'max');

      cy.getElementByTestId('visEditorUninitialized')
        .contains('Run a query to visualize your data')
        .should('be.visible');

      // Select dataset
      cy.getElementByTestId('datasetSelectButton').click();
      cy.contains('opensearch_dashboards_sample_data_flights').click();

      // Input query in the editor
      cy.getElementByTestId('exploreQueryPanelEditor')
        .find('textarea')
        .click({ force: true })
        .focused()
        .type('{esc}', { force: true })
        .type(
          'source=opensearch_dashboards_sample_data_flights| where `FlightDelay` = true | stats ${function}(`FlightDelayMin`) as ${function}_delay by `OriginWeather`, `DestWeather`',
          { force: true, parseSpecialCharSequences: false }
        );

      cy.intercept('POST', '**/api/enhancements/search/ppl').as('pplSearch');

      cy.getElementByTestId('exploreQueryExecutionButton').click();

      cy.wait('@pplSearch').then((interception) => {
        const query = interception.request.body.query.query;
        expect(query).to.not.include('${function}');
        expect(query).to.include('max(`FlightDelayMin`) as max_delay');
      });

      cy.getElementByTestId('saveVisualizationEditorButton').click();

      cy.get('.euiModal').should('be.visible');
      cy.getElementByTestId('saveVisModalTitle').should(
        'contain',
        'Save your visualization'
      );

      cy.get('input[placeholder="Enter save search name"]')
        .should('be.visible')
        .type(EXPLORE_NAME);

      cy.getElementByTestId('saveVisandBackToDashboardConfirmButton')
        .should('not.be.disabled')
        .click();

      cy.url({ timeout: 30000 }).should('include', '/app/dashboards#/view/');

      cy.getElementByTestId('dashboardSaveMenuItem')
        .should('be.visible')
        .click();

      cy.getElementByTestId('confirmSaveSavedObjectButton')
        .should('be.visible')
        .click();

      cy.contains(`Dashboard '${DASHBOARD_NAME}' was saved`).should('be.exist');
    });

    it('should interact with explore visualization in dashboard page', () => {
      cy.getElementByTestId('dashboardVariablesBar')
        .should('exist')
        .getElementByTestId('variable-function')
        .should('be.visible');

      cy.getElementByTestId('variable-function')
        .find('[data-test-subj="variable-selector-current"]')
        .should('not.be.empty')
        .and('contain', 'max');

      cy.getElementByTestId('dashboardPanel').should('be.visible');

      cy.get('[data-test-subj="dashboardPanelTitle"]')
        .first()
        .should('be.visible')
        .and('contain.text', EXPLORE_NAME);

      cy.getElementByTestId('embeddedSavedExplore').should('be.visible');

      cy.intercept('POST', '**/api/enhancements/search/ppl').as('pplSearch');

      cy.getElementByTestId('variable-function')
        .find('[data-test-subj="variable-selector-button"]')
        .click();
      cy.get('.euiSelectable')
        .should('be.visible')
        .contains('avg')
        .should('be.visible')
        .click();

      cy.getElementByTestId('variable-function')
        .find('[data-test-subj="variable-selector-current"]')
        .should('contain', 'avg');

      cy.wait('@pplSearch').then((interception) => {
        const query = interception.request.body.query.query;
        expect(query).to.not.include('${function}');
        expect(query).to.include('avg(`FlightDelayMin`) as avg_delay');
      });
    });
  });
}
