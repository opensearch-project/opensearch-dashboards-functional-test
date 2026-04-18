/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const { defineConfig } = require('cypress');

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
  env: {
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
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 0,
    setupNodeEvents(on, config) {
      // Configure Chromium browser launch options for memory optimization
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--js-flags=--max-old-space-size=4096');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--disable-gpu-compositing');
          launchOptions.args.push('--disable-software-rasterizer');
          launchOptions.args.push('--use-gl=disabled');
          launchOptions.args.push('--use-angle=disabled');
          launchOptions.args.push('--disable-vulkan');
          launchOptions.args.push('--in-process-gpu');
          launchOptions.args.push(
            '--disable-features=IsolateOrigins,site-per-process,Vulkan,VulkanFromANGLE,UseSkiaRenderer'
          );

          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-setuid-sandbox');

          launchOptions.args.push('--disable-renderer-backgrounding');
          launchOptions.args.push('--disable-background-timer-throttling');
          launchOptions.args.push('--disable-backgrounding-occluded-windows');
        }
        return launchOptions;
      });

      try {
        const result = require('./cypress/plugins/index.js')(on, config);
        return result || config;
      } catch (e) {
        return config;
      }
    },
    baseUrl: 'http://localhost:5601',
    excludeSpecPattern: ['*.hot-update.js'],
  },
});
