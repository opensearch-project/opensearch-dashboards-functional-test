/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_GET_DETECTORS_NODE_API_PATH,
  AD_GET_INDICES_NODE_API_PATH,
} from '../utils/constants';

const ADMIN_AUTH = {
  username: 'admin',
  password: 'admin',
};

/**
 * This overwrites the default visit command to authenticate before visiting
 * webpages if SECURITY_ENABLED cypress env var is true
 */
Cypress.Commands.overwrite('visit', (orig, url, options) => {
  if (Cypress.env('SECURITY_ENABLED')) {
    let newOptions = options;
    if (options) {
      newOptions['auth'] = ADMIN_AUTH;
    } else {
      newOptions = {
        auth: ADMIN_AUTH,
      };
    }
    orig(url, newOptions);
  } else {
    orig(url, options);
  }
});

/**
 * Overwite request command to support authentication similar to visit
 */
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  let defaults = {};
  if (Cypress.env('SECURITY_ENABLED')) {
    defaults.auth = ADMIN_AUTH;
  }

  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = Object.assign({}, args[0]);
  } else if (args.length === 1) {
    [options.url] = args;
  } else if (args.length === 2) {
    [options.method, options.url] = args;
  } else if (args.length === 3) {
    [options.method, options.url, options.body] = args;
  }

  return originalFn(Object.assign({}, defaults, options));
});


/**
 *****************************
 AD PLUGIN COMMANDS
 *****************************
 */
Cypress.Commands.add(
  'mockGetDetectorOnAction',
  function (fixtureFileName, funcMockedOn) {
    cy.route2(AD_GET_DETECTORS_NODE_API_PATH, {
      fixture: fixtureFileName,
    }).as('getDetectors');

    funcMockedOn();

    cy.wait('@getDetectors');
  }
);

Cypress.Commands.add(
  'mockSearchIndexOnAction',
  function (fixtureFileName, funcMockedOn) {
    cy.route2(buildAdApiUrl(AD_GET_INDICES_NODE_API_PATH + '*'), {
      fixture: fixtureFileName,
    }).as('getIndices');

    funcMockedOn();

    cy.wait('@getIndices');
  }
);
