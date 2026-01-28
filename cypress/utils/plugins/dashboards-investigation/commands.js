/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BACKEND_BASE_PATH } from '../../constants';
import { ML_COMMONS_API } from '../dashboards-assistant/constants';
import {
  certPrivateKeyContent,
  certPublicKeyContent,
} from '../../../fixtures/plugins/dashboards-assistant/security-cert';

export const INVESTIGATION_AGENT_NAME = {
  DEEP_RESEARCH: 'os_deep_research',
};

let registeredConnectorId = null;
let registeredModelId = null;
let registeredAgentId = null;

Cypress.Commands.add('prepareInvestigationAgents', () => {
  // Configure trusted connector endpoints, allow private IPs, and enable agentic memory
  cy.request({
    method: 'PUT',
    url: `${BACKEND_BASE_PATH}/_cluster/settings`,
    body: {
      persistent: {
        'plugins.ml_commons.trusted_connector_endpoints_regex': [
          '^https://runtime\\.sagemaker\\..*[a-z0-9-]\\.amazonaws\\.com/.*$',
          '^https://api\\.openai\\.com/.*$',
          '^https://api\\.cohere\\.ai/.*$',
          '^https://bedrock-runtime\\..*[a-z0-9-]\\.amazonaws\\.com/.*$',
          '^http://localhost:3001/.*$',
          '^http://127\\.0\\.0\\.1:3001/.*$',
        ],
        'plugins.ml_commons.connector.private_ip_enabled': true,
        'plugins.ml_commons.agentic_memory_enabled': true,
        'plugins.ml_commons.index_insight_feature_enabled': true,
      },
    },
    failOnStatusCode: false,
  });

  // Step 1: Create connector
  cy.createInvestigationConnector().then((connectorId) => {
    registeredConnectorId = connectorId;

    // Step 2: Register and deploy model
    cy.registerInvestigationModel(connectorId).then((modelId) => {
      registeredModelId = modelId;

      // Step 3: Create memory container
      cy.createInvestigationMemoryContainer().then((containerId) => {
        // Step 4: Register PER agent with memory_container_id
        cy.registerInvestigationPERAgent(modelId, containerId).then(
          (agentId) => {
            registeredAgentId = agentId;

            // Step 5: Put agent config
            cy.putInvestigationAgentConfig({
              type: 'os_assistant_agent',
              agentName: INVESTIGATION_AGENT_NAME.DEEP_RESEARCH,
              agentId,
            });
          }
        );
      });
    });
  });
});

// Create connector for dummy LLM server
Cypress.Commands.add('createInvestigationConnector', () => {
  return cy
    .request({
      method: 'POST',
      url: `${BACKEND_BASE_PATH}/_plugins/_ml/connectors/_create`,
      body: {
        name: 'Cypress Investigation LLM Connector',
        version: '1',
        protocol: 'http',
        description: 'Connector to dummy LLM server for cypress testing',
        actions: [
          {
            action_type: 'predict',
            method: 'POST',
            url: 'http://127.0.0.1:3001/predict',
            headers: { 'content-type': 'application/json' },
            request_body:
              '{"prompt":"${parameters.prompt}", "question":"${parameters.question}"}',
          },
        ],
        credential: { dummy_key: 'dummy_value' },
        parameters: {},
      },
    })
    .then((resp) => {
      if (resp.body.connector_id) {
        cy.log(`Created connector: ${resp.body.connector_id}`);
        return cy.wrap(resp.body.connector_id);
      }
      throw new Error(
        `Failed to create connector: ${JSON.stringify(resp.body)}`
      );
    });
});

// Create memory container
Cypress.Commands.add('createInvestigationMemoryContainer', () => {
  return cy
    .request({
      method: 'POST',
      url: `${BACKEND_BASE_PATH}/_plugins/_ml/memory_containers/_create`,
      body: {
        name: 'cypress-investigation-container',
        description: 'Memory container for cypress investigation tests',
        configuration: {
          disable_session: false,
          disable_history: false,
        },
      },
      failOnStatusCode: false,
    })
    .then((resp) => {
      if (resp.body.memory_container_id) {
        cy.log(`Created memory container: ${resp.body.memory_container_id}`);
        return cy.wrap(resp.body.memory_container_id);
      }
      throw new Error(
        `Failed to create memory container: ${JSON.stringify(resp.body)}`
      );
    });
});

// Register and deploy model
Cypress.Commands.add('registerInvestigationModel', (connectorId) => {
  return cy
    .request({
      method: 'POST',
      url: `${BACKEND_BASE_PATH}/_plugins/_ml/models/_register?deploy=true`,
      body: {
        name: 'cypress-investigation-llm',
        function_name: 'remote',
        description: 'Cypress test LLM model for investigation',
        connector_id: connectorId,
      },
    })
    .then((resp) => {
      const taskId = resp.body.task_id;
      // Poll for model registration completion
      return cy
        .requestPollUntil(
          {
            method: 'GET',
            url: `${BACKEND_BASE_PATH}/_plugins/_ml/tasks/${taskId}`,
          },
          (taskResp) => taskResp.body.state === 'COMPLETED'
        )
        .then((taskResp) => {
          const modelId = taskResp.body.model_id;
          cy.log(`Registered model: ${modelId}`);
          return cy.wrap(modelId);
        });
    });
});

// Register PER agent with llm_response_filter and memory_container_id
Cypress.Commands.add(
  'registerInvestigationPERAgent',
  (modelId, containerId) => {
    const requestBody = {
      name: 'Cypress Deep Research Agent',
      type: 'plan_execute_and_reflect',
      description: 'PER agent for investigation testing',
      llm: {
        model_id: modelId,
        parameters: {
          prompt: '${parameters.question}',
        },
      },
      memory: {
        type: 'agentic_memory',
        memory_container_id: containerId,
      },
      parameters: {
        inject_datetime: 'true',
        // Extract response field from dummy server JSON
        llm_response_filter: '$.response',
      },
      tools: [
        {
          type: 'SearchIndexTool',
          description:
            'Use this tool to search an index by providing index name and query.',
          parameters: {
            return_raw_response: 'true',
          },
          include_output_in_agent_response: false,
        },
        {
          type: 'ListIndexTool',
          include_output_in_agent_response: false,
        },
        {
          type: 'IndexMappingTool',
          include_output_in_agent_response: false,
        },
      ],
      app_type: 'os_chat',
      is_hidden: false,
    };
    cy.log(`Registering PER agent with body: ${JSON.stringify(requestBody)}`);

    return cy
      .request({
        method: 'POST',
        url: `${BACKEND_BASE_PATH}/_plugins/_ml/agents/_register`,
        body: requestBody,
      })
      .then((resp) => {
        if (resp.body.agent_id) {
          cy.log(`Registered PER agent: ${resp.body.agent_id}`);
          return cy.wrap(resp.body.agent_id);
        }
        throw new Error(
          `Failed to register agent: ${JSON.stringify(resp.body)}`
        );
      });
  }
);

Cypress.Commands.add(
  'putInvestigationAgentConfig',
  ({ type, agentName, agentId }) => {
    const endpoint = `${BACKEND_BASE_PATH}${ML_COMMONS_API.ML_CONFIG_DOC.replace(
      '<agent_name>',
      agentName
    )}`;
    if (BACKEND_BASE_PATH.startsWith('https')) {
      return cy.exec(
        `curl -k --cert <(cat <<EOF \n${certPublicKeyContent}\nEOF\n) --key <(cat <<EOF\n${certPrivateKeyContent}\nEOF\n) -XPUT '${endpoint}'  -H 'Content-Type: application/json' -d '{"type":"${type}","configuration":{"agent_id":"${agentId}"}}'`
      );
    } else {
      return cy.request('PUT', endpoint, {
        type,
        configuration: { agent_id: agentId },
      });
    }
  }
);

Cypress.Commands.add('deleteInvestigationAgentConfig', ({ agentName }) => {
  const endpoint = `${BACKEND_BASE_PATH}${ML_COMMONS_API.ML_CONFIG_DOC.replace(
    '<agent_name>',
    agentName
  )}`;
  if (BACKEND_BASE_PATH.startsWith('https')) {
    return cy.exec(
      `curl -k --cert <(cat <<EOF \n${certPublicKeyContent}\nEOF\n) --key <(cat <<EOF\n${certPrivateKeyContent}\nEOF\n) -XDELETE '${endpoint}'  -H 'Content-Type: application/json'`,
      { failOnNonZeroExit: false }
    );
  } else {
    return cy.request({
      method: 'DELETE',
      url: endpoint,
      failOnStatusCode: false,
    });
  }
});

Cypress.Commands.add('cleanProvisionedInvestigationAgents', () => {
  // Delete PER agent
  if (registeredAgentId) {
    cy.request({
      method: 'DELETE',
      url: `${BACKEND_BASE_PATH}/_plugins/_ml/agents/${registeredAgentId}`,
      failOnStatusCode: false,
    });
  }
  // Undeploy and delete model
  if (registeredModelId) {
    cy.request({
      method: 'POST',
      url: `${BACKEND_BASE_PATH}/_plugins/_ml/models/${registeredModelId}/_undeploy`,
      failOnStatusCode: false,
    });
    cy.request({
      method: 'DELETE',
      url: `${BACKEND_BASE_PATH}/_plugins/_ml/models/${registeredModelId}`,
      failOnStatusCode: false,
    });
  }
  // Delete connector
  if (registeredConnectorId) {
    cy.request({
      method: 'DELETE',
      url: `${BACKEND_BASE_PATH}/_plugins/_ml/connectors/${registeredConnectorId}`,
      failOnStatusCode: false,
    });
  }
  // Delete agent config
  cy.deleteInvestigationAgentConfig({
    agentName: INVESTIGATION_AGENT_NAME.DEEP_RESEARCH,
  });
  cy.wait(1000);
});

Cypress.Commands.add('startInvestigationDummyServer', () => {
  cy.exec(`lsof -ti :3001 | xargs kill -9 2>/dev/null || true`, {
    failOnNonZeroExit: false,
  });
  cy.wait(500);
  cy.exec(
    `nohup yarn start-investigation-dummy-llm-server > /tmp/investigation-llm.log 2>&1 &`
  );
  cy.wait(2000);
});

Cypress.Commands.add('stopInvestigationDummyServer', () => {
  cy.exec(
    `lsof -ti :3001 -sTCP:LISTEN | xargs -r kill -9 2>/dev/null || true`,
    { failOnNonZeroExit: false }
  );
});
