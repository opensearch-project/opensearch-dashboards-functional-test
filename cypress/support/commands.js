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
  IM_API, IM_CONFIG_INDEX
} from '../utils/constants';

const ADMIN_AUTH = {
  username: Cypress.env("username"),
  password: Cypress.env("password"),
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
 * Overwrite request command to support authentication similar to visit.
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
 IM PLUGIN COMMANDS
 *****************************
 */
Cypress.Commands.add("deleteAllIndices", () => {
    cy.request("DELETE", `${Cypress.env("openSearchUrl")}/index*,sample*,opensearch_dashboards*`);
    cy.request("DELETE", `${Cypress.env("openSearchUrl")}/.opendistro-ism*?expand_wildcards=all`);
});

Cypress.Commands.add("createPolicy", (policyId, policyJSON) => {
    cy.request("PUT", `${Cypress.env("openSearchUrl")}${IM_API.POLICY_BASE}/${policyId}`, policyJSON);
});

Cypress.Commands.add("getIndexSettings", (index) => {
    cy.request("GET", `${Cypress.env("openSearchUrl")}/${index}/_settings`);
});

Cypress.Commands.add("updateIndexSettings", (index, settings) => {
    cy.request("PUT", `${Cypress.env("openSearchUrl")}/${index}/_settings`, settings);
});

Cypress.Commands.add("updateManagedIndexConfigStartTime", (index) => {
    // Creating closure over startTime so it's not calculated until actual update_by_query call
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000).then(() => {
        const FIVE_MINUTES_MILLIS = 5 * 60 * 1000; // Default ISM job interval
        const THREE_SECONDS_MILLIS = 3000; // Subtract 3 seconds to account for buffer of updating doc, descheduling, rescheduling
        const startTime = new Date().getTime() - (FIVE_MINUTES_MILLIS - THREE_SECONDS_MILLIS);
        const body = {
            query: { term: { "managed_index.index": index } },
            script: {
                lang: "painless",
                source: `ctx._source['managed_index']['schedule']['interval']['start_time'] = ${startTime}L`,
            },
        };
        cy.request("POST", `${Cypress.env("openSearchUrl")}/${IM_CONFIG_INDEX.OPENDISTRO_ISM_CONFIG}/_update_by_query`, body);
    });
});

Cypress.Commands.add("createIndex", (index, policyID = null, settings = {}) => {
    cy.request("PUT", `${Cypress.env("openSearchUrl")}/${index}`, settings);
    if (policyID != null) {
        const body = { policy_id: policyID };
        cy.request("POST", `${Cypress.env("openSearchUrl")}${IM_API.ADD_POLICY_BASE}/${index}`, body);
    }
});

Cypress.Commands.add("createRollup", (rollupId, rollupJSON) => {
    cy.request("PUT", `${Cypress.env("openSearchUrl")}${IM_API.ROLLUP_JOBS_BASE}/${rollupId}`, rollupJSON);
});

Cypress.Commands.add("createIndexTemplate", (name, template) => {
    cy.request("PUT", `${Cypress.env("openSearchUrl")}${IM_API.INDEX_TEMPLATE_BASE}/${name}`, template);
});

Cypress.Commands.add("createDataStream", (name) => {
    cy.request("PUT", `${Cypress.env("openSearchUrl")}${IM_API.DATA_STREAM_BASE}/${name}`);
});

Cypress.Commands.add("deleteDataStreams", (names) => {
    cy.request("DELETE", `${Cypress.env("openSearchUrl")}${IM_API.DATA_STREAM_BASE}/${names}`);
});

Cypress.Commands.add("rollover", (target) => {
    cy.request("POST", `${Cypress.env("openSearchUrl")}/${target}/_rollover`);
});

Cypress.Commands.add("createTransform", (transformId, transformJSON) => {
    cy.request("PUT", `${Cypress.env("openSearchUrl")}${IM_API.TRANSFORM_JOBS_BASE}/${transformId}`, transformJSON);
});

Cypress.Commands.add("disableJitter", () => {
    // Sets the jitter to 0 in the ISM plugin cluster settings
    const jitterJson = {
        persistent: {
            plugins: {
                index_state_management: {
                    jitter: "0.0",
                },
            },
        },
    };
    cy.request("PUT", `${Cypress.env("openSearchUrl")}/_cluster/settings`, jitterJson);
});

