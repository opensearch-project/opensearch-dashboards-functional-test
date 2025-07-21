/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {Cypress.PluginConfig} */
// / <reference types="cypress" />

import {
  BANNER_SELECTORS,
  BANNER_TEXT,
  BANNER_LINKS,
} from '../../../utils/plugins/banner/constants';

// Import commands
import '../../../utils/plugins/banner/commands';

describe('Banner Plugin', () => {
  beforeEach(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');

    cy.visit('/');
    cy.contains('Home', { timeout: 10000 }).should('be.visible');
  });

  it('displays the global banner with correct content', () => {
    // Check if the banner exists
    cy.verifyBannerVisible();

    // Check the banner content
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find(BANNER_SELECTORS.CALLOUT)
      .should('exist');

    // Check the announcement text
    cy.verifyBannerText(BANNER_TEXT.ANNOUNCEMENT);

    // Check the link
    cy.verifyBannerLink(BANNER_TEXT.LEARN_MORE, BANNER_LINKS.LEARN_MORE);

    // Verify additional link attributes
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('a')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer');
  });

  it('closes the banner when the close button is clicked', () => {
    // Check if the banner exists initially
    cy.verifyBannerVisible();

    // Click the close button
    cy.closeBanner();

    // Verify the banner is no longer visible
    cy.verifyBannerNotVisible();
  });
});
