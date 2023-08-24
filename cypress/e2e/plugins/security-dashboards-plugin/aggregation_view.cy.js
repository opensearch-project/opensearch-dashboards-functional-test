/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SAVED_OBJECTS_PATH } from '../../../utils/dashboards/constants';

import { ADMIN_AUTH, CURRENT_TENANT } from '../../../utils/commands';

import tenantDescription from '../../../fixtures/plugins/security-dashboards-plugin/tenants/testTenant';
import testUsersSetUp from '../../../fixtures/plugins/security-dashboards-plugin/users/testUser';
import roleWithTestSetUp from '../../../fixtures/plugins/security-dashboards-plugin/roles/roleWithTest';
import roleWithoutTestSetUp from '../../../fixtures/plugins/security-dashboards-plugin/roles/roleWithoutTest';
import kibanaRoleMappingSetUp from '../../../fixtures/plugins/security-dashboards-plugin/rolesmapping/kibanauserRoleMapping';
import roleWithTestMappingSetUp from '../../../fixtures/plugins/security-dashboards-plugin/rolesmapping/roleWithTestMapping';
import roleWithoutTestMappingSetUp from '../../../fixtures/plugins/security-dashboards-plugin/rolesmapping/roleWithoutTestMapping';
import indexPatternTenantHeaderSetUp from '../../../fixtures/plugins/security-dashboards-plugin/indexpatterns/indexPatternTenantHeader';

const tenantName = 'test';
const userName1 = 'test1';
const userName2 = 'test2';
const password = 'testUserPassword123';
const roleName1 = 'roleWithTest';
const roleName2 = 'roleWithoutTest';
const kibanaRoleName = 'kibana_user';

if (Cypress.env('SECURITY_ENABLED') && Cypress.env('AGGREGATION_VIEW')) {
  describe('Saved objects table test', () => {
    // start a server so that server responses can be mocked via fixtures
    // in all of the below test cases
    before(() => {
      cy.createTenant(tenantName, tenantDescription);

      cy.createIndexPattern('index-pattern1', {
        title: 's*',
        timeFieldName: 'timestamp',
      });
      cy.createIndexPattern(
        'index-pattern2',
        {
          title: 'se*',
          timeFieldName: 'timestamp',
        },
        indexPatternTenantHeaderSetUp
      );

      cy.createInternalUser(userName1, testUsersSetUp);
      cy.createInternalUser(userName2, testUsersSetUp);

      cy.createRole(roleName1, roleWithTestSetUp);
      cy.createRole(roleName2, roleWithoutTestSetUp);

      cy.createRoleMapping(kibanaRoleName, kibanaRoleMappingSetUp);
      cy.createRoleMapping(roleName1, roleWithTestMappingSetUp);
      cy.createRoleMapping(roleName2, roleWithoutTestMappingSetUp);

      cy.wait(300000);
    });

    it('should check the saved objects as global tenant', () => {
      CURRENT_TENANT.newTenant = 'global';
      cy.visit(SAVED_OBJECTS_PATH);
      cy.contains('a', 'Saved objects');
      cy.contains('a', 's*');
      cy.contains('a', 'se*');
    });

    it('should check the saved objects by applying filter', () => {
      CURRENT_TENANT.newTenant = 'global';
      cy.visit(SAVED_OBJECTS_PATH);
      cy.contains('a', 'Saved objects');

      cy.get('span[title="Tenant"]').first().click({ force: true });
      cy.get('span').contains('Private').click();
      cy.contains('a', 's*');
      cy.contains('a', 'se*').should('not.exist');

      cy.wait(3000);

      cy.get('span').contains('test').click();
      cy.contains('a', 's*');
      cy.contains('a', 'se*');
    });

    it('should login as test1 and check saved object', () => {
      CURRENT_TENANT.newTenant = 'private';
      ADMIN_AUTH.newUser = userName1;
      ADMIN_AUTH.newPassword = password;

      cy.visit(SAVED_OBJECTS_PATH);
      cy.url().should((url) => {
        expect(url).to.contain('/management');
      });

      cy.wait(5000);
      cy.contains('a', 'se*');
      cy.contains('a', 's*').should('not.exist');
    });

    it('should login as test2 and check saved object', () => {
      CURRENT_TENANT.newTenant = 'private';
      ADMIN_AUTH.newUser = userName2;
      ADMIN_AUTH.newPassword = password;

      cy.visit(SAVED_OBJECTS_PATH);
      cy.url().should((url) => {
        expect(url).to.contain('/management');
      });

      cy.wait(5000);
      cy.contains('a', 'se*').should('not.exist');
      cy.contains('a', 's*').should('not.exist');
    });

    after(() => {
      ADMIN_AUTH.newUser = Cypress.env('username');
      ADMIN_AUTH.newPassword = Cypress.env('password');
      CURRENT_TENANT.newTenant = 'private';
    });
  });
}
