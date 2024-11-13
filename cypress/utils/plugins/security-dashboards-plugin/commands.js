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
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.TENANTS_BASE}/${tenantID}`,
    tenantJson
  );
  cy.wait(10000);
});

Cypress.Commands.add('createInternalUser', (userID, userJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.INTERNALUSERS_BASE}/${userID}`,
    userJson
  );
  cy.wait(10000);
});

Cypress.Commands.add('deleteInternalUser', (userID) => {
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${SEC_API.INTERNALUSERS_BASE}/${userID}`
  );
  cy.wait(10000);
});

Cypress.Commands.add('createRole', (roleID, roleJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_BASE}/${roleID}`,
    roleJson
  );
  cy.wait(10000);
});

Cypress.Commands.add('deleteRole', (roleID) => {
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_BASE}/${roleID}`
  );
  cy.wait(10000);
});

Cypress.Commands.add('createRoleMapping', (roleID, rolemappingJson) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${SEC_API.ROLE_MAPPING_BASE}/${roleID}`,
    rolemappingJson
  );
  cy.wait(10000);
});
