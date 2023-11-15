/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  /**
   * For cypress on 9.6.0 and chrome larger than 117, --headless=new is needed.
   * https://github.com/cypress-io/cypress-documentation/issues/5479#issuecomment-1719336938
   */
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (
      (browser.name === 'chrome' || browser.name === 'chromium') &&
      browser.isHeadless
    ) {
      launchOptions.args = launchOptions.args.map((arg) => {
        if (arg === '--headless') {
          return '--headless=new';
        }

        return arg;
      });
    }

    return launchOptions;
  });
};
