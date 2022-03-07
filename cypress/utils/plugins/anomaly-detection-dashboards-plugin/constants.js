/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';

/**
 *****************************
 URL CONSTANTS
 *****************************
 */

const BASE_AD_PATH = BASE_PATH + '/app/anomaly-detection-dashboards#';

export const AD_URL = {
  OVERVIEW: BASE_AD_PATH + '/overview',
  DASHBOARD: BASE_AD_PATH + '/dashboard',
  DETECTOR_LIST: BASE_AD_PATH + '/detectors',
  CREATE_AD: BASE_AD_PATH + '/create-ad',
};

/**
 *****************************
 PUBLIC API CONSTANTS
 *****************************
 */

const AD_BASE_API_PATH = '_plugins/_anomaly_detection/detectors';

export function getADGetDetectorApiPath(detectorId) {
  return AD_BASE_API_PATH + '/' + detectorId;
}

export function getADStopDetectorApiPath(detectorId) {
  return AD_BASE_API_PATH + '/' + detectorId + '/_stop';
}

/**
 *****************************
 NODE API / SERVER CONSTANTS
 *****************************
 */

const BASE_AD_NODE_API_PATH = BASE_PATH + '/api/anomaly_detectors';

export const AD_NODE_API_PATH = {
  GET_DETECTORS: BASE_AD_NODE_API_PATH + '/detectors*',
  GET_INDICES: BASE_AD_NODE_API_PATH + '/_indices*',
  GET_MAPPINGS: BASE_AD_NODE_API_PATH + '/_mappings*',
  VALIDATE: BASE_AD_NODE_API_PATH + '/detectors/_validate',
};

function getBaseNodeApiPath(detectorId) {
  return BASE_AD_NODE_API_PATH + '/detectors/' + detectorId;
}

export function getADStartDetectorNodeApiPath(detectorId) {
  return getBaseNodeApiPath(detectorId) + '/start';
}

export function getADStopDetectorNodeApiPath(detectorId) {
  return getBaseNodeApiPath(detectorId) + '/stop';
}

export function getADDeleteDetectorNodeApiPath(detectorId) {
  return getBaseNodeApiPath(detectorId);
}

/**
 *****************************
 MISC CONSTANTS
 *****************************
 */

export const AD_FIXTURE_BASE_PATH =
  'plugins/anomaly-detection-dashboards-plugin/';

export const TEST_DETECTOR_ID = 'ulgqpXEBqtadYz9j2MHG';

export const DETECTOR_STATE = {
  DISABLED: 'Stopped',
  INIT: 'Initializing',
  RUNNING: 'Running',
  FEATURE_REQUIRED: 'Feature required',
};
