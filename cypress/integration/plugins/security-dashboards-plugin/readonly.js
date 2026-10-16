/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/base_constants';
import { ADMIN_AUTH, CURRENT_TENANT } from '../../../utils/commands';
import { switchTenantTo } from './switch_tenant';

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
  describe('Read Only mode', () => {
    before(() => {
      cy.createTenant(TEST_CONFIG.tenant.name, {
        description: TEST_CONFIG.tenant.description,
      });

      cy.createInternalUser(TEST_CONFIG.user.username, {
        password: TEST_CONFIG.user.password,
        opendistro_security_roles: ['base_dashboards_user_read_only'],
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
      cy.visit(BASE_PATH, {
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
      switchTenantTo(TEST_CONFIG.tenant.name);
      cy.loadSampleData('logs');
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

      cy.visit(BASE_PATH);
      cy.waitForLoader();

      cy.visitDashboard('[Logs] Web Traffic');

      cy.getElementByTestId('dashboardClone').should('not.exist');
      cy.getElementByTestId('dashboardEditMode').should('not.exist');
    });
  });
}
