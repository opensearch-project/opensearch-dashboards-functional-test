/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLC_URL, MLC_DASHBOARD_API } from '../../../../utils/constants';

export const PRE_TRAIN_MODEL_NAME =
  'huggingface/sentence-transformers/all-MiniLM-L6-v2';

const registerAndDeployPreTrainModel = () =>
  cy
    .registerModel({
      body: {
        name: PRE_TRAIN_MODEL_NAME,
        version: '1.0.1',
        model_format: 'TORCH_SCRIPT',
      },
    })
    .then(({ task_id: taskId }) =>
      cy.cyclingCheckTask({
        taskId,
      })
    )
    .then(({ model_id: modelId }) => cy.deployMLCommonsModel(modelId))
    .then(({ task_id: taskId }) =>
      cy.cyclingCheckTask({
        taskId,
        rejectOnError: false,
      })
    );

const registerAndDeployRemoteModel = () => {
  const modelName = `remote sagemaker model-${new Date().getTime()}`;
  return cy
    .registerModel({
      body: {
        name: modelName,
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
      },
    })
    .then(({ task_id: taskId }) =>
      cy.cyclingCheckTask({
        taskId,
      })
    )
    .then(({ model_id: modelId }) => cy.deployMLCommonsModel(modelId))
    .then(({ task_id: taskId }) =>
      cy.cyclingCheckTask({
        taskId,

        rejectOnError: false,
      })
    )
    .then((result) => [modelName, result]);
};

export const deployPreTrainModel = () => {
  cy.disableNativeMemoryCircuitBreaker();
  // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
  cy.disableOnlyRunOnMLNode();
  cy.wait(1000);

  return registerAndDeployPreTrainModel();
};

export const deployRemoteModel = () => {
  cy.disableNativeMemoryCircuitBreaker();
  // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
  cy.disableOnlyRunOnMLNode();
  cy.wait(1000);

  return registerAndDeployRemoteModel();
};

export const visitOverviewPage = () => {
  cy.visit(MLC_URL.OVERVIEW);
  cy.waitForLoader();
};

export const undeployAndDeleteModel = (modelId) => {
  cy.undeployMLCommonsModel(modelId);
  cy.wait(1000);
  cy.deleteMLCommonsModel(modelId);
  cy.wait(1000);
};

export const testOverviewPage = (context) => {
  it('should display page header and deployed model name, status and source', () => {
    cy.contains('h1', 'Overview');
    cy.contains('h2', 'Models');

    cy.get('[aria-label="Search by model name or ID"]').clear();
    cy.get('[aria-label="Search by model name or ID"]').type(
      context.uploadedModelId
    );

    cy.get('.euiTableRowCell')
      .contains(context.uploadedModelId)
      .closest('tr')
      .contains(context.modelRespondingState)
      .should('be.visible')
      .closest('tr')
      .contains('Local')
      .should('be.visible');
  });

  it('should open preview panel after view detail button click', () => {
    cy.get('[aria-label="Search by model name or ID"]').clear();
    cy.get('[aria-label="Search by model name or ID"]').type(
      context.uploadedModelId
    );

    cy.get('.euiTableRowCell')
      .contains(context.uploadedModelId)
      .closest('tr')
      .find('[aria-label="view detail"]')
      .click();

    cy.get('div[role="dialog"]')
      .contains(PRE_TRAIN_MODEL_NAME)
      .should('be.visible');
    cy.get('div[role="dialog"]')
      .contains(context.uploadedModelId)
      .should('be.visible');
    cy.get('div[role="dialog"]').contains('Local').should('be.visible');
    cy.get('div[role="dialog"]')
      .contains('Status by node')
      .should('be.visible');
    cy.get('div[role="dialog"]')
      .contains(context.modelRespondingState)
      .should('be.visible');
    cy.getElementByTestId('euiFlyoutCloseButton').click();
  });

  it('should show empty nodes when deployed model profiling loading', () => {
    cy.intercept(
      'GET',
      `${MLC_DASHBOARD_API.DEPLOYED_MODEL_PROFILE.replace(
        ':modelID',
        context.uploadedModelId
      )}**`,
      (req) => {
        req.on('response', (res) => {
          res.setDelay(3000);
        });
      }
    ).as('getDeployedModelProfile');

    cy.get('[aria-label="Search by model name or ID"]').clear();
    cy.get('[aria-label="Search by model name or ID"]').type(
      context.uploadedModelId
    );

    cy.get('.euiTableRowCell')
      .contains(context.uploadedModelId)
      .closest('tr')
      .find('[aria-label="view detail"]')
      .click();

    cy.get('div[role="dialog"] .ml-nodesTableNodeIdCellText', {
      timeout: 0,
    }).should('not.exist');
    cy.wait('@getDeployedModelProfile');
    cy.get('div[role="dialog"] .ml-nodesTableNodeIdCellText').should('exist');
    cy.getElementByTestId('euiFlyoutCloseButton').click();
  });
};

export const testOverviewPageRedirect = () => {
  it('should return to monitoring page when visit root', () => {
    cy.visit(MLC_URL.ROOT);
    cy.url().should('include', MLC_URL.OVERVIEW);
  });
};

export const testRemoteModelsOverviewPage = (context) => {
  it('should show remote models with External source', () => {
    cy.get('[aria-label="Search by model name or ID"]').clear();
    cy.get('[aria-label="Search by model name or ID"]').type(
      context.registeredRemoteModelId
    );

    cy.contains('.euiTableRowCell', context.remoteModelName).should('exist');
    cy.contains('.euiTableRowCell', 'External').should('exist');
  });

  it('should show show connector details after status details clicked', () => {
    cy.get('[aria-label="Search by model name or ID"]').clear();
    cy.get('[aria-label="Search by model name or ID"]').type(
      context.registeredRemoteModelId
    );
    cy.contains(context.remoteModelName)
      .closest('tr')
      .find('[aria-label="view detail"]')
      .click();
    cy.get('div[role="dialog"]').contains('External');
    cy.get('div[role="dialog"]').contains('Connector details');
    cy.get('div[role="dialog"]').contains('sagemaker: embedding');
    cy.get('div[role="dialog"]').contains(
      'Test connector for Sagemaker embedding model'
    );
    cy.getElementByTestId('euiFlyoutCloseButton').click();
  });
};
