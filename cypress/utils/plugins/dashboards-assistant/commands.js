/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import chatFlowTemplateJSON from '../../../fixtures/plugins/dashboards-assistant/flow-templates/chat.json';
import { BACKEND_BASE_PATH, BASE_PATH } from '../../constants';
import {
  ML_COMMONS_API,
  ASSISTANT_API,
  FLOW_FRAMEWORK_API,
  ASSISTANT_AGENT_NAME,
} from './constants';
import clusterSettings from '../../../fixtures/plugins/dashboards-assistant/cluster_settings.json';
import { apiRequest } from '../../helpers';
import {
  certPrivateKeyContent,
  certPublicKeyContent,
} from '../../../fixtures/plugins/dashboards-assistant/security-cert';

Cypress.Commands.add('addAssistantRequiredSettings', () => {
  cy.request('PUT', `${BACKEND_BASE_PATH}/_cluster/settings`, clusterSettings);
});

const provisionedWorkflows = [];
const agents = [
  {
    type: 'os_chat_root_agent',
    agentName: ASSISTANT_AGENT_NAME.CHAT,
    flowTemplateJSON: chatFlowTemplateJSON,
  },
];

Cypress.Commands.add('prepareAssistantAgents', () => {
  agents.forEach((agent) => {
    cy.readOrRegisterRootAgent(agent);
  });
});

Cypress.Commands.add(
  'readOrRegisterRootAgent',
  ({ type, agentName, flowTemplateJSON }) =>
    cy
      .request({
        url: `${BACKEND_BASE_PATH}${ML_COMMONS_API.AGENT_CONFIG.replace(
          '<agent_name>',
          agentName
        )}`,
        method: 'GET',
        failOnStatusCode: false,
      })
      .then((resp) => {
        const agentId = get(resp, 'body.configuration.agent_id');
        if (agentId) {
          cy.log(
            `Already initialized agent: ${agentId}, skip the initialize step`
          );
        } else {
          cy.log(`Agent id not initialized yet, set up agent`);
          return cy.registerAgent({
            flowTemplateJSON,
            agentName,
            type,
          });
        }
      })
);

Cypress.Commands.add(
  'requestPollUntil',
  (requestConfig, predicate, options = {}) => {
    const { timeout = 30000, interval = 1000 } = options;
    const startTime = Date.now();

    const attempt = () => {
      // Check if we've exceeded timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Timed out after ${timeout}ms waiting for condition to be true`
        );
      }

      return cy.request(requestConfig).then((response) => {
        // If predicate returns true, we're done
        if (predicate(response)) {
          return response;
        }

        // Otherwise wait and try again
        cy.wait(interval);
        return attempt();
      });
    };

    return attempt();
  }
);

Cypress.Commands.add(
  'registerAgent',
  ({ flowTemplateJSON, agentName, type }) => {
    cy.request(
      'POST',
      `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.ROOT}`,
      flowTemplateJSON
    )
      .then((resp) => {
        return cy
          .request(
            'POST',
            `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.PROVISION.replace(
              '<workflow_id>',
              resp.body.workflow_id
            )}`
          )
          .then((resp) => {
            const workflowId = resp.body.workflow_id;
            provisionedWorkflows.push({ workflowId });
            return workflowId;
          });
      })
      .then((workflowId) =>
        cy
          .requestPollUntil(
            {
              method: 'GET',
              url: `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.ROOT}/${workflowId}/_status?all=true`,
            },
            (resp) => {
              const { state, provisioning_progress: provisioningProgress } =
                resp.body;
              return state === 'COMPLETED' && provisioningProgress === 'DONE';
            }
          )
          .then((resp) => {
            const { resources_created: resourcesCreated } = resp.body;
            const agentResource = resourcesCreated.find(
              ({
                workflow_step_id: workflowStepId,
                resource_type: resourceType,
              }) => resourceType === 'agent_id' && workflowStepId === agentName
            );
            if (!agentResource) {
              return new Error(
                `Unable to find agent for ${agentName} in workflow ${workflowId}`
              );
            }
            const agentId = agentResource.resource_id;
            provisionedWorkflows
              .filter((workflow) => workflow.workflowId === workflowId)
              .forEach((workflow) => {
                workflow.agentName = agentName;
              });
            return agentId;
          })
      )
      .then((agentId) => cy.putAgentIdConfig({ type, agentName, agentId }));
  }
);

Cypress.Commands.add('putAgentIdConfig', ({ type, agentName, agentId }) => {
  // When enabling the DATASOURCE-MANAGEment-ENABLED flag, we need to config the root agent ID in a no auth data source.
  if (
    Cypress.env('SECURITY_ENABLED') &&
    !Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
  ) {
    // The .plugins-ml-config index is a system index and need to call the API by using certificate file
    return cy.exec(
      `curl -k --cert <(cat <<EOF \n${certPublicKeyContent}\nEOF\n) --key <(cat <<EOF\n${certPrivateKeyContent}\nEOF\n) -XPUT '${BACKEND_BASE_PATH}${ML_COMMONS_API.ML_CONFIG_DOC.replace(
        '<agent_name>',
        agentName
      )}'  -H 'Content-Type: application/json' -d '{"type":"os_chat_root_agent","configuration":{"agent_id":"${agentId}"}}'`
    );
  } else {
    return cy.request(
      'PUT',
      `${BACKEND_BASE_PATH}${ML_COMMONS_API.ML_CONFIG_DOC.replace(
        '<agent_name>',
        agentName
      )}`,
      {
        type,
        configuration: {
          agent_id: agentId,
        },
      }
    );
  }
});

Cypress.Commands.add('deleteAgentConfig', ({ agentName }) => {
  // When enabling the DATASOURCE-MANAGEment-ENABLED flag, we need to config the root agent ID in a no auth data source.
  if (
    Cypress.env('SECURITY_ENABLED') &&
    !Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
  ) {
    // The .plugins-ml-config index is a system index and need to call the API by using certificate file
    return cy.exec(
      `curl -k --cert <(cat <<EOF \n${certPublicKeyContent}\nEOF\n) --key <(cat <<EOF\n${certPrivateKeyContent}\nEOF\n) -XPUT '${BACKEND_BASE_PATH}${ML_COMMONS_API.ML_CONFIG_DOC.replace(
        '<agent_name>',
        agentName
      )}'  -H 'Content-Type: application/json'`
    );
  } else {
    return cy.request(
      'DELETE',
      `${BACKEND_BASE_PATH}${ML_COMMONS_API.ML_CONFIG_DOC.replace(
        '<agent_name>',
        agentName
      )}`
    );
  }
});

Cypress.Commands.add('cleanProvisionedAgents', () => {
  for (let i = 0; i < provisionedWorkflows.length; i++) {
    const workflow = provisionedWorkflows[i];
    cy.request(
      'POST',
      `${BACKEND_BASE_PATH}${FLOW_FRAMEWORK_API.DEPROVISION.replace(
        '<workflow_id>',
        workflow.workflowId
      )}`
    );
    if (workflow.agentName) {
      cy.deleteAgentConfig({
        agentName: workflow.agentName,
      });
    }
  }
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

Cypress.Commands.add('sendAssistantMessage', (body, dataSourceId) => {
  const url = `${BASE_PATH}${ASSISTANT_API.SEND_MESSAGE}`;
  const qs = { dataSourceId: dataSourceId };
  apiRequest(url, 'POST', body, qs);
});

Cypress.Commands.add('deleteConversation', (conversationId, dataSourceId) => {
  const url = `${BASE_PATH}${ASSISTANT_API.CONVERSATION}/${conversationId}`;
  const qs = { dataSourceId: dataSourceId };
  apiRequest(url, 'DELETE', undefined, qs);
});

Cypress.Commands.add('setDefaultDataSourceForAssistant', () => {
  if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
    cy.deleteAllDataSources();
    // create data source
    cy.createDataSourceNoAuth().then((result) => {
      const dataSourceId = result[0];
      // set default data source
      cy.setDefaultDataSource(dataSourceId);
      return cy.wrap(dataSourceId);
    });
  }
});

Cypress.Commands.add('clearDataSourceForAssistant', () => {
  if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
    cy.deleteAllDataSources();
  }
});
