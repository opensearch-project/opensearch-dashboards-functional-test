/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const updatePrivacySetting = (settingId) => {
  cy.wait(1000);

  cy.getElementByTestId('workspaceCollaborators-privacySetting-edit')
    .should('exist')
    .click({ force: true });

  cy.getElementByTestId('workspacePrivacySettingSelector', { timeout: 20000 })
    .should('exist')
    .click({ force: true });

  cy.get(`#${settingId}`, { timeout: 10000 })
    .should('exist')
    .click({ force: true });

  cy.getElementByTestId('workspaceCollaborators-privacySetting-save')
    .should('exist')
    .click({ force: true });

  cy.getElementByTestId('workspaceCollaborators-privacySetting-save', {
    timeout: 15000,
  }).should('not.exist');
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
              library_read: { users: ['read_user'] },
              read: { users: ['read_user'] },
            },
          },
        }).then((value) => {
          workspaceId = value;
          miscUtils.visitPage(`w/${value}/app/workspace_collaborators`);
          cy.get('.euiLoadingSpinner', { timeout: 20000 }).should('not.exist');
          cy.get('body').then(($body) => {
            if ($body.find('.euiModal').length > 0) {
              cy.get('body').type('{esc}');
            }
          });
        });
      });

      afterEach(() => {
        cy.deleteWorkspaceById(workspaceId);
      });

      it('should add user and group collaborators successfully', () => {
        cy.getElementByTestId('add-collaborator-popover')
          .should('be.visible')
          .click();
        cy.get('button[id="user"]').click();
        cy.getElementByTestId('workspaceCollaboratorIdInput-0').type(
          'new_read_user'
        );
        cy.get('button[type="submit"]')
          .contains('span', 'Add collaborators')
          .click();
        cy.contains('new_read_user').should('be.visible');
      });

      it('should change access level successfully', () => {
        // 等待表格完全加载
        cy.get('table', { timeout: 20000 }).should('be.visible');
        cy.wait(1000);

        // 修复：点击复选框的label来选中（EUI组件需要这种方式）
        cy.contains('td', 'read_user', { timeout: 10000 })
          .closest('tr')
          .find('.euiCheckbox__label, input[type="checkbox"]')
          .first()
          .click({ force: true });
        cy.wait(1000);

        cy.contains('td', 'admin_group', { timeout: 10000 })
          .closest('tr')
          .find('.euiCheckbox__label, input[type="checkbox"]')
          .first()
          .click({ force: true });
        cy.wait(1000);

        cy.getElementByTestId('workspace-detail-collaborator-table-actions', {
          timeout: 10000,
        })
          .should('be.visible')
          .click();
        cy.contains('span', 'Change access level')
          .should('be.visible')
          .click({ force: true });
        cy.wait(500);
        cy.contains('span', 'Read and write')
          .should('be.visible')
          .click({ force: true });

        cy.getElementByTestId('confirmModalConfirmButton', {
          timeout: 10000,
        }).as('confirmBtn');
        cy.get('@confirmBtn').should('be.visible');
        cy.get('@confirmBtn').click({ force: true });
        cy.get('@confirmBtn').should('not.exist');
      });

      it('should delete collaborators successfully', () => {
        // 等待表格完全加载
        cy.get('table', { timeout: 20000 }).should('be.visible');
        cy.wait(1000);

        // 修复：点击复选框的label来选中（EUI组件需要这种方式）
        cy.contains('td', 'read_user', { timeout: 10000 })
          .closest('tr')
          .find('.euiCheckbox__label, input[type="checkbox"]')
          .first()
          .click({ force: true });
        cy.wait(1000);

        cy.contains('td', 'admin_group', { timeout: 10000 })
          .closest('tr')
          .find('.euiCheckbox__label, input[type="checkbox"]')
          .first()
          .click({ force: true });
        cy.wait(1000);

        cy.getElementByTestId('confirm-delete-button', { timeout: 10000 }).as(
          'deleteBtn'
        );
        cy.get('@deleteBtn').should('be.visible');
        cy.get('@deleteBtn').should('be.enabled');
        cy.get('@deleteBtn').click({ force: true });

        cy.getElementByTestId('confirmModalConfirmButton', {
          timeout: 10000,
        }).as('confirmBtn');
        cy.get('@confirmBtn').should('be.visible');
        cy.get('@confirmBtn').click({ force: true });

        cy.get('@confirmBtn').should('not.exist');

        cy.get('.euiLoadingSpinner', { timeout: 20000 }).should('not.exist');

        cy.contains('td', 'read_user', { timeout: 10000 }).should('not.exist');
        cy.contains('td', 'admin_group', { timeout: 10000 }).should(
          'not.exist'
        );
      });

      it('should change to "anyone can read" successfully', () => {
        updatePrivacySetting('anyone-can-view');

        cy.contains('Anyone can view').should('exist');
      });

      it('should change to "anyone can edit" successfully', () => {
        updatePrivacySetting('anyone-can-edit');
        cy.contains('Anyone can edit').should('exist');
      });

      it('should change back to "private to collaborators" successfully', () => {
        updatePrivacySetting('anyone-can-view');
        updatePrivacySetting('private-to-collaborators');
        cy.contains('Private to collaborators').should('exist');
      });
    });
  }
};
