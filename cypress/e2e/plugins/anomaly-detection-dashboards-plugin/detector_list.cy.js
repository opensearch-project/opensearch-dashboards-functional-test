/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_FIXTURE_BASE_PATH,
  AD_URL,
  TEST_DETECTOR_ID,
  DETECTOR_STATE,
} from '../../../utils/constants';
import { selectTopItemFromFilter } from '../../../utils/helpers';

describe('Detector list page', () => {
  before(() => {});

  it('Empty - no detector index', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'no_detector_index_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );

    cy.getElementByTestId('detectorListHeader').contains('(0)');
    cy.getElementByTestId('emptyDetectorListMessage').should('exist');
    cy.getElementByTestId('sampleDetectorButton').should('exist');
    cy.getElementByTestId('createDetectorButton').should('exist');
  });

  it('Empty - empty detector index', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'empty_detector_index_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );

    cy.getElementByTestId('detectorListHeader').contains('(0)');
    cy.getElementByTestId('emptyDetectorListMessage').should('exist');
    cy.getElementByTestId('sampleDetectorButton').should('exist');
    cy.getElementByTestId('createDetectorButton').should('exist');
  });

  it('Non-empty - single stopped detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_detector_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );

    cy.getElementByTestId('detectorListHeader').contains('(1)');
    cy.getElementByTestId('detectorListTable').contains('stopped-detector');
    cy.getElementByTestId('detectorListTable').contains(
      DETECTOR_STATE.DISABLED
    );
    cy.getElementByTestId('detectorListTable').contains(
      'stopped-detector-index'
    );
    cy.getElementByTestId('createDetectorButton').should('exist');
    cy.getElementByTestId('sampleDetectorButton').should('not.exist');
    cy.getElementByTestId('emptyDetectorListMessage').should('not.exist');
  });

  it('Non-empty - multiple detectors', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );

    cy.getElementByTestId('detectorListHeader').contains('(4)');
    cy.getElementByTestId('detectorListTable').contains('stopped-detector');
    cy.getElementByTestId('detectorListTable').contains(
      'initializing-detector'
    );
    cy.getElementByTestId('detectorListTable').contains('running-detector');
    cy.getElementByTestId('detectorListTable').contains(
      'feature-required-detector'
    );
    cy.getElementByTestId('detectorListTable').contains(
      'stopped-detector-index'
    );
    cy.getElementByTestId('detectorListTable').contains(
      'initializing-detector-index'
    );
    cy.getElementByTestId('detectorListTable').contains(
      'running-detector-index'
    );
    cy.getElementByTestId('detectorListTable').contains(
      'feature-required-detector-index'
    );
    cy.getElementByTestId('detectorListTable').contains(
      DETECTOR_STATE.DISABLED
    );
    cy.getElementByTestId('detectorListTable').contains(DETECTOR_STATE.INIT);
    cy.getElementByTestId('detectorListTable').contains(DETECTOR_STATE.RUNNING);
    cy.getElementByTestId('detectorListTable').contains(
      DETECTOR_STATE.FEATURE_REQUIRED
    );
    cy.getElementByTestId('createDetectorButton').should('exist');
    cy.getElementByTestId('sampleDetectorButton').should('not.exist');
    cy.getElementByTestId('emptyDetectorListMessage').should('not.exist');
  });

  it('Redirect to create detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_detector_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );
    cy.getElementByTestId('detectorListHeader').contains('(1)');
    cy.getElementByTestId('detectorListTable').contains('stopped-detector');
    cy.getElementByTestId('createDetectorButton').click();
    cy.getElementByTestId('defineOrEditDetectorTitle').should('exist');
  });

  it('Start single detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_detector_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );
    cy.getElementByTestId('startDetectorsModal').should('not.exist');
    cy.get('.euiTableRowCellCheckbox').find('.euiCheckbox__input').click();
    cy.getElementByTestId('listActionsButton').click();
    cy.getElementByTestId('startDetectors').click();
    cy.getElementByTestId('startDetectorsModal').should('exist');
    cy.contains('stopped-detector');
    cy.mockStartDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'start_detector_response.json',
      TEST_DETECTOR_ID,
      () => {
        cy.getElementByTestId('confirmButton').click();
      }
    );
    cy.getElementByTestId('startDetectorsModal').should('not.exist');
    cy.contains('Successfully started all selected detectors');
  });

  it('Stop single detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_running_detector_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );
    cy.getElementByTestId('stopDetectorsModal').should('not.exist');
    cy.get('.euiTableRowCellCheckbox').find('.euiCheckbox__input').click();
    cy.getElementByTestId('listActionsButton').click();
    cy.getElementByTestId('stopDetectors').click();
    cy.getElementByTestId('stopDetectorsModal').should('exist');
    cy.contains('running-detector');
    cy.mockStopDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'stop_detector_response.json',
      TEST_DETECTOR_ID,
      () => {
        cy.getElementByTestId('confirmButton').click();
      }
    );
    cy.getElementByTestId('stopDetectorsModal').should('not.exist');
    cy.contains('Successfully stopped all selected detectors');
  });

  it('Delete single detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_detector_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );
    cy.getElementByTestId('deleteDetectorsModal').should('not.exist');
    cy.get('.euiTableRowCellCheckbox').find('.euiCheckbox__input').click();
    cy.getElementByTestId('listActionsButton').click();
    cy.getElementByTestId('deleteDetectors').click();
    cy.getElementByTestId('deleteDetectorsModal').should('exist');
    cy.contains('stopped-detector');
    cy.contains('Running');
    cy.contains('No');
    cy.getElementByTestId('typeDeleteField').click().type('delete');
    cy.mockDeleteDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'delete_detector_response.json',
      TEST_DETECTOR_ID,
      () => {
        cy.getElementByTestId('confirmButton').click();
      }
    );
    cy.getElementByTestId('deleteDetectorsModal').should('not.exist');
    cy.contains('Successfully deleted all selected detectors');
  });

  it('Filter by detector search', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );

    cy.getElementByTestId('detectorListTable').contains('stopped-detector');
    cy.getElementByTestId('detectorListTable').contains('running-detector');

    cy.getElementByTestId('detectorListSearch')
      .first()
      .click()
      .type('stopped-detector');

    cy.getElementByTestId('detectorListTable').contains('stopped-detector');
    cy.getElementByTestId('detectorListTable')
      .contains('running-detector')
      .should('not.exist');
  });

  it('Filter by detector state', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );

    cy.getElementByTestId('detectorListTable').contains('stopped-detector');
    cy.getElementByTestId('detectorListTable').contains('running-detector');

    selectTopItemFromFilter('detectorStateFilter');

    cy.getElementByTestId('detectorListTable').contains('stopped-detector'); // because stopped is the first item in the detector state dropdown
    cy.getElementByTestId('detectorListTable')
      .contains('running-detector')
      .should('not.exist');
  });

  it('Filter by index', () => {
    cy.mockGetDetectorsAndIndicesOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_index_response.json',
      () => {
        cy.visit(AD_URL.DETECTOR_LIST);
      }
    );

    cy.getElementByTestId('detectorListTable').contains(
      'feature-required-detector'
    );
    cy.getElementByTestId('detectorListTable').contains('stopped-detector');
    cy.getElementByTestId('detectorListTable').contains('running-detector');

    selectTopItemFromFilter('indicesFilter');

    cy.getElementByTestId('detectorListTable').contains(
      'feature-required-detector'
    ); // because feature-required is the first index returned in the fixture
    cy.getElementByTestId('detectorListTable')
      .contains('running-detector')
      .should('not.exist');
    cy.getElementByTestId('detectorListTable')
      .contains('stopped-detector')
      .should('not.exist');
  });
});
