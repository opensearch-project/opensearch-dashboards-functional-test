/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/base_constants';
import { ADMIN_AUTH, CURRENT_TENANT } from '../../../utils/commands';
import { switchTenantTo } from './switch_tenant';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Tenant switching and isolation with the base Dashboards role', () => {
    const baseRole = 'base_dashboards_user';
    const name = `tenant_switch_${Date.now()}`;
    const tenants = [`${name}_a`, `${name}_b`, `${name}_denied`];
    const password = 'testUserPassword123!';
    const objectUrl = `${BASE_PATH}/api/saved_objects/index-pattern`;
    const securityUrl = `${Cypress.env(
      'openSearchUrl'
    )}/_plugins/_security/api`;
    let originalMapping;
    let previousAuth;
    let previousTenant;

    before(() => {
      previousAuth = {
        username: ADMIN_AUTH.username,
        password: ADMIN_AUTH.password,
      };
      previousTenant = CURRENT_TENANT.defaultTenant;
      ADMIN_AUTH.newUser = Cypress.env('username');
      ADMIN_AUTH.newPassword = Cypress.env('password');
      cy.clearCookies();
      cy.login();
      tenants.forEach((tenant) => {
        cy.createTenant(tenant, { description: 'Base-role tenant isolation' });
        // A shared ID exposes incorrect tenant routing; a unique ID detects cross-tenant reads.
        [name, tenant].forEach((id) => {
          cy.request({
            method: 'POST',
            url: `${objectUrl}/${id}`,
            headers: { 'osd-xsrf': true, securitytenant: tenant },
            body: { attributes: { title: `${tenant}-*` } },
          })
            .its('status')
            .should('eq', 200);
        });
      });
      cy.createInternalUser(name, { password });
      cy.createRole(name, {
        cluster_permissions: [],
        index_permissions: [],
        tenant_permissions: [
          {
            tenant_patterns: tenants.slice(0, 2),
            allowed_actions: ['kibana_all_write'],
          },
        ],
      });
      cy.createRoleMapping(name, { users: [name] });
      cy.request({
        url: `${securityUrl}/rolesmapping/${baseRole}`,
        failOnStatusCode: false,
      }).then(({ status, body }) => {
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
    });

    beforeEach(() => {
      ADMIN_AUTH.newUser = name;
      ADMIN_AUTH.newPassword = password;
      cy.clearCookies();
      cy.login();
      cy.request(`${Cypress.env('openSearchUrl')}/_plugins/_security/authinfo`)
        .its('body.roles')
        .should('have.members', [baseRole, name]);
    });

    const visitTenant = (tenant) => {
      CURRENT_TENANT.newTenant = tenant;
      cy.visit(`${BASE_PATH}/app/home`, {
        onBeforeLoad(window) {
          window.sessionStorage.setItem(
            'opendistro::security::tenant::show_popup',
            false
          );
          window.localStorage.setItem('home:welcome:show', false);
          window.localStorage.setItem('home:newThemeModal:show', false);
          window.localStorage.setItem(
            'home:enhancedDiscover:dismissed',
            'true'
          );
        },
      });
      cy.waitForLoader();
      cy.request(`${BASE_PATH}/api/v1/auth/authinfo`)
        .its('body.user_requested_tenant')
        .should('eq', tenant);
    };

    after(() => {
      ADMIN_AUTH.newUser = Cypress.env('username');
      ADMIN_AUTH.newPassword = Cypress.env('password');
      CURRENT_TENANT.newTenant = 'private';
      cy.clearCookies();
      cy.login();
      tenants.forEach((tenant) => {
        [name, tenant].forEach((id) => {
          cy.request({
            method: 'DELETE',
            url: `${objectUrl}/${id}`,
            headers: { 'osd-xsrf': true, securitytenant: tenant },
            failOnStatusCode: false,
          })
            .its('status')
            .should('be.oneOf', [200, 404]);
        });
        cy.request({
          method: 'DELETE',
          url: `${securityUrl}/tenants/${tenant}`,
          failOnStatusCode: false,
        })
          .its('status')
          .should('be.oneOf', [200, 404]);
      });
      if (originalMapping) {
        cy.createRoleMapping(baseRole, originalMapping);
      } else if (originalMapping === null) {
        cy.deleteRoleMapping(baseRole);
      }
      ['rolesmapping', 'roles', 'internalusers'].forEach((resource) => {
        cy.request({
          method: 'DELETE',
          url: `${securityUrl}/${resource}/${name}`,
          failOnStatusCode: false,
        })
          .its('status')
          .should('be.oneOf', [200, 404]);
      });
      cy.clearCookies();
      cy.then(() => {
        ADMIN_AUTH.newUser = previousAuth.username;
        ADMIN_AUTH.newPassword = previousAuth.password;
        CURRENT_TENANT.newTenant = previousTenant;
      });
    });

    // Cypress can replay a stale cookie on repeated same-path navigations.
    // Exercise both directions with a fresh session instead of an A -> B -> A loop.
    [0, 1].forEach((initial) => {
      const initialTenant = tenants[initial];
      const tenant = tenants[1 - initial];
      it(`switches from tenant ${initial + 1} to tenant ${
        2 - initial
      } despite the copied URL and keeps objects isolated`, () => {
        visitTenant(initialTenant);
        cy.location('search').should(
          'contain',
          `security_tenant=${initialTenant}`
        );
        cy.request(`${objectUrl}/${name}`)
          .its('body.attributes.title')
          .should('eq', `${initialTenant}-*`);
        switchTenantTo(tenant);
        cy.request(`${BASE_PATH}/api/v1/auth/authinfo`)
          .its('body.user_requested_tenant')
          .should('eq', tenant);
        // No tenant override: these reads must follow the session selected through the UI.
        cy.request(`${objectUrl}/${name}`)
          .its('body.attributes.title')
          .should('eq', `${tenant}-*`);
        cy.request({
          url: `${objectUrl}/${initialTenant}`,
          failOnStatusCode: false,
        })
          .its('status')
          .should('eq', 404);
      });
    });

    it('does not offer an unauthorized tenant in the switcher', () => {
      visitTenant(tenants[0]);
      cy.getElementByTestId('account-popover').click();
      cy.getElementByTestId('switch-tenants').click();
      cy.getElementByTestId('tenant-switch-modal')
        .find('[data-test-subj="comboBoxInput"]')
        .click();
      cy.getElementByTestId('comboBoxOptionsList ').within(() => {
        // The currently selected tenant may be omitted from the options list.
        cy.get(`[title="${tenants[1]}"]`).should('be.visible');
        cy.get(`[title="${tenants[2]}"]`).should('not.exist');
      });
      cy.getElementByTestId('tenant-switch-modal')
        .contains('button', 'Cancel')
        .click();
    });

    it('cannot read unauthorized tenant objects using a URL or request header', () => {
      visitTenant(tenants[0]);
      [
        { qs: { security_tenant: tenants[2] } },
        { headers: { securitytenant: tenants[2] } },
      ].forEach((selection) => {
        cy.request({
          url: `${objectUrl}/${tenants[2]}`,
          ...selection,
          failOnStatusCode: false,
        })
          // An invalid selection may be rejected or resolve to another tenant where this ID does not exist.
          .its('status')
          .should('be.oneOf', [403, 404]);
      });
    });
  });
}
