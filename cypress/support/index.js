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
import '../utils/plugins/dashboards-flow-framework/commands';
import '../utils/plugins/ml-commons-dashboards/commands';
import '../utils/plugins/security-analytics-dashboards-plugin/commands';
import '../utils/plugins/notifications-dashboards/commands';
import '../utils/plugins/dashboards-assistant/commands';
import '../utils/dashboards/console/commands';
import '../utils/dashboards/workspace-plugin/commands';
import { currentBackendEndpoint } from '../utils/commands';

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

/**
 * Make setup step in here so that all the test files in dashboards-assistant
 * won't need to call these commands.
 */
if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  !Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  before(() => {
    cy.addAssistantRequiredSettings();
    cy.readOrRegisterRootAgent();
    cy.startDummyServer();
  });
  after(() => {
    cy.cleanRootAgent();
    cy.stopDummyServer();
  });
}

/**
 * Make setup step in here so that all the test with MDS files in dashboards-assistant
 * won't need to call these commands.
 */
if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  before(() => {
    const originalBackendEndpoint = currentBackendEndpoint.get();
    currentBackendEndpoint.set(currentBackendEndpoint.REMOTE_NO_AUTH);
    cy.addAssistantRequiredSettings();
    cy.readOrRegisterRootAgent();
    currentBackendEndpoint.set(originalBackendEndpoint, false);
    cy.startDummyServer();
  });
  after(() => {
    const originalBackendEndpoint = currentBackendEndpoint.get();
    currentBackendEndpoint.set(currentBackendEndpoint.REMOTE_NO_AUTH);
    cy.cleanRootAgent();
    currentBackendEndpoint.set(originalBackendEndpoint, false);
    cy.stopDummyServer();
  });
}
