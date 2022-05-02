// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import '../utils/commands';
import '../utils/plugins/index-management-dashboards-plugin/commands';
import '../utils/plugins/anomaly-detection-dashboards-plugin/commands';
import '../utils/plugins/security/commands';
import '../utils/plugins/alerting-dashboards-plugin/commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// returning false here prevents Cypress from failing the test
Cypress.on(
  'uncaught:exception',
  (err) =>
    !err.message.includes('ResizeObserver loop limit exceeded') &&
    !err.message.includes(
      'Invalid attempt to destructure non-iterable instance'
    ) &&
    !err.message.includes('Converting circular structure to JSON')
);

// Proxy layer of OpenSearch domain may redirect to login page
//  if you haven't authenticate
if (Cypress.env('ENDPOINT_WITH_PROXY')) {
  Cypress.Cookies.debug(false);
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('security_authentication');
  });
}
