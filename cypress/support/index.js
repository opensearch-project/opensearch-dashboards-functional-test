/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
import '../utils/dashboards/commands';
import '../utils/dashboards/datasource-management-dashboards-plugin/commands';
import '../utils/plugins/index-management-dashboards-plugin/commands';
import '../utils/plugins/anomaly-detection-dashboards-plugin/commands';
import '../utils/plugins/security/commands';
import '../utils/plugins/security-dashboards-plugin/commands';
import '../utils/plugins/alerting-dashboards-plugin/commands';
import '../utils/plugins/ml-commons-dashboards/commands';
import '../utils/plugins/security-analytics-dashboards-plugin/commands';
import '../utils/plugins/notifications-dashboards/commands';

import 'cypress-real-events';

// Alternatively you can use CommonJS syntax:
// require('./commands')

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on('uncaught:exception', (err) => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false;
  }
});

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
