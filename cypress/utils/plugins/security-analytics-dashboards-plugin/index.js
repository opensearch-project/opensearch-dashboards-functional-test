/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Import commands.js using ES2015 syntax:
import './commands';
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

// Switch the base URL of Opensearch when security enabled in the cluster
// Not doing this for Dashboards because it can still use http when security enabled
if (Cypress.env('SECURITY_ENABLED')) {
  Cypress.env('opensearch', `https://${Cypress.env('openSearchUrl')}`);
} else {
  Cypress.env('opensearch', `http://${Cypress.env('openSearchUrl')}`);
}
