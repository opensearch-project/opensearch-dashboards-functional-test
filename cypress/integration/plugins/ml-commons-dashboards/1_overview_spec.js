/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLC_URL, MLC_DASHBOARD_API } from '../../../utils/constants';

const UPLOAD_MODEL_NAME = 'huggingface/sentence-transformers/all-MiniLM-L6-v2';

const registerAndDeployPreTrainModel = () =>
  cy
    .registerModelGroup({
      name: `model-group-${new Date().getTime().toString(34)}`,
    })
    .then(({ model_group_id }) =>
      cy
        .registerModel({
          body: {
            name: UPLOAD_MODEL_NAME,
            version: '1.0.1',
            model_format: 'TORCH_SCRIPT',
            model_group_id,
          },
        })
        .then(({ task_id: taskId, model_group_id: modelGroupId }) => ({
          taskId,
          modelGroupId,
        }))
    )
    .then(({ taskId, modelGroupId }) =>
      cy
        .cyclingCheckTask({
          taskId,
        })
        .then(({ model_id: modelId }) => ({ modelId, modelGroupId }))
    )
    .then(({ modelId, modelGroupId }) =>
      cy
        .deployMLCommonsModel(modelId)
        .then(({ task_id: taskId }) => ({ modelId, modelGroupId, taskId }))
    )
    .then(({ taskId, modelId, modelGroupId }) =>
      cy
        .cyclingCheckTask({
          taskId,
          rejectOnError: false,
        })
        .then(({ error }) => ({ error, modelId, modelGroupId }))
    );

if (Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED')) {
  describe('MLC Overview page', () => {
    it('should return to monitoring page when visit root', () => {
      cy.visit(MLC_URL.ROOT);
      cy.url().should('include', MLC_URL.OVERVIEW);
    });

    describe('local cluster', () => {
      let uploadedModelId;
      let uploadedModelGroupId;
      let modelRespondingState;
      before(() => {
        cy.disableNativeMemoryCircuitBreaker();
        // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
        cy.disableOnlyRunOnMLNode();
        cy.wait(1000);

        registerAndDeployPreTrainModel().then(
          ({ modelId, error, modelGroupId }) => {
            uploadedModelId = modelId;
            modelRespondingState = error ? 'Not responding' : 'Responding';
            uploadedModelGroupId = modelGroupId;
          }
        );

        cy.visit(MLC_URL.OVERVIEW);
        cy.waitForLoader();
      });

      after(() => {
        if (uploadedModelId) {
          cy.undeployMLCommonsModel(uploadedModelId);
          cy.deleteMLCommonsModel(uploadedModelId);
        }
        if (uploadedModelGroupId) {
          cy.deleteModelGroup(uploadedModelGroupId);
        }
      });

      it('should display page header and deployed model name, status and source', () => {
        cy.contains('h1', 'Overview');
        cy.contains('h2', 'Models');

        cy.get('[aria-label="Search by model name or ID"]').clear();
        cy.get('[aria-label="Search by model name or ID"]').type(
          uploadedModelId
        );

        cy.get('.euiTableRowCell')
          .contains(UPLOAD_MODEL_NAME)
          .closest('tr')
          .contains(modelRespondingState)
          .should('be.visible')
          .closest('tr')
          .contains('Local')
          .should('be.visible');
      });

      it('should open preview panel after view detail button click', () => {
        cy.get('[aria-label="Search by model name or ID"]').clear();
        cy.get('[aria-label="Search by model name or ID"]').type(
          uploadedModelId
        );

        cy.get('.euiTableRowCell')
          .contains(UPLOAD_MODEL_NAME)
          .closest('tr')
          .find('[aria-label="view detail"]')
          .click();

        cy.get('div[role="dialog"]')
          .contains(UPLOAD_MODEL_NAME)
          .should('be.visible');
        cy.get('div[role="dialog"]')
          .contains(uploadedModelId)
          .should('be.visible');
        cy.get('div[role="dialog"]').contains('Local').should('be.visible');
        cy.get('div[role="dialog"]')
          .contains('Status by node')
          .should('be.visible');
        cy.get('div[role="dialog"]')
          .contains(modelRespondingState)
          .should('be.visible');
        cy.getElementByTestId('euiFlyoutCloseButton').click();
      });

      it('should show empty nodes when deployed model profiling loading', () => {
        cy.intercept(
          'GET',
          MLC_DASHBOARD_API.DEPLOYED_MODEL_PROFILE.replace(
            ':modelID',
            uploadedModelId
          ),
          (req) => {
            req.on('response', (res) => {
              res.setDelay(3000);
            });
          }
        ).as('getDeployedModelProfile');

        cy.get('[aria-label="Search by model name or ID"]').clear();
        cy.get('[aria-label="Search by model name or ID"]').type(
          uploadedModelId
        );

        cy.get('.euiTableRowCell')
          .contains(UPLOAD_MODEL_NAME)
          .closest('tr')
          .find('[aria-label="view detail"]')
          .click();

        cy.get('div[role="dialog"] .ml-nodesTableNodeIdCellText', {
          timeout: 0,
        }).should('not.exist');
        cy.wait('@getDeployedModelProfile');
        cy.get('div[role="dialog"] .ml-nodesTableNodeIdCellText').should(
          'exist'
        );
        cy.getElementByTestId('euiFlyoutCloseButton').click();
      });
    });
  });
}
