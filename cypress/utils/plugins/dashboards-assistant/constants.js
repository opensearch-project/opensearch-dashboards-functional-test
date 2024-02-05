/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// export const WORKFLOW_API_PREFIX = '/_plugins/_flow_framework/workflow';
export const ML_COMMONS_API_PREFIX = '/_plugins/_ml';

// export const FLOW_FRAMEWORK_API = {
//   CREATE_FLOW_TEMPLATE: WORKFLOW_API_PREFIX,
// };

export const ML_COMMONS_API = {
  CREATE_CONNECTOR: `${ML_COMMONS_API_PREFIX}/connectors/_create`,
  CREATE_MODEL: `${ML_COMMONS_API_PREFIX}/models/_register`,
  CREATE_AGENT: `${ML_COMMONS_API_PREFIX}/agents/_register`,
  UPDATE_ROOT_AGENT_CONFIG: `/.plugins-ml-config/_doc/os_chat`,
  AGENT_CONFIG: `${ML_COMMONS_API_PREFIX}/config/os_chat`,
};

export const ASSISTANT_API_BASE = '/api/assistant';

export const ASSISTANT_API = {
  SEND_MESSAGE: `${ASSISTANT_API_BASE}/send_message`,
  CONVERSATION: `${ASSISTANT_API_BASE}/conversation`,
};
