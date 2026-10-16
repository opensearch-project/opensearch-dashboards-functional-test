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
import roleWithTestMappingSetUp from '../../../fixtures/plugins/security-dashboards-plugin/rolesmapping/roleWithTestMapping';
import roleWithoutTestMappingSetUp from '../../../fixtures/plugins/security-dashboards-plugin/rolesmapping/roleWithoutTestMapping';
import indexPatternPrivateTenantHeaderSetUp from '../../../fixtures/plugins/security-dashboards-plugin/indexpatterns/indexPatternPrivateTenantHeader';
import indexPatternTenantHeaderSetUp from '../../../fixtures/plugins/security-dashboards-plugin/indexpatterns/indexPatternTenantHeader';

const tenantName = 'test';
const userName1 = 'test1';
const userName2 = 'test2';
const password = 'testUserPassword123';
const roleName1 = 'roleWithTest';
const roleName2 = 'roleWithoutTest';
const baseRoleName = 'base_dashboards_user';

if (Cypress.env('SECURITY_ENABLED') && Cypress.env('AGGREGATION_VIEW')) {
  describe('Saved objects table test', () => {
    const deleteIndexPatternFromTenant = (id, tenantHeader) =>
      cy.deleteIndexPattern(id, {
        failOnStatusCode: false,
        headers: {
          'osd-xsrf': true,
          ...tenantHeader,
        },
      });

    const deleteIndexPatternFromTestTenants = (id) => {
      cy.deleteIndexPattern(id, { failOnStatusCode: false });
      deleteIndexPatternFromTenant(id, indexPatternPrivateTenantHeaderSetUp);
      deleteIndexPatternFromTenant(id, indexPatternTenantHeaderSetUp);
    };

    const visitSavedObjects = () => {
      cy.intercept(
        'GET',
        '/api/opensearch-dashboards/management/saved_objects/_find*'
      ).as('findSavedObjects');
      cy.visit(SAVED_OBJECTS_PATH);
      cy.wait('@findSavedObjects');
      cy.contains('a', 'Saved objects');
    };

    const savedObjectRow = (title) => cy.contains('tbody tr', title);

    const clearSavedObjectsSearch = () => {
      cy.intercept(
        'POST',
        '/api/opensearch-dashboards/management/saved_objects/scroll/counts'
      ).as('getSavedObjectCounts');
      cy.intercept(
        'GET',
        '/api/opensearch-dashboards/management/saved_objects/_find*'
      ).as('findSavedObjects');

      cy.get('input[type="search"]').clear();

      cy.wait('@getSavedObjectCounts');
      cy.wait('@findSavedObjects');
    };

    const selectTenantFilter = (tenant) => {
      cy.intercept(
        'POST',
        '/api/opensearch-dashboards/management/saved_objects/scroll/counts'
      ).as('getSavedObjectCounts');
      cy.intercept(
        'GET',
        '/api/opensearch-dashboards/management/saved_objects/_find*'
      ).as('findSavedObjects');

      cy.contains('button.euiFilterButton', 'Tenant')
        .should('be.enabled')
        .click({ force: true });
      cy.get('.euiPopover__panel')
        .should('be.visible')
        .within(() => {
          cy.contains(
            '[role="option"], button, .euiSelectableListItem, .euiFilterSelectItem',
            tenant
          )
            .should('be.visible')
            .click();
        });

      cy.wait('@getSavedObjectCounts');
      cy.wait('@findSavedObjects');
    };

    before(() => {
      deleteIndexPatternFromTestTenants('index-pattern1');
      deleteIndexPatternFromTestTenants('index-pattern2');

      cy.createTenant(tenantName, tenantDescription);

      cy.createIndexPattern(
        'index-pattern1',
        {
          title: 's*',
          timeFieldName: 'timestamp',
        },
        indexPatternPrivateTenantHeaderSetUp
      );
      cy.createIndexPattern(
        'index-pattern2',
        {
          title: 'se*',
          timeFieldName: 'timestamp',
        },
        indexPatternTenantHeaderSetUp
      );

      for (const username of [userName1, userName2]) {
        cy.createInternalUser(username, {
          ...testUsersSetUp,
          opendistro_security_roles: [baseRoleName],
        });
      }

      cy.createRole(roleName1, roleWithTestSetUp);
      cy.createRole(roleName2, roleWithoutTestSetUp);

      cy.createRoleMapping(roleName1, roleWithTestMappingSetUp);
      cy.createRoleMapping(roleName2, roleWithoutTestMappingSetUp);

      // Extra roles could hide permissions missing from the new base role.
      for (const [username, role] of [
        [userName1, roleName1],
        [userName2, roleName2],
      ]) {
        cy.request({
          url: `${Cypress.env('openSearchUrl')}/_plugins/_security/authinfo`,
          auth: { username, password },
        })
          .its('body.roles')
          .should('have.members', [baseRoleName, role]);
      }
    });

    it('should check the saved objects as global tenant', () => {
      CURRENT_TENANT.newTenant = 'global';
      visitSavedObjects();
      savedObjectRow('s*').should('contain', 'Private');
      savedObjectRow('se*').should('contain', 'test');
    });

    it('should check the saved objects by applying filter', () => {
      CURRENT_TENANT.newTenant = 'global';
      visitSavedObjects();

      selectTenantFilter('Private');
      savedObjectRow('se*').should('not.exist');
      savedObjectRow('s*').should('contain', 'Private');

      clearSavedObjectsSearch();
      selectTenantFilter('test');
      savedObjectRow('s*').should('contain', 'Private');
      savedObjectRow('se*').should('contain', 'test');
    });

    it('should login as test1 and check saved object', () => {
      CURRENT_TENANT.newTenant = 'private';
      ADMIN_AUTH.newUser = userName1;
      ADMIN_AUTH.newPassword = password;

      visitSavedObjects();
      cy.url().should((url) => {
        expect(url).to.contain('/management');
      });

      savedObjectRow('se*').should('contain', 'test');
      savedObjectRow('s*').should('not.exist');
    });

    it('should create and delete a saved object with the write base role', () => {
      const url = `${
        Cypress.config().baseUrl
      }/api/saved_objects/index-pattern/base-role-write`;
      const auth = { username: userName1, password };
      const headers = { 'osd-xsrf': true, securitytenant: tenantName };
      cy.request({
        method: 'POST',
        url,
        auth,
        headers,
        body: { attributes: { title: 'base-role-test-*' } },
      })
        .its('status')
        .should('eq', 200);
      cy.request({ method: 'DELETE', url, auth, headers })
        .its('status')
        .should('eq', 200);
    });

    it('should login as test2 and check saved object', () => {
      CURRENT_TENANT.newTenant = 'private';
      ADMIN_AUTH.newUser = userName2;
      ADMIN_AUTH.newPassword = password;

      visitSavedObjects();
      cy.url().should((url) => {
        expect(url).to.contain('/management');
      });

      savedObjectRow('se*').should('not.exist');
      savedObjectRow('s*').should('not.exist');
    });

    after(() => {
      ADMIN_AUTH.newUser = Cypress.env('username');
      ADMIN_AUTH.newPassword = Cypress.env('password');
      CURRENT_TENANT.newTenant = 'private';
      deleteIndexPatternFromTestTenants('index-pattern1');
      deleteIndexPatternFromTestTenants('index-pattern2');
    });
  });
}
