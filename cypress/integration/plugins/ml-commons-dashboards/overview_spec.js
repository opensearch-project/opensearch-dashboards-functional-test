/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLC_URL } from '../../../utils/constants';

describe('MLC Overview page', () => {
  let uploadedModelId;
  let uploadedModelLoadedError;
  const uploadModelName = `traced_small_model-${new Date()
    .getTime()
    .toString(34)}`;
  before(() => {
    // Disable only_run_on_ml_node to avoid model upload error in case of cluster no ml nodes
    cy.disableOnlyRunOnMLNode();
    cy.wait(1000);

    cy.uploadModelByUrl({
      name: uploadModelName,
      version: '1.0.0',
      model_format: 'TORCH_SCRIPT',
      model_task_type: 'text_embedding',
      model_config: {
        model_type: 'bert',
        embedding_dimension: 768,
        framework_type: 'sentence_transformers',
        all_config:
          '{"architectures":["BertModel"],"max_position_embeddings":512,"model_type":"bert","num_attention_heads":12,"num_hidden_layers":6}',
      },
      url: 'https://github.com/opensearch-project/ml-commons/blob/2.x/ml-algorithms/src/test/resources/org/opensearch/ml/engine/algorithms/text_embedding/traced_small_model.zip?raw=true',
    })
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

    cy.get('[aria-label="Search by name or ID"]').type(uploadModelName);

    cy.contains(uploadedModelId)
      .closest('tr')
      .contains(uploadedModelLoadedError ? 'Not responding' : 'Responding')
      .closest('tr')
      .contains(uploadModelName);

    cy.contains('h1', 'Overview');
    cy.contains('h2', 'Deployed models');
  });

  it('should open preview panel after view detail button click', () => {
    cy.visit(MLC_URL.OVERVIEW);

    cy.get('[aria-label="Search by name or ID"]').type(uploadModelName);

    cy.contains(uploadedModelId)
      .closest('tr')
      .find('[aria-label="view detail"]')
      .click();

    cy.contains('.euiFlyoutHeader > h3', uploadModelName);
    cy.contains('.euiFlyoutBody', uploadedModelId);
  });
});
