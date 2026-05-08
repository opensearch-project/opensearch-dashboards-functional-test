/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SAVED_OBJECTS_PATH,
  TENANTS_MANAGE_PATH,
} from '../../../utils/dashboards/constants';

import { CURRENT_TENANT } from '../../../utils/commands';

import indexPatternPrivateTenantHeaderSetUp from '../../../fixtures/plugins/security-dashboards-plugin/indexpatterns/indexPatternPrivateTenantHeader';
import indexPatternGlobalTenantHeaderSetUp from '../../../fixtures/plugins/security-dashboards-plugin/indexpatterns/indexPatternGlobalTenantHeader';
import tenantDescription from '../../../fixtures/plugins/security-dashboards-plugin/tenants/testTenant.json';

const tenantName = 'test';

const setTenancyConfig = (config) => {
  cy.request({
    method: 'PUT',
    url: `${Cypress.env(
      'openSearchUrl'
    )}/_plugins/_security/api/tenancy/config`,
    body: config,
  });
};

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Multi Tenancy Tests: ', () => {
    before(() => {
      cy.deleteIndexPattern('index-pattern1', { failOnStatusCode: false });
      cy.deleteIndexPattern('index-pattern2', { failOnStatusCode: false });

      cy.createTenant(tenantName, tenantDescription);
      cy.createIndexPattern(
        'index-pattern1',
        {
          title: 's*',
          timeFieldName: 'timestamp',
        },
        indexPatternGlobalTenantHeaderSetUp
      );

      cy.createIndexPattern(
        'index-pattern2',
        {
          title: 'se*',
          timeFieldName: 'timestamp',
        },
        indexPatternPrivateTenantHeaderSetUp
      );
    });
    after(() => {
      cy.deleteIndexPattern('index-pattern1', { failOnStatusCode: false });
      cy.deleteIndexPattern('index-pattern2', { failOnStatusCode: false });
    });
    it('Test 1 Disable Multi Tenancy ', () => {
      CURRENT_TENANT.newTenant = 'private';

      // Load into Private Tenant initially and check if index Pattern matches to the one saved in Private tenant.
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();

      cy.contains('se*');

      // Switch tenants button should exist when multi-tenancy is enabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').should('exist');

      // Disable multi-tenancy via API.
      setTenancyConfig({
        multitenancy_enabled: false,
        private_tenant_enabled: true,
        default_tenant: 'Private',
      });

      cy.visit(TENANTS_MANAGE_PATH);
      cy.waitForLoader();

      // Switch tenants button should not exist when multi-tenancy is disabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').should('not.exist');

      //Tenancy disabled warning should show on manage page.
      cy.contains('Tenancy is disabled').should('exist');

      // Saved index pattern should only have the ones saved in Global tenant.
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();

      cy.contains('s*');

      // Enable Multi-tenancy before closing test.
      setTenancyConfig({
        multitenancy_enabled: true,
        private_tenant_enabled: true,
        default_tenant: 'Private',
      });

      cy.reload();
      cy.waitForLoader();
    });
    it('Test 2 Disable Private Tenancy ', () => {
      CURRENT_TENANT.newTenant = 'private';

      // Load into Private Tenant initially and check if index Pattern matches to the one saved in Private tenant.
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();

      cy.contains('se*');

      // Check if switching to private tenant is enabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').click();
      cy.get('#private').should('be.enabled');
      cy.contains('button', 'Cancel').click();

      // Disable private tenant via API.
      setTenancyConfig({
        multitenancy_enabled: true,
        private_tenant_enabled: false,
        default_tenant: 'Global',
      });

      cy.visit(TENANTS_MANAGE_PATH);
      cy.waitForLoader();

      // Check if switching to private tenant is disabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').click();
      cy.get('#private').should('be.disabled');
      cy.contains('button', 'Cancel').click();

      // Saved index pattern should only have the ones saved in Global tenant.
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();

      cy.contains('s*');

      // Enable private tenant before exiting test.
      setTenancyConfig({
        multitenancy_enabled: true,
        private_tenant_enabled: true,
        default_tenant: 'Private',
      });

      cy.reload();
      cy.waitForLoader();
    });
  });
}
