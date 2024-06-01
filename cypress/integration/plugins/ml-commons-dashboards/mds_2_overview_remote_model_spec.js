/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  deployRemoteModel,
  undeployAndDeleteModel,
  visitOverviewPage,
  testRemoteModelsOverviewPage,
} from '../../../utils/plugins/ml-commons-dashboards/shared/overview';
import { currentBackendEndpoint } from '../../../utils/commands';
import { MLC_DASHBOARD_API } from '../../../utils/constants';

if (
  Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  describe('MLC Overview page with remote models and MDS enabled', () => {
    let dataSourceId;
    let dataSourceTitle;
    let registeredRemoteModelId;
    let remoteModelName;
    const originalBackendEndpoint = currentBackendEndpoint.get();
    before(() => {
      currentBackendEndpoint.set(currentBackendEndpoint.REMOTE_NO_AUTH);
      deployRemoteModel().then(([modelName, { model_id: modelId }]) => {
        remoteModelName = modelName;
        registeredRemoteModelId = modelId;
      });

      cy.createDataSourceNoAuth().then((result) => {
        dataSourceId = result[0];
        dataSourceTitle = result[1];
      });

      visitOverviewPage();
    });
    after(() => {
      if (dataSourceId) {
        cy.deleteDataSource(dataSourceId);
      }
      if (registeredRemoteModelId) {
        undeployAndDeleteModel(registeredRemoteModelId);
      }
      currentBackendEndpoint.set(originalBackendEndpoint, false);
    });
    beforeEach(() => {
      cy.selectTopRightNavigationDataSource(dataSourceTitle, dataSourceId);
    });
    testRemoteModelsOverviewPage({
      get registeredRemoteModelId() {
        return registeredRemoteModelId;
      },
      get remoteModelName() {
        return remoteModelName;
      },
    });

    it('should display consistent connectors options and models', () => {
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
      cy.get('[aria-label="Search by model name or ID"]').clear();
      cy.get('[aria-label="Search by model name or ID"]').type(
        registeredRemoteModelId
      );

      cy.intercept(
        `${MLC_DASHBOARD_API.DEPLOYED_MODEL_PROFILE.replace(':modelID', '')}**`
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
