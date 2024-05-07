/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_API_CONFIG_PATH,
  SEC_API_ROLES_PATH,
  SEC_API_INTERNAL_ACCOUNTS_PATH,
  SEC_API_ACTIONGROUPS_PATH,
  SEC_API_TENANTS_PATH,
  SEC_API_AUDIT_PATH,
  SEC_API_AUDIT_CONFIG_PATH,
  SEC_API_CACHE_PURGE_PATH,
} from '../../constants';

/**
 *****************************
 SECURITY PLUGIN COMMANDS
 *****************************
 */
Cypress.Commands.add(
  'mockAuthAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(`${SEC_API_CONFIG_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getAuthDetails');

    funcMockedOn();

    cy.wait('@getAuthDetails');
  }
);

Cypress.Commands.add(
  'mockRolesAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(`${SEC_API_ROLES_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getRoleDetails');

    funcMockedOn();

    cy.wait('@getRoleDetails');
  }
);

Cypress.Commands.add(
  'mockInternalUsersAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(`${SEC_API_INTERNAL_ACCOUNTS_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getInternalUsersDetails');

    funcMockedOn();

    cy.wait('@getInternalUsersDetails');
  }
);

Cypress.Commands.add(
  'mockPermissionsAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(`${SEC_API_ACTIONGROUPS_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getPermissions');

    funcMockedOn();

    cy.wait('@getPermissions');
  }
);

Cypress.Commands.add(
  'mockTenantsAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(`${SEC_API_TENANTS_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getTenants');

    funcMockedOn();

    cy.wait('@getTenants');
  }
);

Cypress.Commands.add(
  'mockAuditLogsAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(`${SEC_API_AUDIT_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getAuditInfo');

    funcMockedOn();

    cy.wait('@getAuditInfo');
  }
);

Cypress.Commands.add(
  'mockAuditConfigUpdateAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(
      { method: 'POST', url: `${SEC_API_AUDIT_CONFIG_PATH}*` },
      {
        fixture: fixtureFileName,
      }
    ).as('configUpdate');

    funcMockedOn();

    cy.wait('@configUpdate');
  }
);

Cypress.Commands.add(
  'mockCachePurgeAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(
      { method: 'DELETE', url: `${SEC_API_CACHE_PURGE_PATH}*` },
      {
        fixture: fixtureFileName,
      }
    ).as('purgeCache');

    funcMockedOn();

    cy.wait('@purgeCache');
  }
);
