/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_PATH,
  SAVED_OBJECTS_PATH,
  SEC_UI_TENANTS_PATH,
  SEC_UI_USER_CREATE_PATH,
  SEC_UI_ROLES_CREATE_PATH,
  SEC_UI_ROLE_EDIT_PATH,
} from '../../../utils/constants';

import { 
  ADMIN_AUTH,
  CURRENT_TENANT,
 } from '../../../utils/commands';

const tenantName = 'test';
const tenantDescription = 'Test description';
const testIndexPattern1 = 's';
const testIndexPattern2 = 'se';
const userName1 = 'test1';
const userName2 = 'test2';
const password = 'password';
const roleName1 = 'roleWithTest';
const roleName2 = 'roleWithoutTest';
const clusterPermission = 'cluster_all';
const indexName = '*';
const indexPermission = 'indices_all';

if (Cypress.env('SECURITY_ENABLED') && Cypress.env('AGGREGATION_VIEW')) {
  describe('Saved objects table test', () => {
    // start a server so that server responses can be mocked via fixtures
    // in all of the below test cases
    before(() => {
      cy.server();
    });

    it('should create new tenant successfully by selecting `Create tenant`', () => {
      cy.visit(SEC_UI_TENANTS_PATH);
  
      cy.get('button[id="createTenant"]').first().click({ force: true });
  
      cy.contains('button', 'Create');
      cy.contains('button', 'Cancel');
      cy.contains('.euiModalHeader__title', 'Create tenant');
  
      cy.get('input[data-test-subj="name-text"]').type(tenantName, {
        force: true,
      });
      cy.get('input[data-test-subj="name-text"]').should(
        'have.value',
        tenantName
      );
  
      cy.get('textarea[data-test-subj="tenant-description"]').type(
        tenantDescription,
        { force: true }
      );
      cy.get('textarea[data-test-subj="tenant-description"]').should(
        'have.value',
        tenantDescription
      );
  
      cy.get('button[id="submit"]').first().click({ force: true });
  
      cy.url().should((url) => {
        expect(url).to.contain('/tenants');
      });
  
      cy.contains('h3', 'Tenants');
      // should contain the new tenant that was just created
      cy.contains('.euiTableCellContent', tenantName);
      cy.contains('span', tenantDescription);
    });

    it('should create new user called test1 successfully', () => {
      cy.visit(SEC_UI_USER_CREATE_PATH);

      cy.url().should((url) => {
        expect(url).to.contain('/users/create');
      });

      cy.contains('span', 'Create');

      cy.get('input[data-test-subj="name-text"]').type(userName1, {
        force: true,
      });
      cy.get('input[data-test-subj="name-text"]').should(
        'have.value',
        userName1
      );

      cy.get('input[data-test-subj="password"]').type(password, {
        force: true,
      });
      cy.get('input[data-test-subj="re-enter-password"]').type(password, {
        force: true,
      });

      cy.contains('button', 'Create').first().click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/users');
      });

      cy.contains('h3', 'Internal users');
      // should contain the new user that was just created
      cy.contains('a', userName1);
    });

    it('should create new user called test2 successfully', () => {
      cy.visit(SEC_UI_USER_CREATE_PATH);
  
      cy.url().should((url) => {
        expect(url).to.contain('/users/create');
      });
  
      cy.contains('span', 'Create');
  
      cy.get('input[data-test-subj="name-text"]').type(userName2, {
        force: true,
      });
      cy.get('input[data-test-subj="name-text"]').should(
        'have.value',
        userName2
      );
  
      cy.get('input[data-test-subj="password"]').type(password, {
        force: true,
      });
      cy.get('input[data-test-subj="re-enter-password"]').type(password, {
        force: true,
      });
  
      cy.contains('button', 'Create').first().click({ force: true });
  
      cy.url().should((url) => {
        expect(url).to.contain('/users');
      });
  
      cy.contains('h3', 'Internal users');
      // should contain the new user that was just created
      cy.contains('a', userName2);
    });

    it('should create new role with test tenant permission successfully', () => {
      cy.visit(SEC_UI_ROLES_CREATE_PATH);
  
      cy.contains('span', 'Create');
  
      cy.get('input[data-test-subj="name-text"]').type(roleName1, {
        force: true,
      });
  
      cy.get('input[data-test-subj="name-text"]').should(
        'have.value',
        roleName1
      );  
      cy.get('input[id="cluster-permission-box"]').type(clusterPermission);
      cy.get('button[title="cluster_all"]').click();  
      cy.get('input[id="index-input-box"]').type(indexName);  
      cy.get('input[id="index-permission-box"]').type(indexPermission);
      cy.get('button[title="indices_all"]').click();
      
      cy.get('input[id="tenant-permission-box"]').type(tenantName);
      cy.get('button[title="test"]').click();
  
      cy.contains('button', 'Create').first().click({ force: true });
  
      cy.url().should((url) => {
        expect(url).to.contain('/roles/view/');
      });
  
      cy.contains('h1', roleName1);
    });

    it('should create new role without test tenant permission successfully', () => {
      cy.visit(SEC_UI_ROLES_CREATE_PATH);
  
      cy.contains('span', 'Create');
  
      cy.get('input[data-test-subj="name-text"]').type(roleName2, {
        force: true,
      });
  
      cy.get('input[data-test-subj="name-text"]').should(
        'have.value',
        roleName2
      );  
      cy.get('input[id="cluster-permission-box"]').type(clusterPermission);
      cy.get('button[title="cluster_all"]').click();  
      cy.get('input[id="index-input-box"]').type(indexName);  
      cy.get('input[id="index-permission-box"]').type(indexPermission);
      cy.get('button[title="indices_all"]').click();
  
      cy.contains('button', 'Create').first().click({ force: true });
  
      cy.url().should((url) => {
        expect(url).to.contain('/roles/view/');
      });
  
      cy.contains('h1', roleName2);
    });

    it('should map the user "test1" to role "roleWithTest"', () => {
      cy.visit(SEC_UI_ROLE_EDIT_PATH + '/' + roleName1 + '/mapuser');

      cy.get('input[data-test-subj="comboBoxSearchInput"]').type(userName1);
      cy.get('button[title="test1"]').click();
      cy.get('button[id="map"]').click();

      cy.url().should((url) => {
        expect(url).to.contain('/roles/view/');
      });

      cy.contains('h3', "Mapped users");
      cy.contains('span', userName1);
    })

    it('should map the user "test1" to role "kibana_user"', () => {
      cy.visit(SEC_UI_ROLE_EDIT_PATH + '/kibana_user/mapuser');

      cy.get('input[data-test-subj="comboBoxSearchInput"]').type(userName1);
      cy.get('button[title="test1"]').click();
      cy.get('button[id="map"]').click();

      cy.url().should((url) => {
        expect(url).to.contain('/roles/view/');
      });

      cy.contains('h3', "Mapped users");
      cy.contains('span', userName1);
    })

    it('should map the user "test2" to role "roleWithoutTest"', () => {
      cy.visit(SEC_UI_ROLE_EDIT_PATH + '/' + roleName2 + '/mapuser');
  
      cy.get('input[data-test-subj="comboBoxSearchInput"]').type(userName2);
      cy.get('button[title="test2"]').click();
      cy.get('button[id="map"]').click();
  
      cy.url().should((url) => {
        expect(url).to.contain('/roles/view/');
      });
  
      cy.contains('h3', "Mapped users");
      cy.contains('span', userName2);
    })

    it('should map the user "test2" to role "kibana_user"', () => {
      cy.visit(SEC_UI_ROLE_EDIT_PATH + '/kibana_user/mapuser');
  
      cy.get('input[data-test-subj="comboBoxSearchInput"]').type(userName2);
      cy.get('button[title="test2"]').click();
      cy.get('button[id="map"]').click();
  
      cy.url().should((url) => {
        expect(url).to.contain('/roles/view/');
      });
  
      cy.contains('h3', "Mapped users");
      cy.contains('span', userName2);
    })

    it('should create a index pattern s* as private tenant', () => {
      cy.visit(INDEX_PATTERN_PATH);

      cy.contains('span', 'Create index pattern').click();

      cy.get('input').type(testIndexPattern1);
      cy.get('input').should(
        'have.value',
        testIndexPattern1 + '*'
      );

      cy.wait(2000);
      cy.get('button[data-test-subj="createIndexPatternGoToStep2Button"]').click();

      cy.get('select[data-test-subj="createIndexPatternTimeFieldSelect"]')
        .select("@timestamp");

      cy.get('button[data-test-subj="createIndexPatternButton"]').click();

      cy.wait(2000);
    });

    it('shuold create a index pattern se* as test tenant', () => {
      CURRENT_TENANT.newTenant = tenantName;
      cy.visit(INDEX_PATTERN_PATH);  
      cy.contains('span', 'Create index pattern').click();  
      cy.get('input').type(testIndexPattern2);
      cy.get('input').should(
          'have.value',
          testIndexPattern2 + '*'
        );  
      cy.wait(2000);
      cy.get('button[data-test-subj="createIndexPatternGoToStep2Button"]').click();  
      cy.get('select[data-test-subj="createIndexPatternTimeFieldSelect"]')
        .select("@timestamp");  
      cy.get('button[data-test-subj="createIndexPatternButton"]').click();  

      cy.wait(2000);
    });

    it('should check the saved objects as global tenant', () => {
      CURRENT_TENANT.newTenant = 'global';
      cy.visit(SAVED_OBJECTS_PATH);
      cy.contains('a', 'Saved objects');
      cy.contains('a', 's*');
      cy.contains('a', 'se*');
    });

    it('should login as test1 and check saved object', () =>{
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

    it('should login as test2 and check saved object', () =>{
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
