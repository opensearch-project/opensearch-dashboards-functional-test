/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FF_URL,
  FF_FIXTURE_BASE_PATH,
  MODEL_PARAMETERS,
  WORKFLOW_DETAIL_URL_SEGMENT,
} from '../../../utils/constants';
import createConnectorBody from '../../../fixtures/plugins/dashboards-flow-framework/create_connector.json';
import registerModelBody from '../../../fixtures/plugins/dashboards-flow-framework/register_model.json';
import { getLastPathSegment } from '../../../utils/plugins/dashboards-flow-framework/helpers';

describe('Creating Workflows Using Various Methods', () => {
  before(() => {
    cy.createConnector(createConnectorBody)
      .then((connectorResponse) => {
        MODEL_PARAMETERS.CONNECTOR_ID = connectorResponse.connector_id;
        return cy.registerModel({
          body: {
            ...registerModelBody,
            connector_id: MODEL_PARAMETERS.CONNECTOR_ID,
            function_name: 'remote',
          },
        });
      })
      .then((modelResponse) => {
        MODEL_PARAMETERS.MODEL_ID = modelResponse.model_id;
        return cy.deployModel(MODEL_PARAMETERS.MODEL_ID);
      });
  });

  beforeEach(() => {
    cy.visit(FF_URL.WORKFLOWS_NEW);
    cy.url().should('include', getLastPathSegment(FF_URL.WORKFLOWS_NEW));
  });

  it('create workflow using import', () => {
    cy.getElementByDataTestId('importWorkflowButton')
      .should('be.visible')
      .click();
    cy.contains('Import a workflow (JSON/YAML)').should('be.visible');
    const filePath =
      'cypress/fixtures/' +
      FF_FIXTURE_BASE_PATH +
      'import_semantic_search.json';
    cy.get('input[type=file]').selectFile(filePath);
    cy.getElementByDataTestId('importJSONButton').should('be.visible').click();
    cy.wait(5000);
    cy.get('.euiFieldSearch').focus();
    cy.get('.euiFieldSearch').type('semantic_search_1{enter}');
    cy.contains('semantic_search_1');
    cy.get('.euiTableRow').should('have.length.greaterThan', 0);
    cy.get('.euiTableRow').first().find('button.euiButtonIcon--danger').click();
    cy.contains('The workflow will be permanently deleted.').should('exist');
    cy.getElementByDataTestId('deleteWorkflowButton')
      .should('be.visible')
      .click();
  });
  it('Workflow Creation with Improper Import File', () => {
    cy.getElementByDataTestId('importWorkflowButton')
      .should('be.visible')
      .click();
    cy.contains('Import a workflow (JSON/YAML)').should('be.visible');
    const filePath =
      'cypress/fixtures/' + FF_FIXTURE_BASE_PATH + 'semantic_search_query.json';
    cy.get('input[type=file]').selectFile(filePath);
    cy.contains('The uploaded file is not a valid workflow').should(
      'be.visible'
    );
  });

  it('create workflow using Semantic Search template', () => {
    cy.contains('h2', 'Semantic Search', { timeout: 120000 })
      .should('be.visible')
      .parents('.euiCard')
      .within(() => {
        cy.contains('button', 'Go').click();
      });
    cy.getElementByDataTestId('optionalConfigurationButton')
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
    cy.getElementByDataTestId('editSourceDataButton')
      .should('be.visible')
      .click();
    cy.getElementByDataTestId('uploadSourceDataButton')
      .should('be.visible')
      .click();
    const filePath = `cypress/fixtures/${FF_FIXTURE_BASE_PATH}/semantic_search_source_data.json`;
    cy.get('input[type=file]').selectFile(filePath);
    cy.getElementByDataTestId('closeSourceDataButton')
      .should('be.visible')
      .click();
    cy.mockIngestion(() => {
      cy.getElementByDataTestId('runIngestionButton')
        .should('be.visible')
        .click();
    });
    cy.getElementByDataTestId('searchPipelineButton')
      .should('be.visible')
      .click();
    cy.getElementByDataTestId('queryEditButton').should('be.visible').click();
    cy.get('[data-testid="editQueryModalBody"]').within(() => {
      cy.fixture(FF_FIXTURE_BASE_PATH + 'semantic_search_query.json').then(
        (jsonData) => {
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
        }
      );
    });
    cy.getElementByDataTestId('searchQueryCloseButton')
      .should('be.visible')
      .click();
    cy.mockSearchIndex(() => {
      cy.getElementByDataTestId('runQueryButton').should('be.visible').click();
    });
  });

  it('create workflow using Sentiment Analysis template', () => {
    cy.contains('h2', 'Sentiment Analysis', { timeout: 120000 })
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
    cy.contains('h2', 'Hybrid Search', { timeout: 120000 })
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
    cy.contains('h2', 'Multimodal Search', { timeout: 120000 })
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
    cy.contains('h2', 'Retrieval-Augmented Generation (RAG)', {
      timeout: 120000,
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
    if (MODEL_PARAMETERS.MODEL_ID != '') {
      cy.undeployMLCommonsModel(MODEL_PARAMETERS.MODEL_ID).then((Response) => {
        console.log('Response:', Response);
      });
      cy.deleteMLCommonsModel(MODEL_PARAMETERS.MODEL_ID).then((Response) => {
        console.log('Response:', Response);
      });
    }
  });
});
