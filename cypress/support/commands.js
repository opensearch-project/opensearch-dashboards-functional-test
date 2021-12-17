/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_GET_DETECTORS_NODE_API_PATH,
  AD_GET_INDICES_NODE_API_PATH,
} from "../utils/constants";

/**
 * This overwrites the default visit command to authenticate before visiting
 * webpages if SECURITY_ENABLED cypress env var is true
 */
Cypress.Commands.overwrite("visit", (orig, url, options) => {
  if (Cypress.env("SECURITY_ENABLED")) {
    let newOptions = options;
    if (options) {
      newOptions["auth"] = {
        username: "admin",
        password: "admin",
      };
    } else {
      newOptions = {
        auth: {
          username: "admin",
          password: "admin",
        },
      };
    }
    orig(url, newOptions);
  } else {
    orig(url, options);
  }
});

/**
 *****************************
 AD PLUGIN COMMANDS
 *****************************
 */
Cypress.Commands.add("mockGetDetectorOnAction", function (
  fixtureFileName,
  funcMockedOn
) {
  cy.route2(AD_GET_DETECTORS_NODE_API_PATH, {
    fixture: fixtureFileName,
  }).as("getDetectors");

  funcMockedOn();

  cy.wait("@getDetectors");
});

Cypress.Commands.add("mockSearchIndexOnAction", function (
  fixtureFileName,
  funcMockedOn
) {
  cy.route2(buildAdApiUrl(AD_GET_INDICES_NODE_API_PATH + "*"), {
    fixture: fixtureFileName,
  }).as("getIndices");

  funcMockedOn();

  cy.wait("@getIndices");
});
