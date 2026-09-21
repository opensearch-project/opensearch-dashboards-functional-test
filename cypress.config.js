/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const { defineConfig } = require('cypress');

// CYPRESS_-prefixed variables that configure the Cypress binary or its installer
// rather than carrying a test value. They are skipped when folding the
// environment into `expose`.
const RESERVED_CYPRESS_VARS = [
  'CYPRESS_CACHE_FOLDER',
  'CYPRESS_CONFIG_ENV',
  'CYPRESS_CRASH_REPORTS',
  'CYPRESS_DOWNLOAD_MIRROR',
  'CYPRESS_DOWNLOAD_PATH_TEMPLATE',
  'CYPRESS_DOWNLOAD_USE_CA',
  'CYPRESS_INSTALL_BINARY',
  'CYPRESS_INTERNAL_ENV',
  'CYPRESS_RECORD_KEY',
  'CYPRESS_RUN_BINARY',
  'CYPRESS_SKIP_BINARY_INSTALL',
  'CYPRESS_SKIP_VERIFY',
  'CYPRESS_VERIFY_TIMEOUT',
];

/**
 * Collect CYPRESS_<KEY>=value process variables as { <KEY>: value }.
 *
 * Cypress 16 removed Cypress.env(). Its synchronous replacement,
 * Cypress.expose(), reads only the `expose` config block and the --expose CLI
 * flag; CYPRESS_-prefixed process variables now reach the async cy.env() alone.
 * This repository's workflows, and the plugin repositories that pass their own
 * test command into its reusable workflows, set feature flags as
 * CYPRESS_<KEY>=value, so those values are folded back into `expose` to keep
 * every existing invocation working unchanged.
 */
function exposeFromProcessEnv() {
  return Object.entries(process.env).reduce((exposed, [name, value]) => {
    if (name.startsWith('CYPRESS_') && !RESERVED_CYPRESS_VARS.includes(name)) {
      exposed[name.slice('CYPRESS_'.length)] = value;
    }
    return exposed;
  }, {});
}

module.exports = defineConfig({
  chromeWebSecurity: false,
  defaultCommandTimeout: 60000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  video: true,
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  viewportWidth: 2000,
  viewportHeight: 1320,
  expose: {
    openSearchUrl: 'http://localhost:9200',
    remoteDataSourceNoAuthUrl: 'http://localhost:9201',
    remoteDataSourceBasicAuthUrl: 'https://localhost:9202',
    remoteDataSourceBasicAuthUsername: 'admin',
    remoteDataSourceBasicAuthPassword: 'myStrongPassword123!',
    SECURITY_ENABLED: false,
    AGGREGATION_VIEW: false,
    MULTITENANCY_ENABLED: true,
    username: 'admin',
    password: 'myStrongPassword123!',
    ENDPOINT_WITH_PROXY: false,
    MANAGED_SERVICE_ENDPOINT: false,
    VISBUILDER_ENABLED: true,
    DATASOURCE_MANAGEMENT_ENABLED: false,
    BANNER_ENABLED: false,
    ML_COMMONS_DASHBOARDS_ENABLED: true,
    WAIT_FOR_LOADER_BUFFER_MS: 0,
    DASHBOARDS_ASSISTANT_ENABLED: false,
    WORKSPACE_ENABLED: false,
    SAVED_OBJECTS_PERMISSION_ENABLED: false,
    DASHBOARDS_INVESTIGATION_ENABLED: true,
    DISABLE_LOCAL_CLUSTER: false,
    SECURITY_CERT_PATH: 'cypress/resources/kirk.pem',
    SECURITY_KEY_PATH: 'cypress/resources/kirk-key.pem',
    browserPermissions: {
      clipboard: 'allow',
    },
    UIMETRIC_ENABLED: false,
  },
  clientCertificates: [
    {
      url: 'https://localhost:9200/.opendistro-ism*',
      ca: ['cypress/resources/root-ca.pem'],
      certs: [
        {
          cert: 'cypress/resources/kirk.pem',
          key: 'cypress/resources/kirk-key.pem',
          passphrase: '',
        },
      ],
    },
    {
      url: 'https://localhost:9200/.opendistro-ism-config/_update_by_query/',
      ca: ['cypress/resources/root-ca.pem'],
      certs: [
        {
          cert: 'cypress/resources/kirk.pem',
          key: 'cypress/resources/kirk-key.pem',
          passphrase: '',
        },
      ],
    },
  ],
  e2e: {
    testIsolation: false,
    specPattern: 'cypress/integration/**/*.{js,jsx,ts,tsx,json}',
    supportFile: 'cypress/support/index.js',
    numTestsKeptInMemory: 0,
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--js-flags=--max-old-space-size=4096');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--use-gl=swiftshader');
          launchOptions.args.push(
            '--disable-features=IsolateOrigins,site-per-process,Vulkan,VulkanFromANGLE,UseSkiaRenderer'
          );

          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-dev-shm-usage');

          launchOptions.args.push('--disable-renderer-backgrounding');
          launchOptions.args.push('--disable-background-timer-throttling');
          launchOptions.args.push('--disable-backgrounding-occluded-windows');
        }
        return launchOptions;
      });

      let resolvedConfig = config;
      try {
        resolvedConfig =
          require('./cypress/plugins/index.js')(on, config) || config;
      } catch (e) {
        resolvedConfig = config;
      }

      resolvedConfig.expose = {
        ...resolvedConfig.expose,
        ...exposeFromProcessEnv(),
      };
      return resolvedConfig;
    },
    baseUrl: 'http://localhost:5601',
    excludeSpecPattern: ['*.hot-update.js'],
  },
});
