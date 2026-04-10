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
  var connectorId = '';

  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.deleteAllFlowFrameworkWorkflows();
    cy.createConnector(createConnectorBody).then((connectorResponse) => {
      if (connectorResponse !== undefined) {
        connectorId = connectorResponse.connector_id || '';
        if (connectorId !== '') {
          cy.registerModel({
            body: {
              ...registerModelBody,
              connector_id: connectorResponse.connector_id,
              function_name: 'remote',
            },
          }).then((modelResponse) => {
            modelId = modelResponse.model_id;
            return cy.deployMLCommonsModel(modelId);
          });
        }
      }
    });
  });

  beforeEach(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.visit(FF_URL.WORKFLOWS, { timeout: FF_TIMEOUT });
    // Wait for the page to fully load by checking for a key UI element
    cy.getElementByDataTestId('importWorkflowButton', {
      timeout: FF_TIMEOUT,
    }).should('be.visible');
  });

  it('Import workflow with valid configuration', () => {
    cy.getElementByDataTestId('importWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click({ force: true });
    cy.contains('Import a workflow (JSON/YAML)', {
      timeout: FF_TIMEOUT,
    }).should('be.visible');
    const filePath =
      'cypress/fixtures/' +
      FF_FIXTURE_BASE_PATH +
      'semantic_search/import_workflow.json';
    cy.get('input[type=file]').selectFile(filePath);
    cy.getElementByDataTestId('importJSONButton')
      .should('be.visible')
      .should('be.enabled')
      .click();
    cy.get('.euiFieldSearch', { timeout: FF_TIMEOUT }).should('be.visible');
    cy.wait(1000);
    cy.get('.euiFieldSearch')
      .should('be.visible')
      .clear()
      .type('semantic_search_1{enter}');
    cy.contains('semantic_search_1', { timeout: FF_TIMEOUT }).should(
      'be.visible'
    );
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
    cy.get('.euiTableRow')
      .first()
      .find('button.euiButtonIcon--danger')
      .should('be.visible')
      .click();
    cy.contains('The workflow will be permanently deleted.', {
      timeout: FF_TIMEOUT,
    }).should('be.visible');
    cy.getElementByDataTestId('deleteWorkflowButton')
      .should('be.visible')
      .should('be.enabled')
      .click();
  });

  it('Attempt to import workflow with invalid configuration', () => {
    cy.getElementByDataTestId('importWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click({ force: true });
    cy.contains('Import a workflow (JSON/YAML)', {
      timeout: FF_TIMEOUT,
    }).should('be.visible');
    const filePath =
      'cypress/fixtures/' +
      FF_FIXTURE_BASE_PATH +
      'semantic_search/search_query.json';
    cy.get('input[type=file]').selectFile(filePath);
    cy.contains('The uploaded file is not a valid workflow', {
      timeout: FF_TIMEOUT,
    }).should('be.visible');
    cy.contains('button', 'Cancel', { timeout: FF_TIMEOUT }).click();
  });

  it('Create workflow using custom search template', () => {
    cy.getElementByDataTestId('createWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.contains('h3', 'Custom Search', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .parents('.euiCard')
      .within(() => {
        cy.contains('button', 'Create').should('be.visible').click();
      });
    cy.contains('label', 'Name', { timeout: FF_TIMEOUT })
      .invoke('attr', 'for')
      .then((id) => {
        cy.get(`#${id}`).clear().type('custom_search');
      });
    cy.getElementByDataTestId('quickConfigureCreateButton', {
      timeout: FF_TIMEOUT,
    })
      .should('be.visible')
      .should('be.enabled')
      .click();
    cy.url({ timeout: FF_TIMEOUT }).should('include', '/workflows/');
    cy.getElementByDataTestId('selectDataToImportButton', {
      timeout: FF_TIMEOUT,
    })
      .should('be.visible')
      .click();
    cy.get(`[data-text="Upload a file"]`, { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    const filePath = `cypress/fixtures/${FF_FIXTURE_BASE_PATH}semantic_search/source_data.jsonl`;
    cy.get('input[type=file]').selectFile(filePath);
    cy.get('.ace_content', { timeout: FF_TIMEOUT })
      .first()
      .click({ force: true });
    cy.get('body').click(0, 0);
    cy.getElementByDataTestId('updateSourceDataButton', {
      timeout: FF_TIMEOUT,
    })
      .should('be.visible')
      .should('be.enabled')
      .click();

    cy.mockIngestion(() => {
      cy.getElementByTestId('updateAndRunIngestButton', {
        timeout: FF_TIMEOUT,
      })
        .should('be.visible')
        .click();
    });
    // Checking Run ingestion response
    cy.get('button.euiTab', { timeout: FF_TIMEOUT })
      .contains('Ingest response')
      .should('be.visible')
      .click();
    cy.fixture(FF_FIXTURE_BASE_PATH + 'semantic_search/ingest_response').then(
      () => {
        cy.get('#tools_panel_id', { timeout: FF_TIMEOUT }).should('be.visible');
      }
    );
    cy.getElementByDataTestId('searchPipelineButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.getElementByDataTestId('queryEditButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.get('[data-testid="editQueryModalBody"]', {
      timeout: FF_TIMEOUT,
    }).within(() => {
      cy.fixture(
        FF_FIXTURE_BASE_PATH + 'semantic_search/search_query.json'
      ).then((jsonData) => {
        const jsonString = JSON.stringify(jsonData);
        cy.get('.ace_text-input')
          .should('exist')
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
    cy.getElementByDataTestId('updateSearchQueryButton', {
      timeout: FF_TIMEOUT,
    })
      .should('be.visible')
      .should('be.enabled')
      .click();
  });

  it('Create workflow from semantic search template', () => {
    createPresetWithModels('Semantic Search', connectorId, modelId);
  });

  it('Create workflow from hybrid search template', () => {
    createPresetWithModels('Hybrid Search', connectorId, modelId);
  });

  it('Create workflow from multimodal template', () => {
    createPresetWithModels('Multimodal Search', connectorId, modelId);
  });

  after(() => {
    cy.deleteAllFlowFrameworkWorkflows();
    if (modelId != '') {
      cy.undeployMLCommonsModel(modelId).then(() =>
        cy.deleteMLCommonsModel(modelId)
      );
    }
  });
});

/**
 * Conditionally mock deployed models if there are missing ML resources (connector, model IDs)
 */
function createPresetWithModels(presetName, connectorId, modelId) {
  if (connectorId !== '' && modelId !== '') {
    createPreset(presetName, true);
  } else {
    cy.mockModelSearch(() => {
      createPreset(presetName, true);
    });
  }
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
      cy.contains('button', 'Create').should('be.visible').click();
    });
  cy.contains('label', 'Name', { timeout: FF_TIMEOUT })
    .invoke('attr', 'for')
    .then((id) => {
      cy.get(`#${id}`)
        .clear()
        .type(presetName.toLowerCase().replace(/\s/g, ''));
    });
  if (containsModels) {
    cy.getElementByDataTestId('selectDeployedModel', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.get('.euiSuperSelect__item', { timeout: FF_TIMEOUT })
      .contains('BedRock')
      .click();
  }
  cy.getElementByDataTestId('quickConfigureCreateButton', {
    timeout: FF_TIMEOUT,
  })
    .should('be.visible')
    .should('be.enabled')
    .click();
  cy.url({ timeout: FF_TIMEOUT }).should(
    'include',
    WORKFLOW_DETAIL_URL_SEGMENT
  );
}
