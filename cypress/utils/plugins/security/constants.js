/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';

/**
 *****************************
 SECURITY PLUGIN CONSTANTS
 *****************************
 */

// Fixtures path
export const SEC_FIXTURES_BASE_PATH = 'plugins/security';
export const SEC_PERMISSIONS_FIXTURES_PATH =
  SEC_FIXTURES_BASE_PATH + '/permissions';
export const SEC_AUDIT_FIXTURES_PATH = SEC_FIXTURES_BASE_PATH + '/audit';
export const SEC_INTERNALUSERS_FIXTURES_PATH =
  SEC_FIXTURES_BASE_PATH + '/internalusers';
export const SEC_ROLES_FIXTURES_PATH = SEC_FIXTURES_BASE_PATH + '/roles';
export const SEC_TENANTS_FIXTURES_PATH = SEC_FIXTURES_BASE_PATH + '/tenants';

// UI PATHS
export const BASE_SEC_UI_PATH = BASE_PATH + '/app/security-dashboards-plugin#';

export const SEC_UI_AUTH_PATH = BASE_SEC_UI_PATH + '/auth';

export const SEC_UI_ROLES_PATH = BASE_SEC_UI_PATH + '/roles';
export const SEC_UI_ROLES_CREATE_PATH = SEC_UI_ROLES_PATH + '/create';

export const SEC_UI_INTERNAL_USERS_PATH = BASE_SEC_UI_PATH + '/users';
export const SEC_UI_USER_EDIT_PATH = SEC_UI_INTERNAL_USERS_PATH + '/edit';
export const SEC_UI_USER_CREATE_PATH = SEC_UI_INTERNAL_USERS_PATH + '/create';
export const SEC_UI_USER_DUPLICATE_PATH =
  SEC_UI_INTERNAL_USERS_PATH + '/duplicate';

export const SEC_UI_PERMISSIONS_PATH = BASE_SEC_UI_PATH + '/permissions';

export const SEC_UI_TENANTS_PATH = BASE_SEC_UI_PATH + '/tenants';

export const SEC_UI_AUDIT_LOGGING_PATH = BASE_SEC_UI_PATH + '/auditLogging';

// API PATHS
export const BASE_SEC_API_PATH = BASE_PATH + '/api/v1/configuration';

export const SEC_API_CONFIG_PATH = BASE_SEC_API_PATH + '/securityconfig';

export const SEC_API_ROLES_PATH = BASE_SEC_API_PATH + '/roles';
export const SEC_API_ROLESMAPPING_PATH = BASE_SEC_API_PATH + '/rolesmapping';

export const SEC_API_ACTIONGROUPS_PATH = BASE_SEC_API_PATH + '/actiongroups';

export const SEC_API_TENANTS_PATH = BASE_SEC_API_PATH + '/tenants';

export const SEC_API_INTERNAL_USERS_PATH = BASE_SEC_API_PATH + '/internalusers';

export const SEC_API_ACCOUNT_PATH = BASE_SEC_API_PATH + '/account';

export const SEC_API_AUDIT_PATH = BASE_SEC_API_PATH + '/audit';
export const SEC_API_AUDIT_CONFIG_PATH = SEC_API_AUDIT_PATH + '/config';

export const SEC_API_CACHE_PURGE_PATH = BASE_SEC_API_PATH + '/cache';

export const SEC_API_AUTHINFO_PATH = BASE_PATH + '/api/v1/auth/authinfo';
export const SEC_API_TENANT_PATH = BASE_PATH + '/api/v1/multitenancy/tenant';
