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
import indexPatternPrivateTenantHeaderSetUp from '../../../fixtures/plugins/security-dashboards-plugin/indexpatterns/indexPatternPrivateTenantHeader';
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

      cy.createInternalUser(userName1, testUsersSetUp);
      cy.createInternalUser(userName2, testUsersSetUp);

      cy.createRole(roleName1, roleWithTestSetUp);
      cy.createRole(roleName2, roleWithoutTestSetUp);

      cy.createRoleMapping(kibanaRoleName, kibanaRoleMappingSetUp);
      cy.createRoleMapping(roleName1, roleWithTestMappingSetUp);
      cy.createRoleMapping(roleName2, roleWithoutTestMappingSetUp);
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
