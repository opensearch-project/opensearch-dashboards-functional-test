/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const testCoversationFeedback = () => {
  it('display feedback button and able to interact', () => {
    // input question
    cy.wait(1000);
    cy.get(`input[placeholder="Ask question"]`)
      .click()
      .type('What are the indices in my cluster?{enter}');

    // should have a LLM Response
    cy.contains('The indices in your cluster');

    // should have a thumb up and a thumb down feedback button
    cy.get(`[aria-label="feedback thumbs up"]`).should('be.length', 1);
    cy.get(`[aria-label="feedback thumbs down"]`).should('be.length', 1);
    // click thumb up button to feedback
    cy.get(`[aria-label="feedback thumbs up"]`).click();
    // only thumb up button displays and thumb down button is hidden
    cy.get(`[aria-label="feedback thumbs down"]`).should('be.length', 0);
    cy.get(`[aria-label="feedback thumbs up"]`).should('be.length', 1);
    // The type of clicked button should be primary.
    cy.get(`[aria-label="feedback thumbs up"]`).should(
      'have.class',
      'euiButtonIcon--primary'
    );
  });
};
