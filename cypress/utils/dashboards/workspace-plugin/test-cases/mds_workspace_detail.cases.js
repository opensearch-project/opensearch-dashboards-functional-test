/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { ADMIN_AUTH } from '../../../commands';
import workspaceTestUser from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestUser.json';
import workspaceTestRole from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRole.json';
import workspaceTestRoleMapping from '../../../../fixtures/dashboard/opensearch_dashboards/workspace/workspaceTestRoleMapping.json';

export const WorkspaceDetailTestCases = () => {
  const NONE_DASHBOARDS_ADMIN_USERNAME = 'workspace-test';
  const WORKSPACE_TEST_ROLE_NAME = 'workspace-test-role';

  const miscUtils = new MiscUtils(cy);
  const workspaceName = 'test_workspace_320sdfouAz';
  let workspaceDescription = 'This is a workspace description.';
  let workspaceId;
  let workspaceFeatures = ['use-case-observability'];
  const originalUser = ADMIN_AUTH.username;
  const originalPassword = ADMIN_AUTH.password;

  const workspaceBaseData = {
    name: workspaceName,
    description: workspaceDescription,
    features: workspaceFeatures,
    color: '#54B399',
    settings: {
      permissions: {
        library_write: { users: ['%me%'] },
        write: { users: ['%me%'] },
        library_read: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
        read: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
      },
    },
  };

  const enterEditMode = () => {
    // 等待页面完全加载
    cy.get('.euiLoadingSpinner', { timeout: 30000 }).should('not.exist');
    cy.wait(1000);

    cy.getElementByTestId('workspaceForm-workspaceDetails-edit')
      .should('be.visible')
      .as('editBtn');
    cy.get('@editBtn').click({ force: true });

    // 等待编辑表单加载完成
    cy.get('.euiLoadingSpinner', { timeout: 20000 }).should('not.exist');
    cy.wait(1500);

    // 只在安全启用时等待隐私设置选择器出现
    // 在 test-without-security 环境下，隐私设置选择器不存在
    if (Cypress.env('SECURITY_ENABLED')) {
      cy.getElementByTestId('workspacePrivacySettingSelector', {
        timeout: 30000,
      }).should('be.visible');
    } else {
      // 在非安全环境下，等待其他表单元素出现来确认表单已加载
      cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText', {
        timeout: 30000,
      }).should('be.visible');
    }
  };

  if (Cypress.env('WORKSPACE_ENABLED')) {
    describe('Workspace detail', () => {
      before(() => {
        if (Cypress.env('SECURITY_ENABLED')) {
          cy.createInternalUser(
            NONE_DASHBOARDS_ADMIN_USERNAME,
            workspaceTestUser
          );
          cy.createRole(WORKSPACE_TEST_ROLE_NAME, workspaceTestRole);
          cy.createRoleMapping(
            WORKSPACE_TEST_ROLE_NAME,
            workspaceTestRoleMapping
          );
        }
        cy.deleteWorkspaceByName(workspaceName);
        cy.createWorkspace(workspaceBaseData).then(
          (value) => (workspaceId = value)
        );
      });

      after(() => {
        cy.deleteWorkspaceById(workspaceId);
        if (Cypress.env('SECURITY_ENABLED')) {
          cy.deleteRoleMapping(WORKSPACE_TEST_ROLE_NAME);
          cy.deleteInternalUser(NONE_DASHBOARDS_ADMIN_USERNAME);
          cy.deleteRole(WORKSPACE_TEST_ROLE_NAME);
        }
      });

      describe('workspace details content', () => {
        beforeEach(() => {
          miscUtils.visitPage(`w/${workspaceId}/app/workspace_detail`);
          cy.intercept('PUT', `**/api/workspaces/${workspaceId}`).as(
            'updateWorkspaceRequest'
          );
          cy.get('.euiLoadingSpinner', { timeout: 20000 }).should('not.exist');
          enterEditMode();
        });

        describe('Validate workspace name and description', () => {
          it('workspace name is required', () => {
            cy.getElementByTestId(
              'workspaceForm-workspaceDetails-nameInputText'
            ).clear({ force: true });
            cy.getElementByTestId(
              'workspaceForm-workspaceDetails-descriptionInputText'
            )
              .clear({ force: true })
              .type('test_workspace_description');
            cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click(
              { force: true }
            );
            cy.contains('Enter a name.').should('be.visible');
          });

          it('workspace name is not valid', () => {
            cy.getElementByTestId(
              'workspaceForm-workspaceDetails-nameInputText'
            )
              .clear({ force: true })
              .type('./+');
            cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click(
              { force: true }
            );
            cy.contains('Enter a valid name.').should('be.visible');
          });
        });

        describe('Update a workspace successfully', () => {
          it('should successfully update a workspace', () => {
            cy.getElementByTestId(
              'workspaceForm-workspaceDetails-nameInputText'
            )
              .clear({ force: true })
              .type(workspaceName);
            workspaceDescription = 'test_workspace_description.+~!';
            cy.getElementByTestId(
              'workspaceForm-workspaceDetails-descriptionInputText'
            )
              .clear({ force: true })
              .type(workspaceDescription);

            cy.getElementByTestId(
              'euiColorPickerAnchor workspaceForm-workspaceDetails-colorPicker'
            ).click();
            cy.get('button[aria-label="Select #6092C0 as the color"]').click();

            cy.get('button.euiSuperSelectControl')
              .contains('Observability')
              .click({ force: true });
            cy.get('button.euiSuperSelect__item')
              .contains('Analytics')
              .click({ force: true });

            cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click(
              { force: true }
            );
            cy.wait('@updateWorkspaceRequest')
              .its('response.statusCode')
              .should('eq', 200);

            cy.location('pathname', { timeout: 10000 }).should(
              'include',
              'app/workspace_detail'
            );
            cy.checkWorkspace(workspaceId, {
              name: workspaceName,
              description: workspaceDescription,
              color: '#6092C0',
              features: ['use-case-all'],
            });
          });
        });
      });

      if (
        Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
        Cypress.env('SECURITY_ENABLED')
      ) {
        describe('update with different workspace access level', () => {
          beforeEach(() => {
            ADMIN_AUTH.username = originalUser;
            ADMIN_AUTH.password = originalPassword;
          });

          it('should not able to update workspace meta for non workspace admin', () => {
            ADMIN_AUTH.newUser = NONE_DASHBOARDS_ADMIN_USERNAME;
            ADMIN_AUTH.newPassword = workspaceTestUser.password;

            miscUtils.visitPage(`/app/workspace_list`);
            cy.get('.euiLoadingSpinner', { timeout: 20000 }).should(
              'not.exist'
            );
            cy.contains(workspaceName).should('be.visible');
            cy.get(`#${workspaceId}-actions`).click();
            cy.getElementByTestId('workspace-list-edit-icon').click();

            enterEditMode();
            cy.getElementByTestId(
              'workspaceForm-workspaceDetails-descriptionInputText'
            ).clear({ force: true });
            cy.getElementByTestId('workspaceForm-bottomBar-updateButton').click(
              { force: true }
            );

            cy.getElementByTestId('globalToastList')
              .contains('Invalid workspace permission')
              .should('be.visible');
          });

          it('should able to update workspace meta for workspace admin', () => {
            const adminWorkspaceData = {
              name: 'kibana-server-workspace-admin',
              features: ['use-case-all'],
              settings: {
                permissions: {
                  library_write: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
                  write: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
                },
              },
            };
            cy.deleteWorkspaceByName(adminWorkspaceData.name);
            cy.createWorkspace(adminWorkspaceData).then((id) => {
              ADMIN_AUTH.newUser = NONE_DASHBOARDS_ADMIN_USERNAME;
              ADMIN_AUTH.newPassword = workspaceTestUser.password;

              miscUtils.visitPage(`/app/workspace_list`);
              cy.get('.euiLoadingSpinner', { timeout: 20000 }).should(
                'not.exist'
              );
              cy.get(`#${id}-actions`).click();
              cy.getElementByTestId('workspace-list-edit-icon').click();

              enterEditMode();
              cy.getElementByTestId(
                'workspaceForm-workspaceDetails-descriptionInputText'
              )
                .clear({ force: true })
                .type('New description');
              cy.getElementByTestId(
                'workspaceForm-bottomBar-updateButton'
              ).click({ force: true });
              cy.getElementByTestId('globalToastList')
                .contains('Update workspace successfully')
                .should('be.visible');

              cy.checkWorkspace(id, {
                ...adminWorkspaceData,
                description: 'New description',
              });
              cy.deleteWorkspaceById(id);
            });
          });
        });

        describe('update with different privacy settings', () => {
          before(() => {
            ADMIN_AUTH.username = originalUser;
            ADMIN_AUTH.password = originalPassword;
            delete ADMIN_AUTH.newUser;
            miscUtils.visitPage(`w/${workspaceId}/app/workspace_detail`);
            cy.get('.euiLoadingSpinner', { timeout: 20000 }).should(
              'not.exist'
            );
          });

          beforeEach(() => {
            cy.intercept('PUT', `**/api/workspaces/${workspaceId}`).as(
              'privacyUpdate'
            );
          });

          afterEach(() => {
            miscUtils.visitPage(`w/${workspaceId}/app/workspace_detail`);
            // 修复：增加更长的 timeout 和多次等待
            cy.get('.euiLoadingSpinner', { timeout: 60000 }).should(
              'not.exist'
            );
            cy.wait(3000);

            cy.get('body').then(($body) => {
              if (
                $body.find(
                  '[data-test-subj="workspaceForm-workspaceDetails-edit"]'
                ).length > 0
              ) {
                enterEditMode();
                cy.getElementByTestId('workspacePrivacySettingSelector', {
                  timeout: 20000,
                }).click({ force: true });
                cy.get('#private-to-collaborators', { timeout: 15000 })
                  .should('be.visible')
                  .click({ force: true });
                cy.getElementByTestId('workspaceForm-bottomBar-updateButton', {
                  timeout: 15000,
                })
                  .should('be.visible')
                  .click({ force: true });
                cy.wait('@privacyUpdate', { timeout: 15000 });
              }
            });
          });

          it('should able to update privacy setting to anyone can read', () => {
            enterEditMode();
            cy.getElementByTestId('workspacePrivacySettingSelector', {
              timeout: 15000,
            }).click({ force: true });

            cy.get('#anyone-can-view', { timeout: 10000 })
              .should('be.visible')
              .as('readOption');
            cy.get('@readOption').click({ force: true });

            cy.getElementByTestId('workspaceForm-bottomBar-updateButton', {
              timeout: 10000,
            })
              .should('be.enabled')
              .click({ force: true });
            cy.wait('@privacyUpdate')
              .its('response.statusCode')
              .should('eq', 200);

            cy.checkWorkspace(workspaceId, {
              name: workspaceName,
              description: workspaceDescription,
              permissions: {
                library_write: { users: ['%me%'] },
                write: { users: ['%me%'] },
                library_read: { users: [NONE_DASHBOARDS_ADMIN_USERNAME, '*'] },
                read: { users: [NONE_DASHBOARDS_ADMIN_USERNAME, '*'] },
              },
            });
          });

          it('should able to update privacy setting to anyone can edit', () => {
            enterEditMode();
            cy.getElementByTestId('workspacePrivacySettingSelector', {
              timeout: 15000,
            }).click({ force: true });

            cy.get('#anyone-can-edit', { timeout: 10000 })
              .should('be.visible')
              .as('editOption');
            cy.get('@editOption').click({ force: true });

            cy.getElementByTestId('workspaceForm-bottomBar-updateButton', {
              timeout: 10000,
            })
              .should('be.enabled')
              .click({ force: true });
            cy.wait('@privacyUpdate')
              .its('response.statusCode')
              .should('eq', 200);

            cy.checkWorkspace(workspaceId, {
              name: workspaceName,
              description: workspaceDescription,
              permissions: {
                library_write: { users: ['%me%', '*'] },
                write: { users: ['%me%'] },
                library_read: { users: [NONE_DASHBOARDS_ADMIN_USERNAME] },
                read: { users: [NONE_DASHBOARDS_ADMIN_USERNAME, '*'] },
              },
            });
          });
        });
      }
    });
  }
};
