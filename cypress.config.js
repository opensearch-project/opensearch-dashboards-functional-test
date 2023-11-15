/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    defaultCommandTimeout: 60000,
    requestTimeout: 60000,
    responseTimeout: 60000,
    baseUrl: 'http://localhost:5601',
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      configFile: 'reporter-config.json',
    },
    viewportWidth: 2000,
    viewportHeight: 1320,
    supportFile: 'cypress/support/index.js',
    specPattern: 'cypress/integration/**/*',
    env: {
      openSearchUrl: 'http://localhost:9200',
      SECURITY_ENABLED: false,
      AGGREGATION_VIEW: false,
      username: 'admin',
      password: 'admin',
      ENDPOINT_WITH_PROXY: false,
      MANAGED_SERVICE_ENDPOINT: false,
      VISBUILDER_ENABLED: true,
      DATASOURCE_MANAGEMENT_ENABLED: false,
      ML_COMMONS_DASHBOARDS_ENABLED: true,
      WAIT_FOR_LOADER_BUFFER_MS: 0,
      NO_COMMAND_LOG: 1,
    },
  },
});
