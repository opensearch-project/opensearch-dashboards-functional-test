/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import FlowTemplateJSON from '../../../fixtures/plugins/dashboards-assistant/flow-template.json';
import { BACKEND_BASE_PATH, BASE_PATH } from '../../constants';
import { ML_COMMONS_API, ASSISTANT_API } from './constants';
import clusterSettings from '../../../fixtures/plugins/dashboards-assistant/cluster_settings.json';
import { apiRequest } from '../../helpers';

Cypress.Commands.add('addAssistantRequiredSettings', () => {
  cy.request('PUT', `${BACKEND_BASE_PATH}/_cluster/settings`, clusterSettings);
});

const agentParameters = {
  connectorId: '',
  modelId: '',
  conversationalAgentId: '',
  rootAgentId: '',
};

Cypress.Commands.add('registerRootAgent', () => {
  // ML needs 10 seconds to initialize its master key
  // The ML encryption master key has not been initialized yet. Please retry after waiting for 10 seconds.
  cy.wait(10000);
  /**
   * TODO use flow framework if the plugin get integrate in the future.
   */
  // cy.request(
  //   'POST',
  //   `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.CREATE_FLOW_TEMPLATE}`,
  //   FlowTemplateJSON
  // ).then((resp) => {
  //   usingWorkflowId = resp.body.workflow_id;
  //   if (usingWorkflowId) {
  //     cy.request(
  //       'POST',
  //       `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.CREATE_FLOW_TEMPLATE}/${usingWorkflowId}/_provision`
  //     );
  //     /**
  //      * wait for 2s
  //      */
  //     cy.wait(2000);
  //   } else {
  //     throw new Error(resp);
  //   }
  // });
  const nodesMap = {};
  FlowTemplateJSON.workflows.provision.nodes.forEach((node) => {
    nodesMap[node.type] = nodesMap[node.type] || [];
    nodesMap[node.type].push(node);
  });
  cy.request(
    'POST',
    `${BACKEND_BASE_PATH}${ML_COMMONS_API.CREATE_CONNECTOR}`,
    nodesMap.create_connector[0].user_inputs
  )
    .then((resp) => {
      agentParameters.connectorId = resp.body.connector_id;
      return cy.request(
        'POST',
        `${BACKEND_BASE_PATH}${ML_COMMONS_API.CREATE_MODEL}?deploy=true`,
        {
          ...nodesMap.register_remote_model[0].user_inputs,
          connector_id: agentParameters.connectorId,
          function_name: 'remote',
        }
      );
    })
    .then((resp) => {
      agentParameters.modelId = resp.body.model_id;
      return cy.request(
        'POST',
        `${BACKEND_BASE_PATH}${ML_COMMONS_API.CREATE_AGENT}`,
        {
          ...nodesMap.register_agent[0].user_inputs,
          llm: {
            parameters:
              nodesMap.register_agent[0].user_inputs['llm.parameters'],
            model_id: agentParameters.modelId,
          },
          tools: [nodesMap.create_tool[0]].map((item) => item.user_inputs),
        }
      );
    })
    .then((resp) => {
      agentParameters.conversationalAgentId = resp.body.agent_id;
      return cy.request(
        'POST',
        `${BACKEND_BASE_PATH}${ML_COMMONS_API.CREATE_AGENT}`,
        {
          ...nodesMap.register_agent[1].user_inputs,
          tools: [
            {
              ...nodesMap.create_tool[1].user_inputs,
              parameters: {
                ...nodesMap.create_tool[1].user_inputs.parameters,
                agent_id: agentParameters.conversationalAgentId,
              },
            },
            {
              ...nodesMap.create_tool[2].user_inputs,
              parameters: {
                ...nodesMap.create_tool[2].user_inputs.parameters,
                model_id: agentParameters.modelId,
              },
            },
          ],
        }
      );
    })
    .then((resp) => {
      agentParameters.rootAgentId = resp.body.agent_id;
    });
});

Cypress.Commands.add('cleanRootAgent', () => {
  return;
  /**
   * TODO wait for flow framework to be built into snapshot.
   */
  // cy.request(
  //   'POST',
  //   `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.CREATE_FLOW_TEMPLATE}/${usingWorkflowId}/_deprovision`
  // );
  // /**
  //  * wait for 2s
  //  */
  // cy.wait(2000);
});

Cypress.Commands.add('startDummyServer', () => {
  // Not a good practice to start a server inside Cypress https://docs.cypress.io/guides/references/best-practices#Web-Servers
  // But in out case, we need to reuse release e2e template and let's make it a tradeoff.
  cy.exec(`nohup yarn start-dummy-llm-server > /dev/null 2>&1 &`);
});

Cypress.Commands.add('stopDummyServer', () => {
  /**
   * For windows and Linux
   */
  cy.exec(`netstat -ano | grep "3000" | awk '{print $5}' | xargs kill -9`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    if (result.stderr) {
      /**
       * For Macos
       */
      cy.exec(`lsof -ti :3000 -sTCP:LISTEN | xargs kill`, {
        failOnNonZeroExit: false,
      });
    }
  });
});

Cypress.Commands.add('sendAssistantMessage', (body) =>
  apiRequest(`${BASE_PATH}${ASSISTANT_API.SEND_MESSAGE}`, 'POST', body)
);

Cypress.Commands.add('deleteConversation', (conversationId) =>
  apiRequest(
    `${BASE_PATH}${ASSISTANT_API.CONVERSATION}/${conversationId}`,
    'DELETE'
  )
);
