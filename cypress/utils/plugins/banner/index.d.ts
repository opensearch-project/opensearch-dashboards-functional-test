/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TypeScript definitions for banner plugin commands
 */

declare namespace Cypress {
  interface Chainable {
    /**
     * Verifies that the global banner is visible
     * @example cy.verifyBannerVisible()
     */
    verifyBannerVisible(): Chainable<Element>;

    /**
     * Verifies that the global banner is not visible
     * @example cy.verifyBannerNotVisible()
     */
    verifyBannerNotVisible(): Chainable<Element>;

    /**
     * Clicks the close button on the banner
     * @example cy.closeBanner()
     */
    closeBanner(): Chainable<Element>;

    /**
     * Verifies the banner content
     * @param {string} text - The text to verify in the banner
     * @example cy.verifyBannerText('This is an important announcement for all users.')
     */
    verifyBannerText(text: string): Chainable<Element>;

    /**
     * Verifies the banner link
     * @param {string} linkText - The link text to verify
     * @param {string} href - The href attribute to verify
     * @example cy.verifyBannerLink('Learn more', 'https://opensearch.org')
     */
    verifyBannerLink(linkText: string, href: string): Chainable<Element>;
  }
}
