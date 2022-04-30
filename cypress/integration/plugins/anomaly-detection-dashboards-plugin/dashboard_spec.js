/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_FIXTURE_BASE_PATH, AD_URL } from '../../../utils/constants';
import { selectTopItemFromFilter } from '../../../utils/helpers';

// Contains basic sanity tests on AD Dashboards page
describe('AD Dashboard page', () => {
  before(() => {});

  it('Empty - no detector index', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'no_detector_index_response.json',
      () => {
        cy.visit(AD_URL.DASHBOARD);
      }
    );
    cy.getElementByTestId('emptyDashboardHeader').should('exist');
    cy.getElementByTestId('dashboardLiveAnomaliesHeader').should('not.exist');
  });

  it('Empty - empty detector index', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'empty_detector_index_response.json',
      () => {
        cy.visit(AD_URL.DASHBOARD);
      }
    );
    cy.getElementByTestId('emptyDashboardHeader').should('exist');
    cy.getElementByTestId('dashboardLiveAnomaliesHeader').should('not.exist');
  });

  it('Non-empty - single running detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_running_detector_response.json',
      () => {
        cy.visit(AD_URL.DASHBOARD);
      }
    );

    cy.getElementByTestId('emptyDashboardHeader').should('not.exist');
    cy.getElementByTestId('dashboardLiveAnomaliesHeader').should('exist');
    cy.getElementByTestId('dashboardDetectorTable').should('exist');
    cy.getElementByTestId('dashboardSunburstChartHeader').should('exist');
    cy.getElementByTestId('dashboardDetectorTable').contains(
      'running-detector'
    );
  });

  it('Redirect to create detector page', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'no_detector_index_response.json',
      () => {
        cy.visit(AD_URL.DASHBOARD);
      }
    );

    cy.mockSearchIndexOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_index_response.json',
      () => {
        cy.getElementByTestId('createDetectorButton').click();
      }
    );

    cy.getElementByTestId('defineOrEditDetectorTitle').should('exist');
  });

  it('Filter by detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(AD_URL.DASHBOARD);
      }
    );

    cy.contains('stopped-detector');
    cy.contains('running-detector');

    selectTopItemFromFilter('detectorFilter');

    cy.contains('feature-required-detector'); // first one in the list returned by multiple_detectors_response.json
    cy.contains('stopped-detector').should('not.exist');
    cy.contains('running-detector').should('not.exist');
  });

  it('Filter by detector state', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(AD_URL.DASHBOARD);
      }
    );

    cy.contains('stopped-detector');
    cy.contains('running-detector');

    selectTopItemFromFilter('detectorStateFilter');

    cy.contains('stopped-detector'); // because stopped is the first item in the detector state dropdown
    cy.contains('running-detector').should('not.exist');
  });

  it('Filter by index', () => {
    cy.mockGetDetectorsAndIndicesOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_index_response.json',
      () => {
        cy.visit(AD_URL.DASHBOARD);
      }
    );

    cy.contains('feature-required-detector');
    cy.contains('stopped-detector');
    cy.contains('running-detector');

    selectTopItemFromFilter('indicesFilter');

    cy.contains('feature-required-detector'); // because feature-required is the first index returned in the fixture
    cy.contains('running-detector').should('not.exist');
    cy.contains('stopped-detector').should('not.exist');
  });

  it('Enter and exit full screen', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(AD_URL.DASHBOARD);
      }
    );

    cy.contains('View full screen');
    cy.contains('Exit full screen').should('not.exist');
    cy.getElementByTestId('dashboardFullScreenButton').click();
    cy.contains('View full screen').should('not.exist');
    cy.contains('Exit full screen');
    cy.getElementByTestId('dashboardFullScreenButton').click();
    cy.contains('View full screen');
    cy.contains('Exit full screen').should('not.exist');
  });
});
