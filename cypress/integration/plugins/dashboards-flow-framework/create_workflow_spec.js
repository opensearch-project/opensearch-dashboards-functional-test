/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FF_URL,
  FF_FIXTURE_BASE_PATH,
  WORKFLOW_DETAIL_URL_SEGMENT,
  FF_TIMEOUT,
} from '../../../utils/constants';
import createConnectorBody from '../../../fixtures/plugins/dashboards-flow-framework/create_connector.json';
import registerModelBody from '../../../fixtures/plugins/dashboards-flow-framework/register_model.json';
import { CURRENT_TENANT } from '../../../utils/commands';

describe('Creating Workflows Using Various Methods', () => {
  var modelId = '';

  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.createConnector(createConnectorBody)
      .then((connectorResponse) => {
        return cy.registerModel({
          body: {
            ...registerModelBody,
            connector_id:
              connectorResponse?.connector_id || 'test_connector_id',
            function_name: 'remote',
          },
        });
      })
      .then((modelResponse) => {
        modelId = modelResponse.model_id;
        return cy.deployMLCommonsModel(modelId);
      });
  });

  beforeEach(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.wait(20000);
    cy.visit(FF_URL.WORKFLOWS, { timeout: FF_TIMEOUT });
  });

  it('Import workflow with valid configuration', () => {
    CURRENT_TENANT.newTenant = 'global';
    cy.wait(20000);
    cy.getElementByDataTestId('importWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click({ force: true });
    cy.contains('Import a workflow (JSON/YAML)').should('be.visible');
    const filePath =
      'cypress/fixtures/' +
      FF_FIXTURE_BASE_PATH +
      'semantic_search/import_workflow.json';
    cy.get('input[type=file]').selectFile(filePath);
    cy.getElementByDataTestId('importJSONButton').should('be.visible').click();
    cy.get('.euiFieldSearch').should('be.visible').focus();
    cy.wait(1000);
    cy.get('.euiFieldSearch')
      .should('be.visible')
      .type('semantic_search_1{enter}');
    cy.contains('semantic_search_1');
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
    cy.get('.euiTableRow').first().find('button.euiButtonIcon--danger').click();
    cy.contains('The workflow will be permanently deleted.').should('exist');
    cy.getElementByDataTestId('deleteWorkflowButton')
      .should('be.visible')
      .click();
  });

  it('Attempt to import workflow with invalid configuration', () => {
    cy.getElementByDataTestId('importWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.contains('Import a workflow (JSON/YAML)').should('be.visible');
    const filePath =
      'cypress/fixtures/' +
      FF_FIXTURE_BASE_PATH +
      'semantic_search/search_query.json';
    cy.get('input[type=file]').selectFile(filePath);
    cy.contains('The uploaded file is not a valid workflow').should(
      'be.visible'
    );
  });

  it('Create workflow using custom search template', () => {
    cy.getElementByDataTestId('createWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.contains('h3', 'Custom Search', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .parents('.euiCard')
      .within(() => {
        cy.contains('button', 'Create').click();
      });
    cy.contains('label', 'Name')
      .invoke('attr', 'for')
      .then((id) => {
        cy.get(`#${id}`).clear().type('custom_search');
      });
    cy.getElementByDataTestId('quickConfigureCreateButton')
      .should('be.visible')
      .click();
    cy.url().should('include', '/workflows/');
    cy.getElementByDataTestId('selectDataToImportButton')
      .should('be.visible')
      .click();
    cy.get(`[data-text="Upload a file"]`).should('be.visible').click();
    const filePath = `cypress/fixtures/${FF_FIXTURE_BASE_PATH}semantic_search/source_data.jsonl`;
    cy.get('input[type=file]').selectFile(filePath);
    cy.getElementByDataTestId('updateSourceDataButton')
      .should('be.visible')
      .click();

    cy.mockIngestion(() => {
      cy.getElementByTestId('updateAndRunIngestButton')
        .should('be.visible')
        .click();
    });
    cy.sa_getElementByText('button.euiTab', 'Ingest response')
      .should('be.visible')
      .click();
    cy.fixture(FF_FIXTURE_BASE_PATH + 'semantic_search/ingest_response').then(
      () => {
        cy.get('#tools_panel_id').should('be.visible');
      }
    );
    cy.getElementByDataTestId('searchPipelineButton')
      .should('be.visible')
      .click();
    cy.getElementByDataTestId('queryEditButton').should('be.visible').click();
    cy.get('[data-testid="editQueryModalBody"]').within(() => {
      cy.fixture(
        FF_FIXTURE_BASE_PATH + 'semantic_search/search_query.json'
      ).then((jsonData) => {
        const jsonString = JSON.stringify(jsonData);
        cy.get('.ace_text-input')
          .focus()
          .clear({ force: true })
          .focus()
          .wait(2000)
          .type(jsonString, {
            force: true,
            parseSpecialCharSequences: false,
            delay: 5,
          })
          .trigger('blur', { force: true });
      });
    });
    cy.getElementByDataTestId('updateSearchQueryButton')
      .should('be.visible')
      .click();
  });

  it('Create workflow from semantic search template', () => {
    createPresetWithMockedModels('Semantic Search');
  });

  it('Create workflow from hybrid search template', () => {
    createPresetWithMockedModels('Hybrid Search', true);
  });

  it('Create workflow from multimodal template', () => {
    createPresetWithMockedModels('Multimodal Search', true);
  });

  after(() => {
    if (modelId != '') {
      cy.undeployMLCommonsModel(modelId).then(() =>
        cy.deleteMLCommonsModel(modelId)
      );
    }
  });
});

function createPresetWithMockedModels(presetName) {
  cy.mockModelSearch(() => {
    createPreset(presetName, true);
  });
}

// Reusable fn to check the preset exists, and able to create it, and navigate to its details page.
function createPreset(presetName, containsModels = false) {
  cy.getElementByDataTestId('createWorkflowButton', { timeout: FF_TIMEOUT })
    .should('be.visible')
    .click();
  cy.contains('h3', presetName, { timeout: FF_TIMEOUT })
    .should('be.visible')
    .parents('.euiCard')
    .within(() => {
      cy.contains('button', 'Create').click();
    });
  cy.contains('label', 'Name')
    .invoke('attr', 'for')
    .then((id) => {
      cy.get(`#${id}`)
        .clear()
        .type(presetName.toLowerCase().replace(/\s/g, ''));
    });
  if (containsModels) {
    cy.getElementByDataTestId('selectDeployedModel')
      .should('be.visible')
      .click();
    cy.get('.euiSuperSelect__item').contains('BedRock').click();
  }
  cy.getElementByDataTestId('quickConfigureCreateButton')
    .should('be.visible')
    .click();
  cy.url().should('include', WORKFLOW_DETAIL_URL_SEGMENT);
}
