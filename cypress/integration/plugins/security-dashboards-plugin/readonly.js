/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/base_constants';
import { ADMIN_AUTH, CURRENT_TENANT } from '../../../utils/commands';

const TEST_CONFIG = {
  role: {
    name: 'test_readonly_role',
    json: {
      cluster_permissions: [],
      index_permissions: [
        {
          index_patterns: ['opensearch_dashboards_sample_data_logs'],
          allowed_actions: ['read'],
        },
      ],
      tenant_permissions: [
        {
          tenant_patterns: ['test_readonly_tenant'],
          allowed_actions: ['kibana_all_read'],
        },
      ],
    },
  },
  tenant: {
    name: 'test_readonly_tenant',
    description: 'Testing read-only tenant mode',
  },
  user: {
    username: 'test_readonly_user',
    password: 'testUserPassword123',
  },
};

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Base roles on first tenant visit', () => {
    const password = 'testUserPassword123!';
    let name;
    let baseRole;
    let originalMapping;

    beforeEach(() => {
      ADMIN_AUTH.newUser = Cypress.env('username');
      ADMIN_AUTH.newPassword = Cypress.env('password');
      originalMapping = undefined;
      name = `base_role_${Date.now()}`;
    });

    afterEach(() => {
      ADMIN_AUTH.newUser = Cypress.env('username');
      ADMIN_AUTH.newPassword = Cypress.env('password');
      CURRENT_TENANT.newTenant = 'private';
      if (originalMapping) {
        cy.createRoleMapping(baseRole, originalMapping);
      } else if (originalMapping === null) {
        cy.deleteRoleMapping(baseRole);
      }
      cy.deleteRoleMapping(name);
      cy.deleteRole(name);
      cy.deleteInternalUser(name);
      cy.request(
        'DELETE',
        `${Cypress.env(
          'openSearchUrl'
        )}/_plugins/_security/api/tenants/${name}_tenant`
      );
    });

    [false, true].forEach((readOnly) => {
      it(`opens a fresh tenant and enforces ${
        readOnly ? 'read-only' : 'write'
      } access`, () => {
        baseRole = readOnly
          ? 'base_dashboards_user_read_only'
          : 'base_dashboards_user';
        const tenant = `${name}_tenant`;
        const auth = { username: name, password };
        const headers = { 'osd-xsrf': true, securitytenant: tenant };
        const url = `${BASE_PATH}/api/saved_objects/index-pattern/${name}`;
        cy.createTenant(tenant, {
          description: 'First visit with a base Dashboards role',
        });
        cy.createInternalUser(name, { password });
        cy.createRole(name, {
          cluster_permissions: [],
          index_permissions: [],
          tenant_permissions: [
            {
              tenant_patterns: [tenant],
              allowed_actions: [
                readOnly ? 'kibana_all_read' : 'kibana_all_write',
              ],
            },
          ],
        });
        cy.createRoleMapping(name, { users: [name] });
        cy.request({
          url: `${Cypress.env(
            'openSearchUrl'
          )}/_plugins/_security/api/rolesmapping/${baseRole}`,
          failOnStatusCode: false,
        }).then(({ body, status }) => {
          expect(status).to.be.oneOf([200, 404]);
          const {
            users = [],
            backend_roles = [],
            hosts = [],
            and_backend_roles = [],
          } = body[baseRole] || {};
          originalMapping =
            status === 200
              ? { users, backend_roles, hosts, and_backend_roles }
              : null;
          cy.createRoleMapping(baseRole, {
            ...originalMapping,
            users: [...users, name],
          });
        });
        cy.request({
          url: `${Cypress.env('openSearchUrl')}/_plugins/_security/authinfo`,
          auth,
        })
          .its('body.roles')
          .should('have.members', [baseRole, name]);

        // No admin has opened or seeded this tenant: exercise first-visit initialization.
        cy.then(() => {
          ADMIN_AUTH.newUser = name;
          ADMIN_AUTH.newPassword = password;
          CURRENT_TENANT.newTenant = tenant;
        });
        cy.intercept('GET', '**/api/saved_objects/_find*').as(
          'firstTenantRead'
        );
        cy.visit(`${BASE_PATH}/app/dashboards`, {
          onBeforeLoad(window) {
            window.sessionStorage.setItem(
              'opendistro::security::tenant::show_popup',
              false
            );
            window.localStorage.setItem('home:newThemeModal:show', false);
          },
        });
        cy.wait('@firstTenantRead')
          .its('response.statusCode')
          .should('eq', 200);
        cy.get('#user-icon-btn').should('be.visible');
        if (readOnly) {
          cy.location('pathname').should(
            'eq',
            new URL(`${BASE_PATH}/app/home`).pathname
          );
        }
        cy.request({ url: `${BASE_PATH}/api/v1/auth/authinfo`, auth, headers })
          .its('body.user_requested_tenant')
          .should('eq', tenant);

        cy.request({
          method: 'POST',
          url,
          auth,
          headers,
          failOnStatusCode: false,
          body: { attributes: { title: 'base-role-original-*' } },
        })
          .its('status')
          .should('eq', readOnly ? 403 : 200);
        if (readOnly) {
          // Seed only after the restricted user's first visit and rejected create.
          cy.request({
            method: 'POST',
            url,
            headers,
            auth: {
              username: Cypress.env('username'),
              password: Cypress.env('password'),
            },
            body: { attributes: { title: 'base-role-original-*' } },
          })
            .its('status')
            .should('eq', 200);
        }
        cy.request({
          method: 'PUT',
          url,
          auth,
          headers,
          failOnStatusCode: false,
          body: { attributes: { title: 'base-role-updated-*' } },
        })
          .its('status')
          .should('eq', readOnly ? 403 : 200);
        cy.request({ url, auth, headers })
          .its('body.attributes.title')
          .should(
            'eq',
            readOnly ? 'base-role-original-*' : 'base-role-updated-*'
          );
        cy.request({
          method: 'DELETE',
          url,
          headers,
          auth: {
            username: Cypress.env('username'),
            password: Cypress.env('password'),
          },
        });
        cy.contains('Application Not Found').should('not.exist');
      });
    });
  });

  describe('Read Only mode', () => {
    before(() => {
      cy.createTenant(TEST_CONFIG.tenant.name, {
        description: TEST_CONFIG.tenant.description,
      });

      cy.createInternalUser(TEST_CONFIG.user.username, {
        password: TEST_CONFIG.user.password,
      });

      cy.createRoleMapping('base_dashboards_user_read_only', {
        users: [TEST_CONFIG.user.username],
      });

      cy.createRole(TEST_CONFIG.role.name, TEST_CONFIG.role.json);

      cy.createRoleMapping(TEST_CONFIG.role.name, {
        users: [ADMIN_AUTH.username, TEST_CONFIG.user.username],
      });

      cy.request({
        url: `${Cypress.env('openSearchUrl')}/_plugins/_security/authinfo`,
        auth: TEST_CONFIG.user,
      })
        .its('body.roles')
        .should('have.members', [
          'base_dashboards_user_read_only',
          TEST_CONFIG.role.name,
        ]);

      /* Add sample data to testing tenant */
      CURRENT_TENANT.newTenant = TEST_CONFIG.tenant.name;
      // Select the session tenant before seeding; this suite tests permissions, not the switcher UI.
      cy.login();
      cy.request({
        method: 'POST',
        url: `${BASE_PATH}/api/v1/multitenancy/tenant`,
        headers: { 'osd-xsrf': true },
        body: {
          username: ADMIN_AUTH.username,
          tenant: TEST_CONFIG.tenant.name,
        },
      })
        .its('status')
        .should('eq', 200);
      cy.request(`${BASE_PATH}/api/v1/multitenancy/tenant`)
        .its('body')
        .should('eq', TEST_CONFIG.tenant.name);
      cy.request(`${BASE_PATH}/api/v1/auth/authinfo`)
        .its('body.user_requested_tenant')
        .should('eq', TEST_CONFIG.tenant.name);
      cy.loadSampleData('logs');
      cy.visit(`${BASE_PATH}/app/home`, {
        onBeforeLoad(window) {
          window.sessionStorage.setItem(
            'opendistro::security::tenant::show_popup',
            false
          );
          window.localStorage.setItem(
            'opendistro::security::tenant::saved',
            `"${TEST_CONFIG.tenant.name}"`
          );
          window.localStorage.setItem('home:newThemeModal:show', false);
          window.localStorage.setItem('home:welcome:show', false);
          window.localStorage.setItem(
            'home:enhancedDiscover:dismissed',
            'true'
          );
        },
      });
      cy.waitForLoader();
    });

    it('should be able to modify the dashboard as admin', () => {
      cy.visit(BASE_PATH);
      cy.waitForLoader();

      cy.visitDashboard('[Logs] Web Traffic');

      cy.getElementByTestId('dashboardClone').should('exist');
      cy.getElementByTestId('dashboardEditMode').should('exist');
    });

    it('should reject saved-object writes with the read-only base role', () => {
      cy.request({
        method: 'POST',
        url: `${
          Cypress.config().baseUrl
        }/api/saved_objects/index-pattern/base-role-denied`,
        auth: TEST_CONFIG.user,
        headers: {
          'osd-xsrf': true,
          securitytenant: TEST_CONFIG.tenant.name,
        },
        body: {
          attributes: { title: 'opensearch_dashboards_sample_data_logs' },
        },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 403);
    });

    it('should not be able to modify the dashboard when is performing as a custom readonly tenant', () => {
      ADMIN_AUTH.newUser = TEST_CONFIG.user.username;
      ADMIN_AUTH.newPassword = TEST_CONFIG.user.password;

      cy.intercept('POST', '/api/saved_objects/_bulk_get').as(
        'readSavedObjects'
      );
      cy.visit(BASE_PATH);
      cy.wait('@readSavedObjects').its('response.statusCode').should('eq', 200);
      cy.waitForLoader();

      cy.visitDashboard('[Logs] Web Traffic');

      cy.getElementByTestId('dashboardClone').should('not.exist');
      cy.getElementByTestId('dashboardEditMode').should('not.exist');
    });
  });
}
