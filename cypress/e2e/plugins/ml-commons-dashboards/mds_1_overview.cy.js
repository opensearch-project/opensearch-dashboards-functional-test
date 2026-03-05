/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  deployPreTrainModel,
  undeployAndDeleteModel,
  testOverviewPageRedirect,
  testOverviewPage,
  visitOverviewPage,
  PRE_TRAIN_MODEL_NAME,
} from '../../../utils/plugins/ml-commons-dashboards/shared/overview';
import { currentBackendEndpoint } from '../../../utils/commands';
import { MLC_DASHBOARD_API } from '../../../utils/constants';

if (
  Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  describe('MLC Overview page with MDS enabled', () => {
    let dataSourceId;
    let dataSourceTitle;
    before(() => {
      cy.createDataSourceNoAuth().then((result) => {
        dataSourceId = result[0];
        dataSourceTitle = result[1];
      });
    });
    after(() => {
      if (dataSourceId) {
        cy.deleteDataSource(dataSourceId);
      }
    });

    testOverviewPageRedirect();

    it('should display the data source picker and created data source', () => {
      visitOverviewPage();

      cy.getElementByTestId('dataSourceSelectableButton').should('be.visible');
      cy.getElementByTestId('dataSourceSelectableButton').click();
      cy.getElementByTestId('dataSourceSelectable').find('input').clear();
      cy.getElementByTestId('dataSourceSelectable')
        .find('input')
        .type(dataSourceTitle);
      cy.get(`#${dataSourceId}`).contains(dataSourceTitle).should('be.visible');
      cy.getElementByTestId('dataSourceSelectable').find('input').clear();
      cy.getElementByTestId('dataSourceSelectableButton').click();
    });

    it('should call connectors and model search api with data source id', () => {
      cy.createDataSourceNoAuth().then(
        ([newCreatedDataSourceId, newCreatedDataSourceTitle]) => {
          visitOverviewPage();
          cy.intercept(`${MLC_DASHBOARD_API.GET_INTERNAL_CONNECTORS}**`).as(
            'getInternalConnectors'
          );
          cy.intercept(`${MLC_DASHBOARD_API.GET_MODELS}**`).as('getModels');
          cy.selectTopRightNavigationDataSource(
            newCreatedDataSourceTitle,
            newCreatedDataSourceId
          );
          cy.wait('@getInternalConnectors').then(({ request }) => {
            expect(request.url).contains(newCreatedDataSourceId);
          });
          cy.wait('@getModels').then(({ request }) => {
            expect(request.url).contains(newCreatedDataSourceId);
          });
          cy.deleteDataSource(newCreatedDataSourceId);
        }
      );
    });

    describe('pre trained models', () => {
      let uploadedModelId;
      let modelRespondingState;
      const originalBackendEndpoint = currentBackendEndpoint.get();

      before(() => {
        currentBackendEndpoint.set(currentBackendEndpoint.REMOTE_NO_AUTH);
        deployPreTrainModel().then(({ model_id: modelId, error }) => {
          uploadedModelId = modelId;
          modelRespondingState = error ? 'Not responding' : 'Responding';
        });
        visitOverviewPage();
      });

      after(() => {
        if (uploadedModelId) {
          undeployAndDeleteModel(uploadedModelId);
        }
        currentBackendEndpoint.set(originalBackendEndpoint, false);
      });

      beforeEach(() => {
        cy.selectTopRightNavigationDataSource(dataSourceTitle, dataSourceId);
      });

      testOverviewPage({
        get uploadedModelId() {
          return uploadedModelId;
        },
        get modelRespondingState() {
          return modelRespondingState;
        },
      });

      it('should display uploaded model and preview panel', () => {
        cy.get('[aria-label="Search by model name or ID"]').clear();
        cy.get('[aria-label="Search by model name or ID"]').type(
          uploadedModelId
        );

        cy.get('.euiTableRowCell')
          .contains(uploadedModelId)
          .closest('tr')
          .contains(PRE_TRAIN_MODEL_NAME)
          .should('be.visible')
          .closest('tr')
          .contains(modelRespondingState)
          .should('be.visible');

        cy.intercept(
          `${MLC_DASHBOARD_API.DEPLOYED_MODEL_PROFILE.replace(
            ':modelID',
            ''
          )}**`
        ).as('getModelProfile');

        cy.get('.euiTableRowCell')
          .contains(uploadedModelId)
          .closest('tr')
          .find('[aria-label="view detail"]')
          .click();

        cy.wait('@getModelProfile').then(({ request }) => {
          expect(request.url).contains(dataSourceId);
        });

        cy.get('div[role="dialog"]')
          .contains(PRE_TRAIN_MODEL_NAME)
          .should('be.visible');

        cy.get('div[role="dialog"]')
          .contains(modelRespondingState)
          .should('be.visible');

        cy.getElementByTestId('euiFlyoutCloseButton').click();
      });
    });
  });
}
