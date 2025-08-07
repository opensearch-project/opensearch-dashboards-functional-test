/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {Cypress.PluginConfig} */
// / <reference types="cypress" />

import {
  BANNER_SELECTORS,
  BANNER_TIMEOUT,
} from '../../../../utils/plugins/banner/constants';

// Import commands
import '../../../../utils/plugins/banner/commands';

describe('Banner Plugin Advanced Settings', () => {
  beforeEach(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');

    // Reset banner settings to default before each test
    cy.setAdvancedSetting({
      'banner:active': true,
      'banner:content': '',
      'banner:color': 'primary',
      'banner:iconType': 'iInCircle',
      'banner:useMarkdown': true,
    });

    cy.visit('/');
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');
  });

  it('toggles banner visibility with banner:active setting', () => {
    // Banner should be visible by default
    cy.verifyBannerVisible();

    // Disable the banner
    cy.setAdvancedSetting({
      'banner:active': false,
    });

    // Reload the page to apply settings
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

    // Banner should not be visible
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER).should('not.be.visible');
  });

  it('changes banner content with banner:content setting', () => {
    const customContent = 'This is a custom banner message';

    // Set custom banner content
    cy.setAdvancedSetting({
      'banner:content': customContent,
    });

    // Reload the page to apply settings
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

    // Verify the custom content is displayed
    cy.verifyBannerText(customContent);
  });

  it('changes banner color with banner:color setting', () => {
    // Test warning color
    cy.setAdvancedSetting({
      'banner:color': 'warning',
    });

    // Reload the page to apply settings
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

    // Verify the warning color is applied
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('.euiCallOut--warning')
      .should('exist');

    // Test danger color
    cy.setAdvancedSetting({
      'banner:color': 'danger',
    });

    // Reload the page to apply settings
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

    // Verify the danger color is applied
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('.euiCallOut--danger')
      .should('exist');

    // Reset to primary color
    cy.setAdvancedSetting({
      'banner:color': 'primary',
    });

    // Reload the page to apply settings
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

    // Verify the primary color is applied
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('.euiCallOut--primary')
      .should('exist');
  });

  it('changes banner icon with banner:iconType setting', () => {
    // Store the initial icon element for comparison
    let initialIconPath;
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('.euiCallOutHeader__icon')
      .find('path')
      .invoke('attr', 'd')
      .then((initialPath) => {
        initialIconPath = initialPath;
      });

    // Test different icon types
    const iconTypes = ['help', 'alert', 'warning', 'bell'];

    // Test each icon type
    iconTypes.forEach((iconType) => {
      cy.setAdvancedSetting({
        'banner:iconType': iconType,
      });

      // Reload the page to apply settings
      cy.reload();
      cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

      // Verify the icon has changed
      cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
        .find('.euiCallOutHeader__icon')
        .find('path')
        .invoke('attr', 'd')
        .then((currentPath) => {
          // For the first icon type, compare with the initial icon
          if (iconType === iconTypes[0]) {
            expect(currentPath).not.to.equal(initialIconPath);
          }
        });
    });
  });

  it('renders markdown content when banner:useMarkdown is true', () => {
    const markdownContent = '**Bold text** and [link](https://opensearch.org)';

    // Set markdown content with useMarkdown enabled
    cy.setAdvancedSetting({
      'banner:content': markdownContent,
      'banner:useMarkdown': true,
    });

    // Reload the page to apply settings
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

    // Verify markdown is rendered
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('strong')
      .should('contain', 'Bold text');

    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('a')
      .should('have.attr', 'href', 'https://opensearch.org')
      .and('contain', 'link');

    // Disable markdown rendering
    cy.setAdvancedSetting({
      'banner:useMarkdown': false,
    });

    // Reload the page to apply settings
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

    // Verify markdown is not rendered
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .should('contain', markdownContent)
      .find('strong')
      .should('not.exist');
  });

  it('combines multiple banner settings for a customized banner', () => {
    // Set multiple banner settings at once
    const customContent =
      '⚠️ **Important notice**: System maintenance scheduled';

    cy.setAdvancedSetting({
      'banner:content': customContent,
      'banner:color': 'warning',
      'banner:iconType': 'alert',
      'banner:useMarkdown': true,
    });

    // Reload the page to apply settings
    cy.reload();
    cy.contains('Home', { timeout: BANNER_TIMEOUT }).should('be.visible');

    // Verify all settings are applied correctly
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('.euiCallOut--warning')
      .should('exist');

    // Verify the icon exists (we can't check the specific icon type, just that it's there)
    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('.euiCallOutHeader__icon')
      .should('exist');

    cy.get(BANNER_SELECTORS.BANNER_CONTAINER)
      .find('strong')
      .should('contain', 'Important notice');
  });
});
