/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import FlowTemplateJSON from '../../../fixtures/plugins/dashboards-assistant/flow-template.json';
import { BACKEND_BASE_PATH, BASE_PATH } from '../../constants';
import { ML_COMMONS_API, ASSISTANT_API } from './constants';
import clusterSettings from '../../../fixtures/plugins/dashboards-assistant/cluster_settings.json';
import { apiRequest } from '../../helpers';
import {
  certPrivateKeyContent,
  certPublicKeyContent,
} from '../../../fixtures/plugins/dashboards-assistant/security-cert';

Cypress.Commands.add('addAssistantRequiredSettings', () => {
  cy.request('PUT', `${BACKEND_BASE_PATH}/_cluster/settings`, clusterSettings);
});

const agentParameters = {
  connectorId: '',
  modelId: '',
  conversationalAgentId: '',
  rootAgentId: '',
};

Cypress.Commands.add('readOrRegisterRootAgent', () => {
  cy.request({
    url: `${BACKEND_BASE_PATH}${ML_COMMONS_API.AGENT_CONFIG}`,
    method: 'GET',
    failOnStatusCode: false,
  }).then((resp) => {
    const agentId = get(resp, 'body.configuration.agent_id');
    if (agentId) {
      cy.log(`Already initialized agent: ${agentId}, skip the initialize step`);
    } else {
      cy.log(`Agent id not initialized yet, set up agent`);
      return cy.registerRootAgent();
    }
  });
});

Cypress.Commands.add('registerRootAgent', () => {
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
      return cy.putRootAgentId(agentParameters.rootAgentId);
    });
});

Cypress.Commands.add('putRootAgentId', (agentId) => {
  if (Cypress.env('SECURITY_ENABLED')) {
    // The .plugins-ml-config index is a system index and need to call the API by using certificate file
    return cy.exec(
      `curl -k --cert <(cat <<EOF \n${certPublicKeyContent}\nEOF\n) --key <(cat <<EOF\n${certPrivateKeyContent}\nEOF\n) -XPUT '${BACKEND_BASE_PATH}${ML_COMMONS_API.UPDATE_ROOT_AGENT_CONFIG}'  -H 'Content-Type: application/json' -d '{"type":"os_chat_root_agent","configuration":{"agent_id":"${agentId}"}}'`
    );
  } else {
    return cy.request(
      'PUT',
      `${BACKEND_BASE_PATH}${ML_COMMONS_API.UPDATE_ROOT_AGENT_CONFIG}`,
      {
        type: 'os_chat_root_agent',
        configuration: {
          agent_id: agentId,
        },
      }
    );
  }
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
