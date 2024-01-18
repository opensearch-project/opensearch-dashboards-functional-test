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
        '^https://bedrock-runtime\\.us-west-2\\.amazonaws\\.com/.*$',
      ],
    },
  });
});

Cypress.Commands.add('registerRootAgent', () => {
  cy.request(
    'POST',
    `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.CREATE_FLOW_TEMPLATE}`,
    JSON.parse(
      JSON.stringify(FlowTemplateJSON)
        .replace(
          '${CYPRESS_AWS_ACCOUNT_ACCESS_KEY}',
          Cypress.env('CYPRESS_AWS_ACCOUNT_ACCESS_KEY') || ''
        )
        .replace(
          '${CYPRESS_AWS_ACCOUNT_SECRET_KEY}',
          Cypress.env('CYPRESS_AWS_ACCOUNT_SECRET_KEY') || ''
        )
    )
  ).then((resp) => {
    // ML needs 10 seconds to initialize its master key
    // The ML encryption master key has not been initialized yet. Please retry after waiting for 10 seconds.
    cy.wait(10000);
    const workflowId = resp.body.workflow_id;
    if (workflowId) {
      cy.request(
        'POST',
        `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.CREATE_FLOW_TEMPLATE}/${workflowId}/_provision`
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
