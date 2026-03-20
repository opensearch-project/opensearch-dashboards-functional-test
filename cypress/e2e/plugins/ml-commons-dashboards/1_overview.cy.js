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
} from '../../../utils/plugins/ml-commons-dashboards/shared/overview';

if (Cypress.env('ML_COMMONS_DASHBOARDS_ENABLED')) {
  describe('MLC Overview page', () => {
    testOverviewPageRedirect();

    describe('pre trained models', () => {
      let uploadedModelId;
      let modelRespondingState;
      before(() => {
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
      });
      testOverviewPage({
        get uploadedModelId() {
          return uploadedModelId;
        },
        get modelRespondingState() {
          return modelRespondingState;
        },
      });
    });
  });
}
