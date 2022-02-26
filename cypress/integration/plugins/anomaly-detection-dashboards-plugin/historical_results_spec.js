/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_URL } from '../../../utils/constants';

context('Historical results page', () => {
  // Creating a sample detector and visiting the config page
  before(() => {
    cy.server();
    cy.visit(AD_URL.OVERVIEW);
    cy.getElementByTestId('createHttpSampleDetectorButton').click();
    cy.visit(AD_URL.OVERVIEW);
    cy.getElementByTestId('viewSampleDetectorLink').click();
    cy.getElementByTestId('historicalTab').click();
  });

  // Clean up resources
  after(() => {
    cy.getElementByTestId('configurationsTab').click();
    cy.getElementByTestId('detectorIdCell').within(() => {
      cy.get('.euiText--medium')
        .invoke('text')
        .then((detectorId) => {
          cy.log('Deleting detector with ID: ' + detectorId);
          cy.stopDetector(detectorId);
          cy.deleteDetector(detectorId);
        });
    });
    cy.deleteAllIndices();
  });

  it('No historical runs - modal works as expected', () => {
    cy.getElementByTestId('runHistoricalAnalysisButton').click();
    cy.getElementByTestId('historicalAnalysisModalHeader').should('exist');
    cy.getElementByTestId('cancelButton').click();
    cy.getElementByTestId('historicalAnalysisModalHeader').should('not.exist');
    cy.getElementByTestId('emptyHistoricalAnalysisMessage').should('exist');
    cy.getElementByTestId('historicalAnalysisHeader').should('not.exist');
  });

  it('Start historical analysis for first time with sample detector', () => {
    cy.getElementByTestId('runHistoricalAnalysisButton').click();
    cy.getElementByTestId('historicalAnalysisModalHeader').should('exist');
    cy.getElementByTestId('confirmButton').click();

    cy.getElementByTestId('emptyHistoricalAnalysisMessage').should('not.exist');
    cy.getElementByTestId('historicalAnalysisModalHeader').should('not.exist');
    cy.getElementByTestId('historicalAnalysisTitle').should('exist');
  });

  it('Sample detector produces anomaly results', () => {
    // Wait for the analysis from the previous test to finish. Should take <10s, so relying on default
    // timeout to find an element that only shows up when the analysis is finished
    cy.getElementByTestId('detectorStateFinished').should('exist');

    // Let results load. Should take <5s
    cy.wait(5000);

    cy.getElementByTestId('anomalyOccurrenceStat').within(() => {
      cy.get('.euiTitle--small')
        .invoke('text')
        .then((anomalyOccurrenceCount) => {
          cy.log('Num anomaly occurrences: ' + anomalyOccurrenceCount);
          expect(parseInt(anomalyOccurrenceCount)).to.be.gte(1);
        });
    });
    cy.getElementByTestId('anomalyOccurrencesHeader').should(
      'not.contain',
      '(0)'
    );
  });
});
