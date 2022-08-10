/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_URL } from '../../../utils/constants';

context('Real-time results page', () => {
  // Creating a sample detector and visiting the config page
  before(() => {
    cy.visit(AD_URL.OVERVIEW);
    cy.getElementByTestId('createHttpSampleDetectorButton').click();
    cy.visit(AD_URL.OVERVIEW);
    cy.getElementByTestId('viewSampleDetectorLink').click();
    cy.getElementByTestId('resultsTab').click();
  });

  // Clean up resources
  after(() => {
    cy.getElementByTestId('actionsButton').click();
    cy.getElementByTestId('deleteDetectorItem').click();
    cy.getElementByTestId('typeDeleteField').type('delete', { force: true });
    cy.getElementByTestId('confirmButton').click();
    cy.deleteAllIndices();
  });

  context('Sample detector', () => {
    // it('Start and stop detector from button', () => {
    //   // Sample detector will default to initializing upon creation
    //   cy.getElementByTestId('detectorStateInitializing').should('exist');
    //   cy.getElementByTestId('stopAndStartDetectorButton').click();
    //   cy.getElementByTestId('detectorStateStopped').should('exist');
    //   cy.getElementByTestId('stopAndStartDetectorButton').click();
    //   cy.getElementByTestId('detectorStateInitializing').should('exist');
    // });

    it('Renders no anomalies', () => {
      cy.getElementByTestId('anomalyOccurrenceTab').click();
      cy.getElementByTestId('noAnomaliesMessage').should('exist');
      cy.getElementByTestId('anomalyOccurrencesHeader').should(
        'contain',
        '(0)'
      );
      cy.getElementByTestId('featureNameHeader').should('not.exist');

      cy.getElementByTestId('featureBreakdownTab').click();

      cy.getElementByTestId('noAnomaliesMessage').should('not.exist');
      cy.getElementByTestId('featureNameHeader').should('exist');
      cy.getElementByTestId('featureNameHeader').should(
        'have.length.be.gte',
        1
      );
    });

    it('Enter and exit full screen', () => {
      cy.contains('View full screen');
      cy.contains('Exit full screen').should('not.exist');
      cy.getElementByTestId('anomalyResultsFullScreenButton').click();
      cy.contains('View full screen').should('not.exist');
      cy.contains('Exit full screen');
      cy.getElementByTestId('anomalyResultsFullScreenButton').click();
      cy.contains('View full screen');
      cy.contains('Exit full screen').should('not.exist');
    });
  });
});
