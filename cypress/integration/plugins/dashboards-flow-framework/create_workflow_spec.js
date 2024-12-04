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
            connector_id: connectorResponse.connector_id,
            function_name: 'remote',
          },
        });
      })
      .then((modelResponse) => {
        modelId = modelResponse.model_id;
        return cy.deployModel(modelId);
      });
  });

  beforeEach(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.wait(20000);
    cy.visit(FF_URL.WORKFLOWS, { timeout: FF_TIMEOUT });
  });

  it('create workflow using import', () => {
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

  it('Workflow Creation with Improper Import File', () => {
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

  it('create workflow using Semantic Search template', () => {
    cy.getElementByDataTestId('createWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.contains('h3', 'Semantic Search', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .parents('.euiCard')
      .within(() => {
        cy.contains('button', 'Go').click();
      });
    cy.getElementByDataTestId('optionalConfigurationButton', {
      timeout: FF_TIMEOUT,
    })
      .should('be.visible')
      .click();
    cy.getElementByDataTestId('selectDeployedModel')
      .should('be.visible')
      .click();
    cy.get('.euiSuperSelect__item').should('be.visible');
    cy.get('.euiSuperSelect__item').contains('BedRock').click();
    cy.contains('label', 'Text field')
      .invoke('attr', 'for')
      .then((id) => {
        cy.get(`#${id}`).clear().type('item_text');
      });
    cy.getElementByDataTestId('quickConfigureCreateButton')
      .should('be.visible')
      .click();
    cy.url().should('include', '/workflows/');
    cy.getElementByDataTestId('selectDataToImportButton')
      .should('be.visible')
      .click();
    cy.getElementByDataTestId('uploadSourceDataButton')
      .should('be.visible')
      .click();
    const filePath = `cypress/fixtures/${FF_FIXTURE_BASE_PATH}semantic_search/source_data.json`;
    cy.get('input[type=file]').selectFile(filePath);
    cy.getElementByDataTestId('updateSourceDataButton')
      .should('be.visible')
      .click();
    cy.mockIngestion(() => {
      cy.getElementByDataTestId('runIngestionButton')
        .should('be.visible')
        .click();
    });
    // Checking Run ingestion response
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
    cy.mockSemanticSearchIndexSearch(() => {
      cy.getElementByDataTestId('runQueryButton').should('be.visible').click();
    });
    // Checking Run query response
    cy.sa_getElementByText('button.euiTab', 'Search response')
      .should('be.visible')
      .click();

    cy.fixture(FF_FIXTURE_BASE_PATH + 'semantic_search/search_response').then(
      () => {
        cy.get('#tools_panel_id').should('be.visible');
      }
    );
  });

  it('create workflow using Sentiment Analysis template', () => {
    cy.getElementByDataTestId('createWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.contains('h3', 'Sentiment Analysis', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .parents('.euiCard')
      .within(() => {
        cy.contains('button', 'Go').click();
      });
    cy.getElementByDataTestId('quickConfigureCreateButton')
      .should('be.visible')
      .click();
    cy.url().should('include', WORKFLOW_DETAIL_URL_SEGMENT);
  });

  it('create workflow using Hybrid Search template', () => {
    cy.getElementByDataTestId('createWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.contains('h3', 'Hybrid Search', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .parents('.euiCard')
      .within(() => {
        cy.contains('button', 'Go').click();
      });
    cy.getElementByDataTestId('quickConfigureCreateButton')
      .should('be.visible')
      .click();
    cy.url().should('include', WORKFLOW_DETAIL_URL_SEGMENT);
  });

  it('create workflow using Multimodal Search template', () => {
    cy.getElementByDataTestId('createWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.contains('h3', 'Multimodal Search', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .parents('.euiCard')
      .within(() => {
        cy.contains('button', 'Go').click();
      });
    cy.getElementByDataTestId('quickConfigureCreateButton')
      .should('be.visible')
      .click();
    cy.url().should('include', WORKFLOW_DETAIL_URL_SEGMENT);
  });

  it('create workflow using Retrieval-Augmented Generation (RAG) template', () => {
    cy.getElementByDataTestId('createWorkflowButton', { timeout: FF_TIMEOUT })
      .should('be.visible')
      .click();
    cy.contains('h3', 'Retrieval-Augmented Generation (RAG)', {
      timeout: FF_TIMEOUT,
    })
      .should('be.visible')
      .parents('.euiCard')
      .within(() => {
        cy.contains('button', 'Go').click();
      });
    cy.getElementByDataTestId('quickConfigureCreateButton')
      .should('be.visible')
      .click();
    cy.url().should('include', WORKFLOW_DETAIL_URL_SEGMENT);
  });

  after(() => {
    if (modelId != '') {
      cy.undeployMLCommonsModel(modelId);
      cy.deleteMLCommonsModel(modelId);
    }
  });
});
