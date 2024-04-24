/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLC_URL, MLC_DASHBOARD_API } from '../../../utils/constants';
import { currentBackendEndpoint } from '../../../utils/commands';

const dataSourceEnabled = !!Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

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

if (Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED')) {
  describe('MLC Overview page with remote models', () => {
    describe('local cluster', () => {
      let registeredRemoteModelId;
      let remoteModelName;
      before(() => {
        cy.disableNativeMemoryCircuitBreaker();
        // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
        cy.disableOnlyRunOnMLNode();
        cy.wait(1000);

        registerAndDeployRemoteModel().then(
          ([modelName, { model_id: modelId }]) => {
            remoteModelName = modelName;
            registeredRemoteModelId = modelId;
          }
        );
        cy.visit(MLC_URL.OVERVIEW);
        cy.waitForLoader();

        if (dataSourceEnabled) {
          cy.selectTopRightNavigationDataSource('Local cluster');
          cy.wait(1000);
        }
      });
      after(() => {
        if (registeredRemoteModelId) {
          cy.undeployMLCommonsModel(registeredRemoteModelId);
          cy.wait(1000);
          cy.deleteMLCommonsModel(registeredRemoteModelId);
          cy.wait(1000);
        }
      });
      it('should show remote models with External source', () => {
        cy.get('[aria-label="Search by model name or ID"]').clear();
        cy.get('[aria-label="Search by model name or ID"]').type(
          registeredRemoteModelId
        );

        cy.contains('.euiTableRowCell', remoteModelName).should('exist');
        cy.contains('.euiTableRowCell', 'External').should('exist');
      });

      it('should show show connector details after status details clicked', () => {
        cy.get('[aria-label="Search by model name or ID"]').clear();
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
    if (dataSourceEnabled) {
      describe('multi data source enabled', () => {
        let dataSourceId;
        let dataSourceTitle;
        let registeredRemoteModelId;
        let remoteModelName;
        const originalBackendEndpoint = currentBackendEndpoint.get();
        before(() => {
          currentBackendEndpoint.set(currentBackendEndpoint.REMOTE_NO_AUTH);
          cy.disableNativeMemoryCircuitBreaker();
          // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
          cy.disableOnlyRunOnMLNode();
          cy.wait(1000);

          registerAndDeployRemoteModel().then(
            ([modelName, { model_id: modelId }]) => {
              remoteModelName = modelName;
              registeredRemoteModelId = modelId;
            }
          );

          cy.createDataSourceNoAuth().then((result) => {
            dataSourceId = result[0];
            dataSourceTitle = result[1];
          });

          cy.visit(MLC_URL.OVERVIEW);
          cy.waitForLoader();
        });
        after(() => {
          if (dataSourceId) {
            cy.deleteDataSource(dataSourceId);
          }
          if (registeredRemoteModelId) {
            cy.undeployMLCommonsModel(registeredRemoteModelId);
            cy.wait(1000);
            cy.deleteMLCommonsModel(registeredRemoteModelId);
            cy.wait(1000);
          }
          currentBackendEndpoint.set(originalBackendEndpoint, false);
        });

        it('should display consistent connectors options and models', () => {
          cy.selectTopRightNavigationDataSource(dataSourceTitle, dataSourceId);

          cy.get('#modelConnectorNameFilter').click();
          cy.get('.euiFilterSelectItem')
            .contains('sagemaker: embedding')
            .should('be.visible');
          cy.get('#modelConnectorNameFilter').click();

          cy.get('[aria-label="Search by model name or ID"]').clear();
          cy.get('[aria-label="Search by model name or ID"]').type(
            registeredRemoteModelId
          );

          cy.get('.euiTableRow').contains(remoteModelName).should('be.visible');
        });

        it('should call profile model with data source id and show preview panel', () => {
          cy.selectTopRightNavigationDataSource(dataSourceTitle, dataSourceId);

          cy.get('[aria-label="Search by model name or ID"]').clear();
          cy.get('[aria-label="Search by model name or ID"]').type(
            registeredRemoteModelId
          );

          cy.intercept(
            `${MLC_DASHBOARD_API.DEPLOYED_MODEL_PROFILE.replace(
              ':modelID',
              ''
            )}**`
          ).as('getModelProfile');

          cy.get('.euiTableRowCell')
            .contains(registeredRemoteModelId)
            .closest('tr')
            .find('[aria-label="view detail"]')
            .click();

          cy.wait('@getModelProfile').then(({ request }) => {
            expect(request.url).contains(dataSourceId);
          });

          cy.get('div[role="dialog"]')
            .contains(remoteModelName)
            .should('be.visible');

          cy.getElementByTestId('euiFlyoutCloseButton').click();
        });
      });
    }
  });
}
