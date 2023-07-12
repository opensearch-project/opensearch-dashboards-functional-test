/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const selectTopItemFromFilter = (
  dataTestSubjectName,
  allowMultipleSelections = true
) => {
  cy.getElementByTestId(dataTestSubjectName)
    .find('[data-test-subj=comboBoxToggleListButton]')
    .click({ force: true });
  cy.get('.euiFilterSelectItem').first().click();
  cy.wait(1000);
  // If multiple options can be selected, the combo box doesn't close after selecting an option.
  // We manually close in this case, so the unselected items aren't visible on the page.
  // This way, we can test whether or not filtering has worked as expected.
  if (allowMultipleSelections) {
    cy.getElementByTestId(dataTestSubjectName)
      .find('[data-test-subj=comboBoxToggleListButton]')
      .click();
  }
};
