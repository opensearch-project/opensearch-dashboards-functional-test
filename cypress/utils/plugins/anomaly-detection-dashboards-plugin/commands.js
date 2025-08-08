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
  getForecastStopForecasterNodeApiPath,
  FORECAST_NODE_API_PATH,
} from '../../constants';
import { selectTopItemFromFilter } from './helpers';

Cypress.Commands.add(
  'handleTenantDialog',
  {
    prevSubject: 'optional',
  },
  () => {
    // Handles the optional "Select your tenant" pop-up
    cy.get('body').then(($body) => {
      // We look for an element containing "Select your tenant" to avoid being
      // specific about which tag (e.g. h1, h2) is used for the title.
      if ($body.find(':contains("Select your tenant")').length > 0) {
        const confirmButton = $body.find('button:contains("Confirm")');
        if (confirmButton.length) {
          cy.wrap(confirmButton.first()).click();
        }
      }
    });
  }
);

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

/**
 * Custom command to perform the full forecaster creation flow
 * from the 'Define forecaster' step onwards.
 * @param {object} forecasterDetails - The details for the new forecaster.
 * @param {string} forecasterDetails.name - The name of the forecaster.
 * @param {string} forecasterDetails.index - The source index.
 * @param {string} forecasterDetails.timestampField - The timestamp field name.
 * @param {boolean} [forecasterDetails.categoricalField=false] - Whether to use a categorical field.
 * @param {string} forecasterDetails.featureField - The field to forecast.
 * @param {boolean} [forecasterDetails.test=false] - Whether to create and test the forecaster.
 * @param {number} [forecasterDetails.interval=0] - The interval of the forecaster.
 */
Cypress.Commands.add('createForecaster', (forecasterDetails) => {
  const {
    name,
    index,
    timestampField,
    featureField,
    categoricalField = false,
    test = false,
    interval = 0,
  } = forecasterDetails;

  cy.getElementByTestId('defineOrEditForecasterTitle').should('exist');
  cy.getElementByTestId('forecasterNameTextInput').type(name);
  cy.getElementByTestId('indicesFilter').type(`${index}{enter}`);

  // Type the timestamp field directly
  cy.getElementByTestId('timestampFilter').type(`${timestampField}{enter}`);

  // Type the feature field name and then the field to forecast
  cy.getElementByTestId('featureNameTextInput-0').type(featureField);
  cy.getElementByTestId('featureFieldTextInput-0').type(
    `${featureField}{enter}`
  );

  if (categoricalField) {
    // Wait for the checkbox to be visible and enabled before clicking
    cy.get('label[for="categoryFieldCheckbox"]').click();

    // Select the first item from the category field combo box
    selectTopItemFromFilter('categoryFieldComboBox', true);
  }

  // Try to click next button and handle potential validation errors
  cy.getElementByTestId('defineForecasterNextButton').click();

  cy.getElementByTestId('defineOrEditForecasterTitle').should('not.exist');
  cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
    'exist'
  );

  cy.getElementByTestId('suggestParametersButton').click();
  cy.getElementByTestId('suggestParametersDialogTitle').should('exist');
  cy.getElementByTestId('generateSuggestionsButton').click();
  cy.getElementByTestId('suggestedParametersResult').should('exist');

  cy.getElementByTestId('useSuggestedParametersButton').click();

  // The dialog should close and we're back on the model configuration page
  cy.getElementByTestId('suggestParametersDialogTitle').should('not.exist');

  if (interval > 0) {
    cy.get('input[name="interval"]').clear().type(interval);
  }

  if (test) {
    cy.getElementByTestId('createTestForecasterButton').click();
  } else {
    cy.getElementByTestId('createForecasterButton').click();
  }
});

/**
 * Custom command to delete all indices on the remote cluster.
 */
Cypress.Commands.add('deleteAllRemoteIndices', () => {
  const isSecure = Cypress.env('SECURITY_ENABLED');
  const remoteBaseUrl = isSecure
    ? Cypress.env('remoteDataSourceBasicAuthUrl')
    : Cypress.env('remoteDataSourceNoAuthUrl');

  if (!remoteBaseUrl) {
    cy.log('Remote base URL not configured, skipping remote index deletion.');
    return;
  }

  cy.request({
    method: 'DELETE',
    url: `${remoteBaseUrl}/*`,
    failOnStatusCode: false,
  }).then((response) => {
    // A 404 is also acceptable if no indices exist to be deleted.
    expect(response.status).to.be.oneOf([200, 404, 403]);
  });
});

Cypress.Commands.add(
  'mockGetForecastersOnAction',
  function (fixtureFileName, funcMockedOn) {
    cy.intercept(FORECAST_NODE_API_PATH.GET_FORECASTERS, {
      fixture: fixtureFileName,
    }).as('getForecasters');

    funcMockedOn();

    cy.wait('@getForecasters');
  }
);

Cypress.Commands.add(
  'mockStopForecasterOnAction',
  function (fixtureFileName, forecasterId, funcMockedOn) {
    cy.intercept(getForecastStopForecasterNodeApiPath(forecasterId), {
      fixture: fixtureFileName,
    }).as('stopForecaster');

    funcMockedOn();

    cy.wait('@stopForecaster');
  }
);
