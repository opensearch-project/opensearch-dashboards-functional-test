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
const fs = require('fs');
const path = require('path');

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  if (config.env.DELETE_SUCCESS_VIDEOS) {
    // remove video if all spec pass to save
    on('after:spec', (spec, results) => {
      if (results && results.video) {
        // Check for test failures in any retry attempts
        const failures = results.tests.some((test) =>
          test.attempts.some((attempt) => attempt.state === 'failed')
        );

        if (!failures) {
          // Delete the video if the spec passed and no tests were retried
          const videoPath = path.join(config.videosFolder, results.video);
          fs.unlink(videoPath, (err) => {
            if (err) {
              console.error('Failed to delete video:', err);
            } else {
              console.log('Deleted video:', videoPath);
            }
          });
        }
      }
    });
  }
};
