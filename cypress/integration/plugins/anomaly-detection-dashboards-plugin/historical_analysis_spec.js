/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_URL } from '../../../utils/constants';

context('Historical results page', () => {
  function verifyAnomaliesInCharts() {
    // Wait for any kicked off historical analysis to finish. Relying on default
    // timeout (60s) to find an element that only shows up when the analysis is finished
    cy.getElementByTestId('detectorStateFinished').should('exist');

    // Let results load separately, since they load asynchronously. Should take <1s
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
  }

  function verifyNoAnomaliesInCharts() {
    // Wait for any kicked off historical analysis to finish. Relying on default
    // timeout (60s) to find an element that only shows up when the analysis is finished
    cy.getElementByTestId('detectorStateFinished').should('exist');

    // Let results load separately, since they load asynchronously. Should take <1s
    cy.wait(5000);

    cy.getElementByTestId('anomalyOccurrenceStat').within(() => {
      cy.get('.euiTitle--small')
        .invoke('text')
        .then((anomalyOccurrenceCount) => {
          cy.log('Num anomaly occurrences: ' + anomalyOccurrenceCount);
          expect(parseInt(anomalyOccurrenceCount)).to.equal(0);
        });
    });
    cy.getElementByTestId('anomalyOccurrencesHeader').should('contain', '(0)');
  }

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
    cy.getElementByTestId('actionsButton').click();
    cy.getElementByTestId('deleteDetectorItem').click();
    cy.getElementByTestId('typeDeleteField').type('delete', { force: true });
    cy.getElementByTestId('confirmButton').click();
    cy.deleteAllIndices();
  });

  context('Sample detector', () => {
    it('Empty message with modal', () => {
      cy.getElementByTestId('emptyHistoricalAnalysisMessage').should('exist');
      cy.getElementByTestId('runHistoricalAnalysisButton').click();
      cy.getElementByTestId('historicalAnalysisModalHeader').should('exist');
      cy.getElementByTestId('cancelButton').click();
      cy.getElementByTestId('historicalAnalysisModalHeader').should(
        'not.exist'
      );
      cy.getElementByTestId('emptyHistoricalAnalysisMessage').should('exist');
      cy.getElementByTestId('historicalAnalysisHeader').should('not.exist');
    });

    it('Start first historical analysis', () => {
      cy.getElementByTestId('runHistoricalAnalysisButton').click();
      cy.getElementByTestId('historicalAnalysisModalHeader').should('exist');
      cy.getElementByTestId('confirmButton').click();

      cy.getElementByTestId('emptyHistoricalAnalysisMessage').should(
        'not.exist'
      );
      cy.getElementByTestId('historicalAnalysisModalHeader').should(
        'not.exist'
      );
      cy.getElementByTestId('detectorStateInitializing').should('exist');
      cy.getElementByTestId('historicalAnalysisTitle').should('exist');
    });

    // Choosing the default of 30 days with the sample detector data (which contains 7 days historical data)
    // should produce 4+ anomalies
    it('Produces anomaly results by default', () => {
      cy.wait(10000);
      verifyAnomaliesInCharts();
    });

    it('Filtering by date range', () => {
      cy.getElementByTestId('superDatePickerToggleQuickMenuButton').click();
      cy.get(`[aria-label="Next time window"]`).click();
      cy.contains('Refresh').click();
      verifyNoAnomaliesInCharts();
      
      cy.getElementByTestId('superDatePickerToggleQuickMenuButton').click();
      cy.get(`[aria-label="Previous time window"]`).click();
      cy.contains('Refresh').click();
      verifyAnomaliesInCharts();
    });

    it('Aggregations render anomalies', () => {
      cy.contains('Refresh').click();
      cy.wait(2000);
      cy.get(`[title="Daily max"]`).click();
      verifyAnomaliesInCharts();
      cy.get(`[title="Weekly max"]`).click();
      verifyAnomaliesInCharts();
      cy.get(`[title="Monthly max"]`).click();
      verifyAnomaliesInCharts();
    });

    it('Run subsequent historical analysis', () => {
      cy.getElementByTestId('modifyHistoricalAnalysisButton').click();
      cy.getElementByTestId('historicalAnalysisModalHeader').should('exist');
      cy.getElementByTestId('confirmButton').click();
      cy.getElementByTestId('historicalAnalysisModalHeader').should(
        'not.exist'
      );
      cy.getElementByTestId('detectorStateInitializing').should('exist');
      cy.getElementByTestId('historicalAnalysisTitle').should('exist');

      cy.wait(10000);
      verifyAnomaliesInCharts();
    });
  });
});
