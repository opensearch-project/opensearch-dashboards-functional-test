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
};
