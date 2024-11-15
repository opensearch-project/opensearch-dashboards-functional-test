/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../../utils/base_constants';
import { ADMIN_AUTH } from '../../../../utils/commands';
import workspaceTestUser from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestUser.json';
import workspaceTestRole from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRole.json';
import workspaceTestRoleMapping from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRoleMapping.json';
import { WORKSPACE_API_PREFIX } from '../../../../utils/dashboards/workspace-plugin/constants';

let noPermissionWorkspaceName = 'acl_no_permission_workspace';
let readOnlyWorkspaceName = 'acl_readonly_workspace';
let libraryWriteWorkspaceName = 'acl_library_write_workspace';
let ownerWorkspaceName = 'acl_owner_workspace';

let noPermissionWorkspaceId = '';
let readOnlyWorkspaceId = '';
let libraryWriteWorkspaceId = '';
let ownerWorkspaceId = '';
let datasourceId = '';

const getPolicy = (permission, userName) => ({
  [permission]: {
    users: [userName],
  },
});

const NONE_DASHBOARDS_ADMIN_USERNAME = 'workspace-acl-test';
const WORKSPACE_TEST_ROLE_NAME = 'workspace-acl-test-role';

const ACLPolicyMap = {
  [noPermissionWorkspaceName]: {},
  [readOnlyWorkspaceName]: {
    ...getPolicy('read', NONE_DASHBOARDS_ADMIN_USERNAME),
    ...getPolicy('library_read', NONE_DASHBOARDS_ADMIN_USERNAME),
  },
  [libraryWriteWorkspaceName]: {
    ...getPolicy('read', NONE_DASHBOARDS_ADMIN_USERNAME),
    ...getPolicy('library_write', NONE_DASHBOARDS_ADMIN_USERNAME),
  },
  [ownerWorkspaceName]: {
    ...getPolicy('write', NONE_DASHBOARDS_ADMIN_USERNAME),
    ...getPolicy('library_write', NONE_DASHBOARDS_ADMIN_USERNAME),
  },
};

const setupWorkspace = (workspaceName, datasourceId) => {
  return cy
    .createWorkspace({
      name: workspaceName,
      settings: {
        ...(datasourceId ? { dataSources: [datasourceId] } : {}),
        permissions: ACLPolicyMap[workspaceName],
      },
    })
    .then((value) => {
      // load sample data
      cy.loadSampleDataForWorkspace('ecommerce', value, datasourceId);
      cy.wrap(value);
    });
};

if (
  Cypress.env('WORKSPACE_ENABLED') &&
  Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
  Cypress.env('SECURITY_ENABLED')
) {
  describe('Workspace ACL', () => {
    const originalUser = ADMIN_AUTH.username;
    const originalPassword = ADMIN_AUTH.password;
    before(() => {
      cy.deleteWorkspaceByName(noPermissionWorkspaceName);
      cy.deleteWorkspaceByName(readOnlyWorkspaceName);
      cy.deleteWorkspaceByName(libraryWriteWorkspaceName);
      cy.deleteWorkspaceByName(ownerWorkspaceName);

      cy.createInternalUser(NONE_DASHBOARDS_ADMIN_USERNAME, workspaceTestUser);
      cy.createRole(WORKSPACE_TEST_ROLE_NAME, workspaceTestRole);
      cy.createRoleMapping(WORKSPACE_TEST_ROLE_NAME, workspaceTestRoleMapping);

      if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
        cy.createDataSourceNoAuth().then((result) => {
          datasourceId = result[0];
          expect(datasourceId).to.be.a('string').that.is.not.empty;
          setupWorkspace(noPermissionWorkspaceName, datasourceId).then(
            (value) => (noPermissionWorkspaceId = value)
          );
          setupWorkspace(readOnlyWorkspaceName, datasourceId).then(
            (value) => (readOnlyWorkspaceId = value)
          );
          setupWorkspace(libraryWriteWorkspaceName, datasourceId).then(
            (value) => (libraryWriteWorkspaceId = value)
          );
          setupWorkspace(ownerWorkspaceName, datasourceId).then(
            (value) => (ownerWorkspaceId = value)
          );
        });
      } else {
        setupWorkspace(noPermissionWorkspaceName, datasourceId).then(
          (value) => (noPermissionWorkspaceId = value)
        );
        setupWorkspace(readOnlyWorkspaceName, datasourceId).then(
          (value) => (readOnlyWorkspaceId = value)
        );
        setupWorkspace(libraryWriteWorkspaceName, datasourceId).then(
          (value) => (libraryWriteWorkspaceId = value)
        );
        setupWorkspace(ownerWorkspaceName, datasourceId).then(
          (value) => (ownerWorkspaceId = value)
        );
      }
    });

    after(() => {
      cy.deleteWorkspaceByName(noPermissionWorkspaceName);
      cy.deleteWorkspaceByName(readOnlyWorkspaceName);
      cy.deleteWorkspaceByName(libraryWriteWorkspaceName);
      cy.deleteWorkspaceByName(ownerWorkspaceName);
      readOnlyWorkspaceId = '';
      libraryWriteWorkspaceId = '';

      ADMIN_AUTH.newUser = originalUser;
      ADMIN_AUTH.newPassword = originalPassword;
      cy.deleteRoleMapping(WORKSPACE_TEST_ROLE_NAME);
      cy.deleteInternalUser(NONE_DASHBOARDS_ADMIN_USERNAME);
      cy.deleteRole(WORKSPACE_TEST_ROLE_NAME);
    });

    describe('Normal user', () => {
      beforeEach(() => {
        ADMIN_AUTH.newUser = NONE_DASHBOARDS_ADMIN_USERNAME;
        ADMIN_AUTH.newPassword = workspaceTestUser.password;
      });

      it('Normal user should not be able to create workspace', () => {
        cy.request({
          method: 'POST',
          url: `${BASE_PATH}${WORKSPACE_API_PREFIX}`,
          headers: {
            'osd-xsrf': true,
          },
          body: {
            attributes: {
              name: 'test_workspace',
              features: ['use-case-observability'],
              description: 'test_description',
            },
          },
          failOnStatusCode: false,
        }).then((resp) =>
          cy
            .wrap(resp.body.error)
            .should('equal', 'Invalid permission, please contact OSD admin')
        );
      });

      it('Normal users should only see the workspaces they have permission with', () => {
        cy.visit(`${BASE_PATH}/app/home`);
        cy.contains(readOnlyWorkspaceName);
        cy.contains(noPermissionWorkspaceName).should('not.exist');
      });

      it('Readonly users should not be allowed to update dashboards/visualizations within the workspace', () => {
        cy.visit(`${BASE_PATH}/w/${readOnlyWorkspaceId}/app/visualize`);
        cy.contains(/\[eCommerce\] Markdown/).click();
        cy.getElementByTestId('visualizeSaveButton').click();
        cy.getElementByTestId('confirmSaveSavedObjectButton').click();
        cy.contains('Forbidden');
      });

      it('Normal users should not be allowed to visit workspace he/she has no permission', () => {
        cy.visit(`${BASE_PATH}/w/${noPermissionWorkspaceId}/app/objects`);
        cy.contains('Invalid saved objects permission');
      });

      it('Normal users should only see the workspaces he has library_write permission in the target workspaces list of duplicate modal', () => {
        cy.visit(`${BASE_PATH}/w/${readOnlyWorkspaceId}/app/objects`);
        cy.getElementByTestId('savedObjectsTableRowTitle').should('exist');
        cy.getElementByTestId('duplicateObjects')
          .click()
          .getElementByTestId('savedObjectsDuplicateModal')
          .find('[data-test-subj="comboBoxInput"]')
          .click();

        cy.contains(libraryWriteWorkspaceName);
        cy.contains(ownerWorkspaceName);
        cy.contains(noPermissionWorkspaceName).should('not.exist');
      });

      it('Users should not be able to update default index pattern / default data source if he/she is not the workspace owner', () => {
        cy.visit(`${BASE_PATH}/w/${libraryWriteWorkspaceId}/app/indexPatterns`);
        cy.contains('opensearch_dashboards_sample_data_ecommerce').click();
        cy.getElementByTestId('setDefaultIndexPatternButton').click();
        cy.contains('Unable to update UI setting');
      });

      it('Normal users should not be able to find objects from other workspaces when inside a workspace', () => {
        cy.visit(`${BASE_PATH}/w/${readOnlyWorkspaceId}/app/objects`);
        cy.getElementByTestId('savedObjectsTableRowTitle').should('exist');
        cy.getElementByTestId(
          'savedObjectsTableColumn-workspace_column'
        ).should('not.exist');
        cy.contains('opensearch_dashboards_sample_data_ecommerce');
        // Electron old version may not support search event, so we manually trigger a search event
        cy.getElementByTestId('savedObjectSearchBar')
          .type('opensearch_dashboards_sample_data_ecommerce{enter}')
          .trigger('search');
        cy.getElementByTestId('savedObjectsTableRowTitle').should(
          'have.length',
          1
        );
      });

      if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
        it('Normal users should not be able to associate / dissociate data sources from workspace.', () => {
          cy.visit(`${BASE_PATH}/w/${ownerWorkspaceId}/app/dataSources`);
          cy.contains('Data sources');
          cy.getElementByTestId('workspaceAssociateDataSourceButton').should(
            'not.exist'
          );
          cy.getElementByTestId(
            'dataSourcesManagement-dataSourceTable-dissociateButton'
          ).should('not.exist');
        });
      }
    });
  });
}
