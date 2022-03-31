/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_NODE_API_PATH,
  getADStartDetectorNodeApiPath,
  getADStopDetectorNodeApiPath,
  getADDeleteDetectorNodeApiPath,
  getADStopDetectorApiPath,
  getADGetDetectorApiPath,
} from '../../constants';

Cypress.Commands.add(
  'mockGetDetectorOnAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(AD_NODE_API_PATH.GET_DETECTORS, {
      fixture: fixtureFileName,
    }).as('getDetectors');

    funcMockedOn();

    cy.wait('@getDetectors');
  }
);

Cypress.Commands.add(
  'mockGetDetectorsAndIndicesOnAction',
  function (detectorsFixtureFileName, indexFixtureFileName, funcMockedOn) {
    cy.intercept(AD_NODE_API_PATH.GET_DETECTORS, {
      fixture: detectorsFixtureFileName,
    }).as('getDetectors');

    cy.intercept(AD_NODE_API_PATH.GET_INDICES, {
      fixture: indexFixtureFileName,
    }).as('getIndices');

    funcMockedOn();

    cy.wait('@getDetectors');
    cy.wait('@getIndices');
  }
);

Cypress.Commands.add(
  'mockSearchIndexOnAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(AD_NODE_API_PATH.GET_INDICES, {
      fixture: fixtureFileName,
    }).as('getIndices');

    funcMockedOn();

    cy.wait('@getIndices');
  }
);

Cypress.Commands.add(
  'mockStartDetectorOnAction',
  function (fixtureFileName, detectorId, funcMockedOn) {
    cy.intercept(getADStartDetectorNodeApiPath(detectorId), {
      fixture: fixtureFileName,
    }).as('startDetector');

    funcMockedOn();

    cy.wait('@startDetector');
  }
);

Cypress.Commands.add(
  'mockStopDetectorOnAction',
  function (fixtureFileName, detectorId, funcMockedOn) {
    cy.intercept(getADStopDetectorNodeApiPath(detectorId), {
      fixture: fixtureFileName,
    }).as('stopDetector');

    funcMockedOn();

    cy.wait('@stopDetector');
  }
);

Cypress.Commands.add(
  'mockDeleteDetectorOnAction',
  function (fixtureFileName, detectorId, funcMockedOn) {
    cy.intercept(getADDeleteDetectorNodeApiPath(detectorId), {
      fixture: fixtureFileName,
    }).as('deleteDetector');

    funcMockedOn();

    cy.wait('@deleteDetector');
  }
);

Cypress.Commands.add('deleteDetector', (detectorId) => {
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}/${getADGetDetectorApiPath(detectorId)}`
  );
});

Cypress.Commands.add('stopDetector', (detectorId) => {
  cy.request(
    'POST',
    `${Cypress.env('openSearchUrl')}/${getADStopDetectorApiPath(detectorId)}`
  );
});
