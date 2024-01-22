/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import FlowTemplateJSON from '../../../fixtures/plugins/dashboards-assistant/flow-template.json';
import { BACKEND_BASE_PATH } from '../../constants';
import { FLOW_FRAMEWORK_API } from './constants';

Cypress.Commands.add('addAssistantRequiredSettings', () => {
  cy.request('PUT', `${BACKEND_BASE_PATH}/_cluster/settings`, {
    persistent: {
      'plugins.ml_commons.only_run_on_ml_node': false,
      'plugins.ml_commons.memory_feature_enabled': true,
      'plugins.flow_framework.enabled': true,
      'plugins.ml_commons.trusted_connector_endpoints_regex': [
        '^http://127.0.0.1:3000$',
      ],
    },
  });
});

let usingWorkflowId = '';

Cypress.Commands.add('registerRootAgent', () => {
  // ML needs 10 seconds to initialize its master key
  // The ML encryption master key has not been initialized yet. Please retry after waiting for 10 seconds.
  cy.wait(10000);
  cy.request(
    'POST',
    `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.CREATE_FLOW_TEMPLATE}`,
    FlowTemplateJSON
  ).then((resp) => {
    usingWorkflowId = resp.body.workflow_id;
    if (usingWorkflowId) {
      cy.request(
        'POST',
        `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.CREATE_FLOW_TEMPLATE}/${usingWorkflowId}/_provision`
      );
      /**
       * wait for 2s
       */
      cy.wait(2000);
    } else {
      throw new Error(resp);
    }
  });
});

Cypress.Commands.add('cleanRootAgent', () => {
  cy.request(
    'POST',
    `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.CREATE_FLOW_TEMPLATE}/${usingWorkflowId}/_deprovision`
  );
  /**
   * wait for 2s
   */
  cy.wait(2000);
});

Cypress.Commands.add('startDummyServer', () => {
  // Not a good practice to start a server inside Cypress https://docs.cypress.io/guides/references/best-practices#Web-Servers
  // But in out case, we need to reuse release e2e template and let's make it a tradeoff.
  cy.exec(`nohup yarn start-dummy-llm-server > /dev/null 2>&1 &`);
});

Cypress.Commands.add('stopDummyServer', () => {
  cy.exec(`lsof -ti :3000 -sTCP:LISTEN | xargs kill`);
});
