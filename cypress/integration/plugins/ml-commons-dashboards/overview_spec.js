/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLC_URL, MLC_DASHBOARD_API } from '../../../utils/constants';

const UPLOAD_MODEL_NAME = 'huggingface/sentence-transformers/all-MiniLM-L6-v2';

if (Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED')) {
  describe('MLC Overview page', () => {
    it('should return to monitoring page when visit root', () => {
      cy.visit(MLC_URL.ROOT);
      cy.url().should('include', MLC_URL.OVERVIEW);
    });

    describe('custom upload model', () => {
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

      it('should display page header and deployed model name, status and source', () => {
        cy.visit(MLC_URL.OVERVIEW);

        cy.contains('h1', 'Overview');
        cy.contains('h2', 'Models');

        cy.get('[aria-label="Search by model name or ID"]').type(
          uploadedModelId
        );

        cy.contains(UPLOAD_MODEL_NAME)
          .closest('tr')
          .contains(uploadedModelLoadedError ? 'Not responding' : 'Responding')
          .closest('tr')
          .contains('Local');
      });

      it('should open preview panel after view detail button click', () => {
        cy.visit(MLC_URL.OVERVIEW);

        cy.get('[aria-label="Search by model name or ID"]').type(
          uploadedModelId
        );

        cy.contains(UPLOAD_MODEL_NAME)
          .closest('tr')
          .find('[aria-label="view detail"]')
          .click();

        cy.get('div[role="dialog"]').contains(UPLOAD_MODEL_NAME);
        cy.get('div[role="dialog"]').contains(uploadedModelId);
        cy.get('div[role="dialog"]').contains('Local');
        cy.get('div[role="dialog"]').contains('Status by node');
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

        cy.get('[aria-label="Search by model name or ID"]').type(
          uploadedModelId
        );

        cy.contains(UPLOAD_MODEL_NAME)
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
      });
    });

    describe('remote model', () => {
      let registeredRemoteModelId;
      let remoteModelName;
      before(() => {
        remoteModelName = `remote sagemaker model-${new Date().getTime()}`;
        cy.registerModel({
          name: remoteModelName,
          function_name: 'remote',
          version: '1.0.0',
          description: 'test model',
          connector: {
            name: 'sagemaker: embedding',
            description: 'Test connector for Sagemaker embedding model',
            version: 1,
            protocol: 'aws_sigv4',
            credential: {
              access_key: '...',
              secret_key: '...',
              session_token: '...',
            },
            parameters: {
              region: 'us-west-2',
              service_name: 'sagemaker',
            },
            actions: [
              {
                action_type: 'predict',
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                },
                url: 'https://runtime.sagemaker.us-west-2.amazonaws.com/endpoints/lmi-model-2023-06-24-01-35-32-275/invocations',
                request_body: '["${parameters.inputs}"]',
              },
            ],
          },
        })
          .then(({ task_id: taskId }) =>
            cy.cyclingCheckTask({
              taskId,
            })
          )
          .then(({ model_id: modelId }) => {
            registeredRemoteModelId = modelId;
            return cy.loadMLCommonsModel(modelId);
          })
          .then(({ task_id: taskId }) =>
            cy.cyclingCheckTask({
              taskId,
              rejectOnError: false,
            })
          );
      });
      after(() => {
        if (registeredRemoteModelId) {
          cy.unloadMLCommonsModel(registeredRemoteModelId);
          cy.wait(1000);
          cy.deleteMLCommonsModel(registeredRemoteModelId);
          cy.wait(1000);
        }
      });
      it('should show remote models with External source', () => {
        cy.visit(MLC_URL.OVERVIEW);

        cy.get('[aria-label="Search by model name or ID"]').type(
          registeredRemoteModelId
        );

        cy.contains('.euiTableRowCell', remoteModelName).should('exist');
        cy.contains('.euiTableRowCell', 'External').should('exist');
      });

      it('should show show connector details after status details clicked', () => {
        cy.visit(MLC_URL.OVERVIEW);

        cy.get('[aria-label="Search by model name or ID"]').type(
          registeredRemoteModelId
        );
        cy.contains(remoteModelName)
          .closest('tr')
          .find('[aria-label="view detail"]')
          .click();
        cy.get('div[role="dialog"]').contains('External');
        cy.get('div[role="dialog"]').contains('Connector details');
        cy.get('div[role="dialog"]').contains('sagemaker: embedding');
        cy.get('div[role="dialog"]').contains(
          'Test connector for Sagemaker embedding model'
        );
      });
    });
  });
}
