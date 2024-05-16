/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import roleWithoutTestJson from '../../../fixtures/plugins/security-dashboards-plugin/roles/roleWithoutTest';
import { BASE_PATH } from '../../../utils/base_constants';
import { ADMIN_AUTH, CURRENT_TENANT } from '../../../utils/commands';
import { switchTenantTo } from './switch_tenant';

const TEST_CONFIG = {
  role: {
    name: 'test_readonly_role',
    json: Object.assign({}, roleWithoutTestJson, {
      tenant_permissions: [
        {
          tenant_patterns: ['test_readonly_tenant'],
          allowed_actions: ['kibana_all_read'],
        },
      ],
    }),
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
      cy.server();

      cy.createTenant(TEST_CONFIG.tenant.name, {
        description: TEST_CONFIG.tenant.description,
      });

      cy.createInternalUser(TEST_CONFIG.user.username, {
        password: TEST_CONFIG.user.password,
      });

      cy.createRole(TEST_CONFIG.role.name, TEST_CONFIG.role.json);

      cy.createRoleMapping(TEST_CONFIG.role.name, {
        users: [ADMIN_AUTH.username, TEST_CONFIG.user.username],
      });

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
