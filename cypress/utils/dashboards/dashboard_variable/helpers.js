/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enter edit mode on the currently open dashboard (idempotent).
 */
export const enterEditMode = () => {
  // Wait for the dashboard to be fully loaded
  cy.getElementByTestId('dashboardEditSwitch', { timeout: 30000 }).should(
    'be.visible'
  );

  // Check if already in edit mode
  cy.getElementByTestId('dashboardEditSwitch').then(($switch) => {
    const isEditMode = $switch.attr('aria-checked') === 'true';

    // Only click if not already in edit mode
    if (!isEditMode) {
      cy.getElementByTestId('dashboardEditSwitch')
        .should('not.be.disabled')
        .click({ force: false });
    }
  });

  // Verify we're in edit mode by checking for the save button
  cy.getElementByTestId('dashboardSaveMenuItem', { timeout: 30000 }).should(
    'be.visible'
  );

  cy.getElementByTestId('dashboardVariablesBar').should('be.visible');
  cy.getElementByTestId('addVariableButton').should('be.visible');
};

export const openAddVariableEditor = () => {
  cy.getElementByTestId('addVariableButton').click();
  cy.getElementByTestId('variableEditorPanel').should('be.visible');
  cy.getElementByTestId('variableEditorName').should('be.visible');
  cy.getElementByTestId('variableEditorLabel').should('be.visible');
  cy.getElementByTestId('variableEditorDescription').should('be.visible');
  cy.getElementByTestId('variableEditorType').should('be.visible');
  cy.getElementByTestId('variableEditorCancel').should('be.visible');
};

export const saveVariableEditor = () => {
  cy.getElementByTestId('variableEditorSave').click();
  cy.contains('Variable added').should('be.visible');
  cy.getElementByTestId('variableEditorPanel').should('not.exist');
};

export const openEditForVariable = (varName) => {
  cy.getElementByTestId('manageVariablesButton').click();
  cy.getElementByTestId('variableManagementPanel').should('be.visible');
  cy.getElementByTestId('variableManagementPanel')
    .contains('strong', varName)
    .closest('.euiDraggable')
    .find('[aria-label="Edit variable"]')
    .click();
  cy.getElementByTestId('variableEditorPanel').should('be.visible');
};

export const deleteVariable = (varName) => {
  cy.getElementByTestId('manageVariablesButton').click();
  cy.getElementByTestId('variableManagementPanel').should('be.visible');
  cy.getElementByTestId('variableManagementPanel')
    .contains('strong', varName)
    .closest('.euiDraggable')
    .find('[aria-label="Delete variable"]')
    .click();
  cy.get('.euiModal, .euiConfirmModal').should('be.visible');
  cy.contains('button', 'Delete').click();
  cy.contains('Variable deleted').click();
  cy.get('.euiModal, .euiConfirmModal').should('not.exist');
};
