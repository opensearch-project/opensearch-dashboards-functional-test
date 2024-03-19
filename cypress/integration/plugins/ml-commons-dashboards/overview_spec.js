/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLC_URL, MLC_DASHBOARD_API } from '../../../utils/constants';

const UPLOAD_MODEL_NAME = 'huggingface/sentence-transformers/all-MiniLM-L6-v2';

if (Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED')) {
  describe('MLC Overview page', () => {
    let uploadedModelId;
    let uploadedModelLoadedError;

    before(() => {
      // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
      cy.disableOnlyRunOnMLNode();
      cy.disableNativeMemoryCircuitBreaker();
      cy.wait(1000);

      cy.registerModelGroup({
        name: `model-group-${new Date().getTime().toString(34)}`,
      })
        .then(({ model_group_id }) =>
          cy.registerModel({
            name: UPLOAD_MODEL_NAME,
            version: '1.0.1',
            model_group_id,
            model_format: 'TORCH_SCRIPT',
          })
        )
        .then(({ task_id: taskId }) =>
          cy.cyclingCheckTask({
            taskId,
          })
        )
        .then(({ model_id: modelId }) => {
          uploadedModelId = modelId;
          return cy.loadMLCommonsModel(modelId);
        })
        .then(({ task_id: taskId }) =>
          cy.cyclingCheckTask({
            taskId,
            rejectOnError: false,
          })
        )
        .then(({ error }) => {
          if (error) {
            uploadedModelLoadedError = error;
          }
        });
    });

    after(() => {
      if (uploadedModelId) {
        cy.unloadMLCommonsModel(uploadedModelId);
        cy.deleteMLCommonsModel(uploadedModelId);
      }
    });

    it('should return to monitoring page when visit root', () => {
      cy.visit(MLC_URL.ROOT);
      cy.url().should('include', MLC_URL.OVERVIEW);
    });

    it('should display page header and deployed model name, status and id', () => {
      cy.visit(MLC_URL.OVERVIEW);

      cy.contains('h1', 'Overview');
      cy.contains('h2', 'Deployed models');

      cy.get('[aria-label="Search by name or ID"]').type(uploadedModelId);

      cy.contains(uploadedModelId)
        .closest('tr')
        .contains(uploadedModelLoadedError ? 'Not responding' : 'Responding')
        .closest('tr')
        .contains(UPLOAD_MODEL_NAME);

      cy.contains('h1', 'Overview');
      cy.contains('h2', 'Deployed models');
    });

    it('should open preview panel after view detail button click', () => {
      cy.visit(MLC_URL.OVERVIEW);

      cy.get('[aria-label="Search by name or ID"]').type(uploadedModelId);

      cy.contains(uploadedModelId)
        .closest('tr')
        .find('[aria-label="view detail"]')
        .click();

      cy.contains('.euiFlyoutHeader > h3', UPLOAD_MODEL_NAME);
      cy.contains('.euiFlyoutBody', uploadedModelId);
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

      cy.visit(MLC_URL.OVERVIEW);

      cy.get('[aria-label="Search by name or ID"]').type(uploadedModelId);

      cy.contains(uploadedModelId)
        .closest('tr')
        .find('[aria-label="view detail"]')
        .click();

      cy.get('div[role="dialog"] .ml-nodesTableNodeIdCellText', {
        timeout: 0,
      }).should('not.exist');
      cy.wait('@getDeployedModelProfile');
      cy.get('div[role="dialog"] .ml-nodesTableNodeIdCellText').should('exist');
    });
  });
}
