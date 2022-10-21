/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 *****************************
 SECURITY DASHBOARDS PLUGIN CONSTANTS
 *****************************
 */

//Security API Constants
export const SEC_API_PREFIX = '/_plugins/_security/api';
export const SEC_API = {
    TENANTS_BASE: `${SEC_API_PREFIX}/tenants`,
    INTERNALUSERS_BASE: `${SEC_API_PREFIX}/internalusers`,
    ROLE_BASE: `${SEC_API_PREFIX}/roles`,
    ROLE_MAPPING_BASE: `${SEC_API_PREFIX}/rolesmapping`,
}
