/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';

const NOTEBOOK_NAME = 'classic-notebook';

const createWorkspaceWithEcommerceData = () => {
  const workspaceName = `investigation-workspace_${Math.random()
    .toString(36)
    .substring(7)}`;

  return cy
    .createDataSourceNoAuth()
    .then((result) => {
      const dataSourceId = result[0];
      return cy
        .createWorkspace({
          name: workspaceName,
          description: 'Workspace for classic notebook testing',
          features: ['use-case-all'],
          settings: {
            permissions: {
              library_write: { users: ['%me%'] },
              write: { users: ['%me%'] },
            },
            dataSources: [dataSourceId],
          },
        })
        .then((workspaceId) => ({
          workspaceId,
          dataSourceId,
        }));
    })
    .then(({ workspaceId, dataSourceId }) =>
      cy
        .loadSampleDataForWorkspace('ecommerce', workspaceId, dataSourceId)
        .then(() =>
          cy.wrap({
            workspaceId,
            dataSourceId,
          })
        )
    );
};

if (Cypress.env('DASHBOARDS_INVESTIGATION_ENABLED')) {
  describe('Checking notebooks page', () => {
    let workspaceId = '';
    let dataSourceId = '';
    before(() => {
      createWorkspaceWithEcommerceData().then((result) => {
        workspaceId = result.workspaceId;
        dataSourceId = result.dataSourceId;
      });
    });

    after(() => {
      if (workspaceId) {
        if (dataSourceId) {
          cy.removeSampleDataForWorkspace(
            'ecommerce',
            workspaceId,
            dataSourceId
          );
        }
        cy.deleteWorkspaceById(workspaceId);
      }
      if (dataSourceId) {
        cy.deleteDataSource(dataSourceId);
      }
    });

    beforeEach(() => {
      // go to notebooks page
      cy.visit(`${BASE_PATH}/w/${workspaceId}/app/investigation-notebooks#`);
    });

    it('checking notebooks create button and add sample button in the top panel', () => {
      cy.getElementByTestId('createNotebookPrimaryBtn')
        .should('exist')
        .should('have.length', 1)
        .should('be.visible');
      cy.getElementByTestId('notebookEmptyTableCreateBtn')
        .should('exist')
        .should('have.length', 1)
        .should('be.visible');
      cy.getElementByTestId('notebookEmptyTableAddSamplesBtn')
        .should('exist')
        .should('have.length', 2)
        .should('be.visible');
    });

    it('creates a classic notebook', () => {
      cy.getElementByTestId('createNotebookPrimaryBtn').click();
      cy.getElementByTestId('custom-input-modal-input').focus();
      cy.getElementByTestId('custom-input-modal-input').type(NOTEBOOK_NAME);

      cy.getElementByTestId('custom-input-modal-confirm-button').click();
      cy.contains(`Notebook "${NOTEBOOK_NAME}" successfully created`);
      cy.getElementByTestId('headerAppActionMenu')
        .find('.osdTopNavMenuScreenTitle')
        .contains(NOTEBOOK_NAME);
    });

    it('adds a SQL query paragraph', () => {
      cy.get('.euiTableRow').contains(NOTEBOOK_NAME).click();
      cy.getElementByTestId('emptyNotebookAddCodeBlockBtn').click();
      cy.getElementByTestId('queryPanelFooterLanguageToggle').click();
      cy.getElementByTestId('queryPanelFooterLanguageToggle-SQL')
        .should('exist')
        .click();

      cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('SQL');

      cy.contains(
        'To use the query editor, select an index and run a query to get started.'
      ).should('exist');
    });

    it('deletes paragraphs', () => {
      cy.get('.euiTableRow').contains(NOTEBOOK_NAME).click();
      cy.get('button[aria-label="Open paragraph menu"]')
        .should('have.length', 1)
        .click();

      cy.get('button.euiContextMenuItem')
        .contains('Delete')
        .should('be.visible')
        .click();

      cy.getElementByTestId('confirmModalTitleText')
        .contains('Delete paragraph')
        .should('exist');
      cy.getElementByTestId('confirmModalConfirmButton')
        .contains('Delete')
        .click();

      cy.get('[data-test-subj="emptyNotebookAddCodeBlockBtn"]').should('exist');
    });

    it('deletes notebook', () => {
      cy.contains('.euiTableRow', NOTEBOOK_NAME)
        .find('input[type="checkbox"]')
        .check();

      cy.getElementByTestId('deleteSelectedNotebooks').click();

      cy.getElementByTestId('delete-notebook-modal-input').focus();
      cy.getElementByTestId('delete-notebook-modal-input').type('delete');
      cy.getElementByTestId('delete-notebook-modal-delete-button').should(
        'not.be.disabled'
      );
      cy.getElementByTestId('delete-notebook-modal-delete-button').click();
      cy.contains('.euiTableRow', NOTEBOOK_NAME).should('not.exist');
    });
  });
}
