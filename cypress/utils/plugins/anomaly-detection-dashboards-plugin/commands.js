/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */


import {
    AD_GET_DETECTORS_NODE_API_PATH,
    AD_GET_INDICES_NODE_API_PATH, AD_GET_MAPPINGS_NODE_API_PATH,
    getADStartDetectorNodeApiPath, getADStopDetectorNodeApiPath
} from "../../constants";

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
        cy.route2(AD_GET_DETECTORS_NODE_API_PATH, {fixture: fixtureFileName}).as(
            'createDetector'
        );

        funcMockedOn();

        cy.wait('@createDetector');
    }
);
