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

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Multi Tenancy Tests: ', () => {
    before(() => {
      cy.server();
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
    it('Test 1 Disable Multi Tenancy ', () => {
      CURRENT_TENANT.newTenant = 'private';

      // Load into Private Tenant initially and check if index Pattern matches to the one saved in Private tenant.
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();
      cy.contains('a', 'Saved objects');
      cy.contains('a', 'se*');

      // Switch tenants button should exist when multi-tenancy is enabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').should('exist');

      // Disable multi-tenancy.
      cy.visit(TENANTS_MANAGE_PATH);
      cy.waitForLoader();

      cy.contains('button', 'Configure').click();
      cy.waitForLoader();
      cy.get('#EnableMultitenancyCheckBox').uncheck({ force: true });
      cy.contains('button', 'Save Changes').click();

      cy.get('#tenancyChangeCheckbox').check({ force: true });
      cy.contains('button', 'Apply changes').click();

      cy.reload();
      cy.waitForLoader();

      // Switch tenants button should not exist when multi-tenancy is disabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').should('not.exist');

      //Tenancy disbaled warning should show on manage page.
      cy.contains('Tenancy is disabled').should('exist');

      // Saved index pattern should only have the ones saved in Global tenant.
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();
      cy.contains('a', 'Saved objects');
      cy.contains('a', 's*');

      // Enable Multi-tenancy before closing test.
      cy.visit(TENANTS_MANAGE_PATH);
      cy.waitForLoader();
      cy.contains('button', 'Configure').click();
      cy.waitForLoader();
      cy.get('#EnableMultitenancyCheckBox').check({ force: true });
      cy.contains('button', 'Save Changes').click();
      cy.get('#tenancyChangeCheckbox').check({ force: true });
      cy.contains('button', 'Apply changes').click();
      cy.reload();
      cy.waitForLoader();
    });
    it('Test 2 Disable Private Tenancy ', () => {
      CURRENT_TENANT.newTenant = 'private';

      // Load into Private Tenant initially and check if index Pattern matches to the one saved in Private tenant.
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();
      cy.contains('a', 'Saved objects');
      cy.contains('a', 'se*');

      // Check if switching to private tenant is enabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').click();
      cy.get('#private').should('be.enabled');
      cy.contains('button', 'Cancel').click();

      // Disable private tenant.
      cy.visit(TENANTS_MANAGE_PATH);
      cy.waitForLoader();

      cy.contains('button', 'Configure').click();
      cy.waitForLoader();
      cy.get('#EnablePrivateTenantCheckBox').uncheck({ force: true });
      cy.contains('button', 'Save Changes').click();

      cy.get('#privateTenancyChangeCheckbox').check({ force: true });
      cy.contains('button', 'Apply changes').click();

      cy.reload();
      cy.waitForLoader();

      // Check if switching to private tenant is enabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').click();
      cy.get('#private').should('be.disabled');
      cy.contains('button', 'Cancel').click();

      // Saved index pattern should only have the ones saved in Global tenant.
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();
      cy.contains('a', 'Saved objects');
      cy.contains('a', 's*');

      // Enable private tenant before exiting test.
      cy.visit(TENANTS_MANAGE_PATH);
      cy.waitForLoader();
      cy.contains('button', 'Configure').click();
      cy.waitForLoader();
      cy.get('#EnablePrivateTenantCheckBox').check({ force: true });
      cy.contains('button', 'Save Changes').click();
      cy.get('#privateTenancyChangeCheckbox').check({ force: true });
      cy.contains('button', 'Apply changes').click();
      cy.reload();
      cy.waitForLoader();
    });
  });
}
