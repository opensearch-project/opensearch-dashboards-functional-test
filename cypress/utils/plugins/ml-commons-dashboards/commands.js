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
          if (payload && payload.error) {
            if (rejectOnError) {
              reject(new Error(payload.error));
              return;
            }
            resolve(payload);
            return;
          }
          if (payload && payload.state === 'COMPLETED') {
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

Cypress.Commands.add('registerModel', ({ body, qs }) =>
  cy
    .request({
      method: 'POST',
      url: MLC_API.MODEL_REGISTER,
      qs,
      body,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('registerModelGroup', (body) =>
  cy
    .request({
      method: 'POST',
      url: MLC_API.MODEL_GROUP_REGISTER,
      body,
      failOnStatusCode: false,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('deleteModelGroup', (modelGroupId) =>
  cy.request('DELETE', `${MLC_API.MODEL_GROUP_BASE}/${modelGroupId}`)
);

Cypress.Commands.add('deleteMLCommonsModel', (modelId) =>
  cy.request('DELETE', `${MLC_API.MODEL_BASE}/${modelId}`)
);

Cypress.Commands.add('deployMLCommonsModel', (modelId) =>
  cy
    .request({
      method: 'POST',
      url: `${MLC_API.MODEL_BASE}/${modelId}/_deploy`,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('undeployMLCommonsModel', (modelId) =>
  cy
    .request({
      method: 'POST',
      url: `${MLC_API.MODEL_BASE}/${modelId}/_undeploy`,
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

Cypress.Commands.add('disableNativeMemoryCircuitBreaker', () => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/_cluster/settings`, {
    transient: {
      'plugins.ml_commons.native_memory_threshold': 100,
      'plugins.ml_commons.jvm_heap_memory_threshold': 100,
    },
  });
});

Cypress.Commands.add('enableRegisterModelViaURL', () => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env('openSearchUrl')}/_cluster/settings`,
    body: {
      transient: {
        'plugins.ml_commons.allow_registering_model_via_url': true,
      },
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('disableConnectorAccessControl', () => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/_cluster/settings`, {
    transient: {
      'plugins.ml_commons.connector_access_control_enabled': false,
    },
  });
});

Cypress.Commands.add(
  'setTrustedConnectorEndpointsRegex',
  (trustedConnectorEndpointsRegex) => {
    cy.request('PUT', `${Cypress.env('openSearchUrl')}/_cluster/settings`, {
      transient: {
        'plugins.ml_commons.trusted_connector_endpoints_regex':
          trustedConnectorEndpointsRegex,
      },
    });
  }
);

Cypress.Commands.add('createModelConnector', (body) =>
  cy
    .request({
      method: 'POST',
      url: MLC_API.CONNECTOR_CREATE,
      body,
    })
    .then(({ body }) => body)
);

Cypress.Commands.add('deleteModelConnector', (connectorId) =>
  cy.request('DELETE', `${MLC_API.CONNECTOR_BASE}/${connectorId}`)
);
