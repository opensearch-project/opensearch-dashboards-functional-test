/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SEC_API } from '../../constants';

/**
 *****************************
 SECURITY DASHBOARDS PLUGIN COMMANDS
 *****************************
 */

Cypress.Commands.add('createTenant', (tenantID, tenantJson) => {
  return cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.TENANTS_BASE}/${tenantID}`,
    tenantJson
  );
});

Cypress.Commands.add('createInternalUser', (userID, userJson) => {
  return cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.INTERNALUSERS_BASE}/${userID}`,
    userJson
  );
});

Cypress.Commands.add('deleteInternalUser', (userID) => {
  return cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${SEC_API.INTERNALUSERS_BASE}/${userID}`
  );
});

Cypress.Commands.add('createRole', (roleID, roleJson) => {
  return cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_BASE}/${roleID}`,
    roleJson
  );
});

Cypress.Commands.add('deleteRole', (roleID) => {
  return cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_BASE}/${roleID}`
  );
});

Cypress.Commands.add('createRoleMapping', (roleID, rolemappingJson) => {
  return cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_MAPPING_BASE}/${roleID}`,
    rolemappingJson
  );
});

Cypress.Commands.add('deleteRoleMapping', (roleID) => {
  return cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_MAPPING_BASE}/${roleID}`
  );
});
