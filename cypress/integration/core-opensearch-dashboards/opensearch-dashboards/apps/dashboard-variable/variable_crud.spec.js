/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { BASE_PATH } from '../../../../../utils/base_constants';
import {
  enterEditMode,
  openAddVariableEditor,
  saveVariableEditor,
  openEditForVariable,
  deleteVariable,
} from '../../../../../utils/dashboards/dashboard_variable/helpers.js';

const miscUtils = new MiscUtils(cy);
const WORKSPACE_NAME = 'test_workspace_variable';
const DASHBOARD_NAME = 'variable_crud_test_dashboard';
const MDSEnabled = Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

if (Cypress.env('WORKSPACE_ENABLED')) {
  describe('Dashboard Variables CRUD', () => {
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
          // Load eCommerce sample data so the workspace has real content
          cy.loadSampleDataForWorkspace('ecommerce', id, dsId);
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
        cy.removeSampleDataForWorkspace('ecommerce', workspaceId, datasourceId);
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
    describe('Create variable', () => {
      it('should create query type variable', () => {
        openAddVariableEditor();

        // Verify default type is Query
        cy.getElementByTestId('variableEditorType').should(
          'contain.text',
          'Query'
        );

        // Fill in the query variable form
        cy.getElementByTestId('variableEditorName')
          .clear()
          .type('customer_gender');
        cy.getElementByTestId('variableEditorLabel')
          .clear()
          .type('Customer Gender');

        // Select dataset
        cy.getElementByTestId('datasetSelectButton').click();
        cy.contains('opensearch_dashboards_sample_data_ecommerce').click();

        // Input query in the editor
        cy.getElementByTestId('variableQueryPanelEditor')
          .find('textarea')
          .click({ force: true })
          .focused()
          .type(
            'SOURCE = opensearch_dashboards_sample_data_ecommerce | FIELDS customer_gender',
            { force: true }
          );

        cy.getElementByTestId('variableQueryPanelRunQuery').click();

        // Verify preview shows values with count > 0
        cy.contains(/Preview of values \([1-9]\d*\)/, {
          timeout: 10000,
        }).should('be.visible');

        cy.get('.euiBadge__text').should('have.length.greaterThan', 0);
        cy.get('.euiBadge__text').first().should('not.be.empty');

        saveVariableEditor();

        // Verify the variable is created
        cy.getElementByTestId('variable-customer_gender').should('be.visible');
      });

      it('should create custom type variable', () => {
        openAddVariableEditor();

        cy.getElementByTestId('variableEditorType').click();
        cy.contains('Custom').click();

        cy.getElementByTestId('variableEditorName').clear().type('env');
        cy.getElementByTestId('variableEditorLabel')
          .clear()
          .type('Environment');
        cy.getElementByTestId('variableEditorDescription')
          .clear()
          .type('Environment');

        const customOptions = ['production', 'staging', 'development'];
        customOptions.forEach((opt) => {
          cy.getElementByTestId('variableEditorCustomValues')
            .find('input')
            .type(`${opt}{enter}`);
        });

        saveVariableEditor();
        cy.getElementByTestId('variable-env').should('be.visible');
      });

      it('should display and interact with variables in the bar', () => {
        // Verify variables are visible
        cy.getElementByTestId('variable-env').should('be.visible');
        cy.getElementByTestId('variable-customer_gender').should('be.visible');

        // Verify current value is displayed
        cy.getElementByTestId('variable-env')
          .find(`[data-test-subj="${'variable-selector-current'}"]`)
          .should('not.be.empty');

        // Test collapse and expand
        cy.getElementByTestId('toggleVariablesBarButton').click();
        cy.getElementByTestId('variable-env').should('not.exist');
        cy.getElementByTestId('toggleVariablesBarButton').click();
        cy.getElementByTestId('variable-env').should('be.visible');

        // Test opening dropdown and viewing options
        cy.getElementByTestId('variable-env')
          .find(`[data-test-subj="${'variable-selector-button'}"]`)
          .click();
        cy.get('.euiSelectable').should('be.visible');
        cy.contains('production').should('be.visible');
        cy.contains('staging').should('be.visible');
        cy.contains('development').should('be.visible');

        // Test selecting a value
        cy.contains('staging').click();
        cy.getElementByTestId('variable-env')
          .find(`[data-test-subj="${'variable-selector-current'}"]`)
          .should('contain', 'staging');
      });

      it('should validate variable editor form and show appropriate errors', () => {
        // Empty name error
        openAddVariableEditor();
        cy.getElementByTestId('variableEditorSave').click();
        cy.contains('Variable name is required').should('be.visible');

        // Invalid name error
        cy.getElementByTestId('variableEditorName').clear().type('1invalid');
        cy.getElementByTestId('variableEditorSave').click();

        // Duplicate variable name error
        cy.getElementByTestId('variableEditorName').clear().type('env');
        cy.getElementByTestId('variableEditorSave').click();
        cy.contains(
          `The name "env" conflicts with an existing variable name or label`
        ).should('be.visible');

        // No query provided error for query type variable
        cy.getElementByTestId('variableEditorName').clear().type('emptyVar');
        cy.getElementByTestId('variableEditorSave').click();
        cy.contains(`Query is required for Query type variables`).should(
          'be.visible'
        );

        // No run query error for query type variable
        cy.getElementByTestId('variableQueryPanelEditor')
          .find('textarea')
          .click({ force: true })
          .focused()
          .type(
            'SOURCE = opensearch_dashboards_sample_data_ecommerce | FIELDS customer_gender',
            { force: true }
          );
        cy.getElementByTestId('variableEditorSave').click();
        cy.contains(
          `You must preview the query successfully before saving`
        ).should('be.visible');

        // No options provided error for custom type variable
        cy.getElementByTestId('variableEditorType').click();
        cy.contains('Custom').click();
        cy.getElementByTestId('variableEditorName').clear().type('emptyVar');
        cy.getElementByTestId('variableEditorSave').click();
        cy.contains(
          `Custom values are required for Custom type variables`
        ).should('be.visible');
      });
    });

    describe('Edit variable', () => {
      it('should open management panel and list all variables', () => {
        cy.getElementByTestId('manageVariablesButton').click();
        cy.getElementByTestId('variableManagementPanel').should('be.visible');
        cy.contains('Manage variables').should('be.visible');

        // Verify variables are listed
        cy.getElementByTestId('variableManagementPanel')
          .contains('env')
          .should('be.visible');
        cy.getElementByTestId('variableManagementPanel')
          .contains('customer_gender')
          .should('be.visible');

        cy.contains('button', 'Close').click();
        cy.getElementByTestId('variableManagementPanel').should('not.exist');
      });

      it('should edit variable and update label and options', () => {
        // Verify pre-filled values
        openEditForVariable('env');
        cy.getElementByTestId('variableEditorName').should('have.value', 'env');
        cy.getElementByTestId('variableEditorLabel').should(
          'have.value',
          'Environment'
        );
        cy.getElementByTestId('variableEditorDescription').should(
          'have.value',
          'Environment'
        );

        // Update the label
        cy.getElementByTestId('variableEditorLabel')
          .clear()
          .type('Env Updated');
        cy.getElementByTestId('variableEditorSave').click();
        cy.contains('Variable updated').should('be.visible');
        cy.getElementByTestId('variableEditorPanel').should('not.exist');
        cy.getElementByTestId('variable-env').should('be.visible');

        // Add a new option
        openEditForVariable('env');
        cy.getElementByTestId('variableEditorCustomValues')
          .find('input')
          .type('canary{enter}');
        cy.getElementByTestId('variableEditorSave').click();
        cy.contains('Variable updated').should('be.visible');
        cy.getElementByTestId('variableEditorPanel').should('not.exist');

        // Verify new option appears in dropdown
        cy.getElementByTestId('variable-env')
          .find(`[data-test-subj="${'variable-selector-button'}"]`)
          .click();
        cy.get('.euiSelectable').should('be.visible');
        cy.contains('canary').should('be.visible');
        cy.get('body').click(0, 0);
      });

      it('should hide and show variable from the bar', () => {
        cy.getElementByTestId('manageVariablesButton').click();
        cy.getElementByTestId('variableManagementPanel').should('be.visible');

        // Hide 'env'
        cy.getElementByTestId('variableManagementPanel')
          .contains('env')
          .closest('[class*="euiPanel"]')
          .find('[aria-label="Hide variable"]')
          .click();

        cy.getElementByTestId('variableManagementPanel')
          .contains('env')
          .closest('[class*="euiPanel"]')
          .contains('Hidden')
          .should('be.visible');

        cy.contains('button', 'Close').click();
        cy.getElementByTestId('variable-env').should('not.exist');

        // Show the variable again
        cy.getElementByTestId('manageVariablesButton').click();
        cy.getElementByTestId('variableManagementPanel')
          .contains('env')
          .closest('[class*="euiPanel"]')
          .find('[aria-label="Show variable"]')
          .click();
        cy.contains('button', 'Close').click();
        cy.getElementByTestId('variable-env').should('be.visible');
      });
    });

    describe('Delete variable', () => {
      it('should delete variables and remove them from the bar', () => {
        deleteVariable('customer_gender');
        cy.getElementByTestId('variable-customer_gender').should('not.exist');

        deleteVariable('env');
        cy.getElementByTestId('variable-env').should('not.exist');
      });
    });
  });
}
