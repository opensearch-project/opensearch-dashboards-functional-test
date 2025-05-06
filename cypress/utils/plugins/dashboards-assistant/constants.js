/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const WORKFLOW_API_PREFIX = '/_plugins/_flow_framework/workflow';
export const ML_COMMONS_API_PREFIX = '/_plugins/_ml';

export const FLOW_FRAMEWORK_API = {
  ROOT: WORKFLOW_API_PREFIX,
  PROVISION: `${WORKFLOW_API_PREFIX}/<workflow_id>/_provision`,
  DEPROVISION: `${WORKFLOW_API_PREFIX}/<workflow_id>/_deprovision`,
  STATUS: `${WORKFLOW_API_PREFIX}/<workflow_id>/_status`,
};

export const ASSISTANT_AGENT_NAME = {
  CHAT: 'os_chat',
  TEXT2VEGA: 'os_text2vega',
  TEXT2VEGA_WITH_INSTRUCTIONS: 'os_text2vega_with_instructions',
  QUERY_ASSISTANT_PPL: 'os_query_assist_ppl',
};

export const ML_COMMONS_API = {
  CREATE_CONNECTOR: `${ML_COMMONS_API_PREFIX}/connectors/_create`,
  CREATE_MODEL: `${ML_COMMONS_API_PREFIX}/models/_register`,
  CREATE_AGENT: `${ML_COMMONS_API_PREFIX}/agents/_register`,
  ML_CONFIG_DOC: '/.plugins-ml-config/_doc/<agent_name>',
  AGENT_CONFIG: `${ML_COMMONS_API_PREFIX}/config/<agent_name>`,
};

export const ASSISTANT_API_BASE = '/api/assistant';

export const ASSISTANT_API = {
  SEND_MESSAGE: `${ASSISTANT_API_BASE}/send_message`,
  CONVERSATION: `${ASSISTANT_API_BASE}/conversation`,
};
