/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_API_CONFIG_PATH,
  SEC_API_ROLES_PATH,
  SEC_API_ACTIONGROUPS_PATH,
  SEC_API_TENANTS_PATH,
  SEC_API_AUDIT_PATH,
  SEC_API_AUDIT_CONFIG_PATH,
  SEC_API_CACHE_PURGE_PATH,
  SEC_API_INTERNAL_USERS_PATH,
} from '../../constants';

function reloadAfterActionIfNeeded(options = {}) {
  if (options.reloadAfterAction) {
    cy.reload();
  }
}

/**
 *****************************
 SECURITY PLUGIN COMMANDS
 *****************************
 */
Cypress.Commands.add(
  'mockAuthAction',
  function (fixtureFileName, funcMockedOn, options) {
    cy.intercept(`${SEC_API_CONFIG_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getAuthDetails');

    funcMockedOn();
    reloadAfterActionIfNeeded(options);

    cy.wait('@getAuthDetails');
  }
);

Cypress.Commands.add(
  'mockRolesAction',
  function (fixtureFileName, funcMockedOn, options) {
    cy.intercept(`${SEC_API_ROLES_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getRoleDetails');

    funcMockedOn();
    reloadAfterActionIfNeeded(options);

    cy.wait('@getRoleDetails');
  }
);

Cypress.Commands.add(
  'mockInternalUsersAction',
  function (fixtureFileName, funcMockedOn, options) {
    cy.intercept(`${SEC_API_INTERNAL_USERS_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getInternalUsersDetails');

    funcMockedOn();
    reloadAfterActionIfNeeded(options);

    cy.wait('@getInternalUsersDetails');
  }
);

Cypress.Commands.add(
  'mockPermissionsAction',
  function (fixtureFileName, funcMockedOn, options) {
    cy.intercept(`${SEC_API_ACTIONGROUPS_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getPermissions');

    funcMockedOn();
    reloadAfterActionIfNeeded(options);

    cy.wait('@getPermissions');
  }
);

Cypress.Commands.add(
  'mockTenantsAction',
  function (fixtureFileName, funcMockedOn, options) {
    cy.intercept(`${SEC_API_TENANTS_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getTenants');

    funcMockedOn();
    reloadAfterActionIfNeeded(options);

    cy.wait('@getTenants');
  }
);

Cypress.Commands.add(
  'mockAuditLogsAction',
  function (fixtureFileName, funcMockedOn, options) {
    cy.intercept(`${SEC_API_AUDIT_PATH}*`, {
      fixture: fixtureFileName,
    }).as('getAuditInfo');

    funcMockedOn();
    reloadAfterActionIfNeeded(options);

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
