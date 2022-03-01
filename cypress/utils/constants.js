/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const BASE_PATH = Cypress.config('baseUrl');

/**
 *****************************
 AD PLUGIN CONSTANTS
 *****************************
 */

export const AD_FIXTURE_BASE_PATH = 'plugins/anomaly-detection-dashboards-plugin/'

export const BASE_AD_PATH = BASE_PATH + '/app/anomaly-detection-dashboards#';

export const BASE_AD_DASHBOARDS_PATH = BASE_AD_PATH + '/dashboard';

export const BASE_AD_DETECTOR_LIST_PATH = BASE_AD_PATH + '/detectors';

export const BASE_AD_CREATE_AD_PATH = BASE_AD_PATH + '/create-ad';

export const BASE_AD_NODE_API_PATH = BASE_PATH + '/api/anomaly_detectors';

export const AD_GET_DETECTORS_NODE_API_PATH =
  BASE_AD_NODE_API_PATH + '/detectors*';

export const AD_GET_INDICES_NODE_API_PATH =
  BASE_AD_NODE_API_PATH + '/_indices*';

export const AD_GET_MAPPINGS_NODE_API_PATH =
  BASE_AD_NODE_API_PATH + '/_mappings*';

export function getADStartDetectorNodeApiPath(detectorId) {
  return BASE_AD_NODE_API_PATH + '/detectors/' + detectorId + '/start';
}

export function getADStopDetectorNodeApiPath(detectorId) {
  return BASE_AD_NODE_API_PATH + '/detectors/' + detectorId + '/stop';
}

export const TEST_DETECTOR_ID = 'ulgqpXEBqtadYz9j2MHG';

// TODO: when repo is onboarded to typescript we can convert these detector states into an enum
export const DETECTOR_STATE_DISABLED = 'Stopped';

export const DETECTOR_STATE_INIT = 'Initializing';

export const DETECTOR_STATE_RUNNING = 'Running';

export const DETECTOR_STATE_FEATURE_REQUIRED = 'Feature required';


/**
 *****************************
 SECURITY PLUGIN CONSTANTS
 *****************************
 */


// Fixtures path
export const SEC_FIXTURES_BASE_PATH = 'plugins/security';
export const SEC_PERMISSIONS_FIXTURES_PATH = SEC_FIXTURES_BASE_PATH + '/permissions';
export const SEC_AUDIT_FIXTURES_PATH = SEC_FIXTURES_BASE_PATH + '/audit';
export const SEC_INTERNALUSERS_FIXTURES_PATH = SEC_FIXTURES_BASE_PATH + '/internalusers';
export const SEC_ROLES_FIXTURES_PATH = SEC_FIXTURES_BASE_PATH + '/roles';
export const SEC_TENANTS_FIXTURES_PATH = SEC_FIXTURES_BASE_PATH + '/tenants';

// UI PATHS
export const BASE_SEC_UI_PATH = '/app/security-dashboards-plugin#';

export const SEC_UI_AUTH_PATH = BASE_SEC_UI_PATH + '/auth';

export const SEC_UI_ROLES_PATH = BASE_SEC_UI_PATH + '/roles';
export const SEC_UI_ROLES_CREATE_PATH = SEC_UI_ROLES_PATH + '/create';

export const SEC_UI_INTERNAL_USERS_PATH = BASE_SEC_UI_PATH + '/users';
export const SEC_UI_USER_EDIT_PATH = SEC_UI_INTERNAL_USERS_PATH + '/edit';
export const SEC_UI_USER_CREATE_PATH = SEC_UI_INTERNAL_USERS_PATH + '/create';
export const SEC_UI_USER_DUPLICATE_PATH = SEC_UI_INTERNAL_USERS_PATH + '/duplicate';

export const SEC_UI_PERMISSIONS_PATH = BASE_SEC_UI_PATH + '/permissions';

export const SEC_UI_TENANTS_PATH = BASE_SEC_UI_PATH + '/tenants';

export const SEC_UI_AUDIT_LOGGING_PATH = BASE_SEC_UI_PATH + '/auditLogging';

// API PATHS
export const BASE_SEC_API_PATH = '/api/v1/configuration';

export const SEC_API_CONFIG_PATH = BASE_SEC_API_PATH + '/securityconfig';

export const SEC_API_ROLES_PATH = BASE_SEC_API_PATH + '/roles';
export const SEC_API_ROLESMAPPING_PATH = BASE_SEC_API_PATH + '/rolesmapping';

export const SEC_API_ACTIONGROUPS_PATH = BASE_SEC_API_PATH + '/actiongroups';

export const SEC_API_TENANTS_PATH = BASE_SEC_API_PATH + '/tenants';

export const SEC_API_INTERNAL_USERS_PATH = BASE_SEC_API_PATH + '/internalusers';

export const SEC_API_ACCOUNT_PATH = BASE_SEC_API_PATH + '/account';

export const SEC_API_AUDIT_PATH = BASE_SEC_API_PATH + '/audit';
export const SEC_API_AUDIT_CONFIG_PATH = SEC_API_AUDIT_PATH + '/config';

export const SEC_API_AUTHINFO_PATH = '/api/v1/auth/authinfo';
export const SEC_API_TENANT_PATH = '/api/v1/multitenancy/tenant';

