/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLC_API } from './constants';

Cypress.Commands.add('cyclingCheckTask', ({ taskId, rejectOnError = true }) =>
  cy.wrap(
    new Cypress.Promise((resolve, reject) => {
      const checkTask = () => {
        cy.getMLCommonsTask(taskId).then((payload) => {
          if (payload.error) {
            if (rejectOnError) {
              reject(new Error(payload.error));
              return;
            }
            resolve(payload);
            return;
          }
          if (payload.state === 'COMPLETED') {
            resolve(payload);
            return;
          }
          cy.wait(1000);
          checkTask();
        });
      };
      checkTask();
    })
  )
);

Cypress.Commands.add('uploadModelByUrl', (body) =>
  cy
    .request({
      method: 'POST',
      url: MLC_API.MODEL_UPLOAD,
      body,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('deleteMLCommonsModel', (modelId) =>
  cy.request('DELETE', `${MLC_API.MODEL_BASE}/${modelId}`)
);

Cypress.Commands.add('loadMLCommonsModel', (modelId) =>
  cy
    .request({
      method: 'POST',
      url: `${MLC_API.MODEL_BASE}/${modelId}/_load`,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('unloadMLCommonsModel', (modelId) =>
  cy
    .request({
      method: 'POST',
      url: `${MLC_API.MODEL_BASE}/${modelId}/_unload`,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('getMLCommonsTask', (taskId) => {
  return cy
    .request({
      method: 'GET',
      url: `${MLC_API.TASK_BASE}/${taskId}`,
    })
    .then(({ body }) => body);
});

Cypress.Commands.add('disableOnlyRunOnMLNode', () => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/_cluster/settings`, {
    transient: {
      'plugins.ml_commons.only_run_on_ml_node': false,
    },
  });
});
