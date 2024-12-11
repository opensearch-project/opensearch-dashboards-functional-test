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

if (Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED')) {
  describe('MLC Overview page with remote models', () => {
    let registeredRemoteModelId;
    let remoteModelName;
    before(() => {
      deployRemoteModel().then(([modelName, { model_id: modelId }]) => {
        remoteModelName = modelName;
        registeredRemoteModelId = modelId;
      });

      visitOverviewPage();
    });
    after(() => {
      if (registeredRemoteModelId) {
        undeployAndDeleteModel(registeredRemoteModelId);
      }
    });
    testRemoteModelsOverviewPage({
      get registeredRemoteModelId() {
        return registeredRemoteModelId;
      },
      get remoteModelName() {
        return remoteModelName;
      },
    });
  });
}
