/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH, BACKEND_BASE_PATH } from '../../base_constants';
/**
 *****************************
 URL CONSTANTS
 *****************************
 */

const BASE_FF_PATH = BASE_PATH + '/app/search-studio#';

export const FF_URL = {
  WORKFLOWS: BASE_FF_PATH + '/workflows',
  WORKFLOWS_LIST: BASE_FF_PATH + '/workflows?tab=manage',
  WORKFLOWS_NEW: BASE_FF_PATH + '/workflows?tab=create',
};

export const WORKFLOW_DETAIL_URL_SEGMENT = '/workflows/';

/**
 *****************************
 PUBLIC API CONSTANTS
 *****************************
 */

export const ML_COMMONS_APIS_PREFIX = BACKEND_BASE_PATH + '/_plugins/_ml';
export const ML_MODELS_BASE_URL = `${ML_COMMONS_APIS_PREFIX}/models`;
export const APIS_MLC = {
  CREATE_CONNECTOR_URL: `${ML_COMMONS_APIS_PREFIX}/connectors/_create`,
  REGISTER_MODEL_URL: `${ML_MODELS_BASE_URL}/_register`,
};

/**
 *****************************
 NODE API / SERVER CONSTANTS
 *****************************
 */

export const BASE_FF_NODE_API_PATH = BASE_PATH + '/api/flow_framework';
export const INGEST_NODE_API_PATH = BASE_FF_NODE_API_PATH + '/opensearch/bulk';
export const SEARCH_NODE_API_PATH =
  BASE_FF_NODE_API_PATH + '/opensearch/search';

/**
 *****************************
 MISC CONSTANTS
 *****************************
 */

export const FF_FIXTURE_BASE_PATH = 'plugins/dashboards-flow-framework/';

export const FF_TIMEOUT = 100000;
