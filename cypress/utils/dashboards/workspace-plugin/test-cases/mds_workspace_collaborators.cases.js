/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const updatePrivacySetting = (settingId) => {
  cy.getElementByTestId('workspaceCollaborators-privacySetting-edit').click();
  cy.getElementByTestId('workspacePrivacySettingSelector').click({
    force: true,
  });
  cy.get(`#${settingId}`).click({ force: true });
  cy.getElementByTestId('workspaceCollaborators-privacySetting-save').click({
    force: true,
  });

  cy.getElementByTestId('workspaceCollaborators-privacySetting-save').should(
    'not.exist'
  );
};

export const WorkspaceCollaboratorsTestCases = () => {
  const miscUtils = new MiscUtils(cy);
  const workspaceName = 'test_workspace_collaborators';
  let workspaceId;

  if (
    Cypress.env('WORKSPACE_ENABLED') &&
    Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
    Cypress.env('SECURITY_ENABLED')
  ) {
    describe('Workspace collaborators', () => {
      beforeEach(() => {
        cy.deleteWorkspaceByName(workspaceName);
        //Create a workspace before each test
        cy.createWorkspace({
          name: workspaceName,
          features: ['use-case-observability'],
          settings: {
            permissions: {
              library_write: {
                users: [`${Cypress.env('username')}`],
                groups: ['admin_group'],
              },
              write: {
                users: [`${Cypress.env('username')}`],
                groups: ['admin_group'],
              },
              library_read: {
                users: ['read_user'],
              },
              read: {
                users: ['read_user'],
              },
            },
          },
        }).then((value) => {
          workspaceId = value;
          miscUtils.visitPage(`w/${value}/app/workspace_collaborators`);
        });
      });

      afterEach(() => {
        cy.deleteWorkspaceById(workspaceId);
      });

      it('should add user and group collaborators successfully', () => {
        //Add user
        cy.getElementByTestId('add-collaborator-popover').click();
        cy.get('button[id="user"]').click();
        cy.contains('Add Users').should('be.visible');
        cy.getElementByTestId('workspaceCollaboratorIdInput-0').type(
          'new_read_user'
        );
        cy.get('button[type="submit"]')
          .contains('span', 'Add collaborators')
          .click();

        //Add group
        cy.getElementByTestId('add-collaborator-popover').click();
        cy.get('button[id="group"]').click();
        cy.contains('Add Groups').should('be.visible');
        cy.getElementByTestId('workspaceCollaboratorIdInput-0').type(
          'new_admin_group'
        );
        cy.get('span[title="Admin"]').click();
        cy.get('button[type="submit"]')
          .contains('span', 'Add collaborators')
          .click();

        cy.contains('new_read_user');

        cy.get('table')
          .contains('td', 'new_read_user')
          .parent()
          .within(() => {
            cy.get('td').eq(3).contains('Read only');
          });

        cy.get('table')
          .contains('td', 'new_admin_group')
          .parent()
          .within(() => {
            cy.get('td').eq(3).contains('Admin');
          });
        const expectedWorkspace = {
          name: workspaceName,
          features: ['use-case-observability'],
          description: 'test_description',
          permissions: {
            library_write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group', 'new_admin_group'],
            },
            write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group', 'new_admin_group'],
            },
            library_read: {
              users: ['read_user', 'new_read_user'],
            },
            read: {
              users: ['read_user', 'new_read_user'],
            },
          },
        };
        cy.checkWorkspace(workspaceId, expectedWorkspace);
      });

      it('should change access level successfully', () => {
        cy.get('table')
          .contains('td', 'read_user')
          .parent('tr')
          .within(() => {
            cy.get('input[type="checkbox"]').check();
          });
        cy.get('table')
          .contains('td', 'admin_group')
          .parent('tr')
          .within(() => {
            cy.get('input[type="checkbox"]').check();
          });

        cy.getElementByTestId(
          'workspace-detail-collaborator-table-actions'
        ).click();
        cy.get('div[role="dialog"]')
          .find('span')
          .contains('Change access level')
          .click();
        cy.get('div[role="dialog"]')
          .find('span')
          .contains('Read and write')
          .click();
        cy.getElementByTestId('confirmModalConfirmButton').click();

        cy.contains('read_user');

        cy.get('table')
          .contains('td', 'read_user')
          .parent()
          .within(() => {
            cy.get('td').eq(3).contains('Read and write');
          });
        cy.get('table')
          .contains('td', 'admin_group')
          .parent()
          .within(() => {
            cy.get('td').eq(3).contains('Read and write');
          });
        const expectedWorkspace = {
          name: workspaceName,
          features: ['use-case-observability'],
          description: 'test_description',
          permissions: {
            library_write: {
              users: [`${Cypress.env('username')}`, 'read_user'],
              groups: ['admin_group'],
            },
            write: {
              users: [`${Cypress.env('username')}`],
            },
            read: {
              groups: ['admin_group'],
              users: ['read_user'],
            },
          },
        };
        cy.checkWorkspace(workspaceId, expectedWorkspace);
      });

      it('should delete collaborators successfully', () => {
        cy.get('table')
          .contains('td', 'read_user')
          .parent('tr')
          .within(() => {
            cy.get('input[type="checkbox"]').check();
          });
        cy.get('table')
          .contains('td', 'admin_group')
          .parent('tr')
          .within(() => {
            cy.get('input[type="checkbox"]').check();
          });

        cy.getElementByTestId('confirm-delete-button').click();
        cy.getElementByTestId('confirmModalConfirmButton').click();

        cy.contains('read_user').should('not.exist');
        cy.contains('admin_group').should('not.exist');
        const expectedWorkspace = {
          name: workspaceName,
          features: ['use-case-observability'],
          description: 'test_description',
          permissions: {
            library_write: {
              users: ['admin'],
            },
            write: {
              users: ['admin'],
            },
          },
        };
        cy.checkWorkspace(workspaceId, expectedWorkspace);
      });

      it('should change to "anyone can read" successfully', () => {
        updatePrivacySetting('anyone-can-view');

        const expectedWorkspace = {
          name: workspaceName,
          features: ['use-case-observability'],
          description: 'test_description',
          permissions: {
            library_write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group'],
            },
            write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group'],
            },
            library_read: {
              users: ['read_user', '*'],
            },
            read: {
              users: ['read_user', '*'],
            },
          },
        };
        cy.checkWorkspace(workspaceId, expectedWorkspace);
      });

      it('should change to "anyone can edit" successfully', () => {
        updatePrivacySetting('anyone-can-edit');

        const expectedWorkspace = {
          name: workspaceName,
          features: ['use-case-observability'],
          description: 'test_description',
          permissions: {
            library_write: {
              users: [`${Cypress.env('username')}`, '*'],
              groups: ['admin_group'],
            },
            write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group'],
            },
            library_read: {
              users: ['read_user'],
            },
            read: {
              users: ['read_user', '*'],
            },
          },
        };
        cy.checkWorkspace(workspaceId, expectedWorkspace);
      });

      it('should change back to "private to collaborators" successfully', () => {
        updatePrivacySetting('anyone-can-view');
        cy.checkWorkspace(workspaceId, {
          name: workspaceName,
          features: ['use-case-observability'],
          description: 'test_description',
          permissions: {
            library_write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group'],
            },
            write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group'],
            },
            library_read: {
              users: ['read_user', '*'],
            },
            read: {
              users: ['read_user', '*'],
            },
          },
        });

        updatePrivacySetting('private-to-collaborators');
        cy.checkWorkspace(workspaceId, {
          name: workspaceName,
          features: ['use-case-observability'],
          description: 'test_description',
          permissions: {
            library_write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group'],
            },
            write: {
              users: [`${Cypress.env('username')}`],
              groups: ['admin_group'],
            },
            library_read: {
              users: ['read_user'],
            },
            read: {
              users: ['read_user'],
            },
          },
        });
      });
    });
  }
};
