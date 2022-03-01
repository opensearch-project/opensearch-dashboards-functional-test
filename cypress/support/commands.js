/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_GET_DETECTORS_NODE_API_PATH,
  AD_GET_INDICES_NODE_API_PATH,
  getADStartDetectorNodeApiPath,
  getADStopDetectorNodeApiPath,
  AD_GET_MAPPINGS_NODE_API_PATH,
  SEC_API_AUTHINFO_PATH,
  SEC_API_CONFIG_PATH,
  SEC_API_ROLES_PATH,
  SEC_API_ROLES_VIEW_PATH,
  SEC_API_INTERNAL_USERS_PATH,
  SEC_API_INTERNAL_USERS_CREATE_PATH,
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
    newOptions.qs = { security_tenant: 'private' };
    orig(url, newOptions);
  } else {
    orig(url, options);
  }
});

/**
 * Overwite request command to support authentication similar to visit.
 * The request function parameters can be url, or (method, url), or (method, url, body).
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
    cy.route2(AD_GET_INDICES_NODE_API_PATH, {
      fixture: fixtureFileName,
    }).as('getIndices');

    funcMockedOn();

    cy.wait('@getIndices');
  }
);

Cypress.Commands.add(
  'mockStartDetectorOnAction',
  function (fixtureFileName, detectorId, funcMockedOn) {
    cy.server();
    cy.route2(getADStartDetectorNodeApiPath(detectorId), {
      fixture: fixtureFileName,
    }).as('startDetector');

    funcMockedOn();

    cy.wait('@startDetector');
  }
);

Cypress.Commands.add(
  'mockStopDetectorOnAction',
  function (fixtureFileName, detectorId, funcMockedOn) {
    cy.server();
    cy.route2(getADStopDetectorNodeApiPath(detectorId), {
      fixture: fixtureFileName,
    }).as('stopDetector');

    funcMockedOn();

    cy.wait('@stopDetector');
  }
);

Cypress.Commands.add(
  'mockGetIndexMappingsOnAction',
  function (fixtureFileName, funcMockedOn) {
    cy.server();
    cy.route2(AD_GET_MAPPINGS_NODE_API_PATH, {
      fixture: fixtureFileName,
    }).as('getMappings');

    funcMockedOn();

    cy.wait('@getMappings');
  }
);

Cypress.Commands.add(
  'mockCreateDetectorOnAction',
  function (fixtureFileName, funcMockedOn) {
    cy.server();
    cy.route2(AD_GET_DETECTORS_NODE_API_PATH, { fixture: fixtureFileName }).as(
      'createDetector'
    );

    funcMockedOn();

    cy.wait('@createDetector');
  }
);


/**
 *****************************
 SECURITY PLUGIN COMMANDS
 *****************************
 */
Cypress.Commands.add(
  'mockAuthAction',
  function (fixtureFileName, funcMockedOn) {
    cy.route2(SEC_API_CONFIG_PATH, {
      fixture: fixtureFileName,
    }).as('getAuthDetails');

    funcMockedOn();

    cy.wait('@getAuthDetails');
  }
);

Cypress.Commands.add(
  'mockRolesAction',
  function (fixtureFileName, funcMockedOn) {
    cy.route2(SEC_API_ROLES_PATH, {
      fixture: fixtureFileName,
    }).as('getRoleDetails');

    funcMockedOn();

    cy.wait('@getRoleDetails');
  }
);

Cypress.Commands.add(
  'mockInternalUsersAction',
  function (fixtureFileName, funcMockedOn) {
    cy.route2(SEC_API_INTERNAL_USERS_PATH, {
      fixture: fixtureFileName,
    }, ).as('getInternalUsersDetails');

    funcMockedOn();

    cy.wait('@getInternalUsersDetails');
  }
);
