/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Banner plugin utility functions for Cypress tests
 */

import { BANNER_SELECTORS } from './constants';

/**
 * Verifies that the global banner is visible
 * @returns {Cypress.Chainable} Cypress chainable
 */
export const verifyBannerVisible = () => {
  return cy.get(BANNER_SELECTORS.BANNER_CONTAINER).should('be.visible');
};

/**
 * Verifies that the global banner is not visible
 * @returns {Cypress.Chainable} Cypress chainable
 */
export const verifyBannerNotVisible = () => {
  return cy.get(BANNER_SELECTORS.BANNER_CONTAINER).should('not.be.visible');
};

/**
 * Clicks the close button on the banner
 * @returns {Cypress.Chainable} Cypress chainable
 */
export const closeBanner = () => {
  return cy.get(BANNER_SELECTORS.CLOSE_BUTTON).click();
};

/**
 * Verifies the banner content
 * @param {string} text - The text to verify in the banner
 * @returns {Cypress.Chainable} Cypress chainable
 */
export const verifyBannerText = (text) => {
  return cy
    .get(BANNER_SELECTORS.BANNER_CONTAINER)
    .contains(text)
    .should('exist');
};

/**
 * Verifies the banner link
 * @param {string} linkText - The link text to verify
 * @param {string} href - The href attribute to verify
 * @returns {Cypress.Chainable} Cypress chainable
 */
export const verifyBannerLink = (linkText, href) => {
  return cy
    .get(BANNER_SELECTORS.BANNER_CONTAINER)
    .find('a')
    .should('have.attr', 'href', href)
    .and('contain', linkText);
};

// Add Cypress commands
Cypress.Commands.add('verifyBannerVisible', verifyBannerVisible);
Cypress.Commands.add('verifyBannerNotVisible', verifyBannerNotVisible);
Cypress.Commands.add('closeBanner', closeBanner);
Cypress.Commands.add('verifyBannerText', verifyBannerText);
Cypress.Commands.add('verifyBannerLink', verifyBannerLink);
