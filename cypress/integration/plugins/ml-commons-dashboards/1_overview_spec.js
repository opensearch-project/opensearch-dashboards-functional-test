/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { currentBackendEndpoint } from '../../../utils/commands';
import { MLC_URL, MLC_DASHBOARD_API } from '../../../utils/constants';

const UPLOAD_MODEL_NAME = 'huggingface/sentence-transformers/all-MiniLM-L6-v2';
const dataSourceEnabled = !!Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

const registerAndDeployPreTrainModel = () =>
  cy
    .registerModel({
      body: {
        name: UPLOAD_MODEL_NAME,
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

if (Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED')) {
  describe('MLC Overview page', () => {
    it('should return to monitoring page when visit root', () => {
      cy.visit(MLC_URL.ROOT);
      cy.url().should('include', MLC_URL.OVERVIEW);
    });

    describe('local cluster', () => {
      let uploadedModelId;
      let modelRespondingState;
      before(() => {
        cy.disableNativeMemoryCircuitBreaker();
        // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
        cy.disableOnlyRunOnMLNode();
        cy.wait(1000);

        registerAndDeployPreTrainModel().then(
          ({ model_id: modelId, error }) => {
            uploadedModelId = modelId;
            modelRespondingState = error ? 'Not responding' : 'Responding';
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
        if (uploadedModelId) {
          cy.undeployMLCommonsModel(uploadedModelId);
          cy.deleteMLCommonsModel(uploadedModelId);
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
          .contains(uploadedModelId)
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
          .contains(uploadedModelId)
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
          .contains(uploadedModelId)
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

    if (dataSourceEnabled) {
      describe('multi data source enabled', () => {
        let dataSourceId;
        let dataSourceTitle;
        before(() => {
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
        });

        it('should display the data source picker and created data source', () => {
          cy.getElementByTestId(
            'dataSourceSelectableContextMenuHeaderLink'
          ).should('be.visible');
          cy.getElementByTestId(
            'dataSourceSelectableContextMenuHeaderLink'
          ).click();
          cy.getElementByTestId('dataSourceSelectable').find('input').clear();
          cy.getElementByTestId('dataSourceSelectable')
            .find('input')
            .type(dataSourceTitle);
          cy.get(`#${dataSourceId}`)
            .contains(dataSourceTitle)
            .should('be.visible');
          cy.getElementByTestId('dataSourceSelectable').find('input').clear();
          cy.getElementByTestId(
            'dataSourceSelectableContextMenuHeaderLink'
          ).click();
        });

        describe('uploaded models', () => {
          let remoteUploadedModelId;
          let remoteModelRespondingState;
          const originalBackendEndpoint = currentBackendEndpoint.get();
          before(() => {
            currentBackendEndpoint.set(currentBackendEndpoint.REMOTE_NO_AUTH);
            cy.disableNativeMemoryCircuitBreaker();
            cy.disableOnlyRunOnMLNode();
            cy.wait(1000);

            registerAndDeployPreTrainModel().then(
              ({ model_id: modelId, error }) => {
                remoteUploadedModelId = modelId;
                remoteModelRespondingState = error
                  ? 'Not responding'
                  : 'Responding';
              }
            );
          });
          after(() => {
            if (remoteUploadedModelId) {
              cy.undeployMLCommonsModel(remoteUploadedModelId);
              cy.deleteMLCommonsModel(remoteUploadedModelId);
            }
            currentBackendEndpoint.set(originalBackendEndpoint, false);
          });

          it('should call connectors and model search api with data source id', () => {
            cy.intercept(`${MLC_DASHBOARD_API.GET_INTERNAL_CONNECTORS}**`).as(
              'getInternalConnectors'
            );
            cy.intercept(`${MLC_DASHBOARD_API.GET_MODELS}**`).as('getModels');
            cy.selectTopRightNavigationDataSource(
              dataSourceTitle,
              dataSourceId
            );
            cy.wait('@getInternalConnectors').then(({ request }) => {
              expect(request.url).contains(dataSourceId);
            });
            cy.wait('@getModels').then(({ request }) => {
              expect(request.url).contains(dataSourceId);
            });
          });

          it('should display uploaded model and preview panel', () => {
            cy.selectTopRightNavigationDataSource(
              dataSourceTitle,
              dataSourceId
            );

            cy.get('[aria-label="Search by model name or ID"]').clear();
            cy.get('[aria-label="Search by model name or ID"]').type(
              remoteUploadedModelId
            );

            cy.get('.euiTableRowCell')
              .contains(remoteUploadedModelId)
              .closest('tr')
              .contains(UPLOAD_MODEL_NAME)
              .should('be.visible')
              .closest('tr')
              .contains(remoteModelRespondingState)
              .should('be.visible');

            cy.intercept(
              `${MLC_DASHBOARD_API.DEPLOYED_MODEL_PROFILE.replace(
                ':modelID',
                ''
              )}**`
            ).as('getModelProfile');

            cy.get('.euiTableRowCell')
              .contains(remoteUploadedModelId)
              .closest('tr')
              .find('[aria-label="view detail"]')
              .click();

            cy.wait('@getModelProfile').then(({ request }) => {
              expect(request.url).contains(dataSourceId);
            });

            cy.get('div[role="dialog"]')
              .contains(UPLOAD_MODEL_NAME)
              .should('be.visible');

            cy.get('div[role="dialog"]')
              .contains(remoteModelRespondingState)
              .should('be.visible');

            cy.getElementByTestId('euiFlyoutCloseButton').click();
          });
        });
      });
    }
  });
}
