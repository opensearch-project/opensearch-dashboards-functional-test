/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_FIXTURE_BASE_PATH,
  BASE_AD_DETECTOR_LIST_PATH,
  TEST_DETECTOR_ID,
  DETECTOR_STATE_DISABLED,
  DETECTOR_STATE_INIT,
  DETECTOR_STATE_RUNNING,
  DETECTOR_STATE_FEATURE_REQUIRED,
} from '../../../utils/constants';

describe('Detector list', () => {
  const EMPTY_MESSAGE =
    'A detector is an individual anomaly detection task. You can create multiple detectors, ' +
    'and all the detectors can run simultaneously, with each analyzing data from different sources. ' +
    'Create an anomaly detector to get started.';

  it('Empty detectors - no detector index', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'no_detector_index_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );

    cy.contains('p', '(0)');
    cy.contains('p', EMPTY_MESSAGE);
    cy.get('.euiButton--primary.euiButton--fill').should(
      'have.length.at.least',
      2
    );
  });

  it('Empty detectors - empty detector index', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'empty_detector_index_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );

    cy.contains('p', '(0)');
    cy.contains('p', EMPTY_MESSAGE);
    cy.get('.euiButton--primary.euiButton--fill').should(
      'have.length.at.least',
      2
    );
  });

  it('One detector - single stopped detector index', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_detector_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );

    cy.contains('p', '(1)');
    cy.contains('stopped-detector');
    cy.contains('Stopped');
    cy.contains('test-index');
    cy.get('.euiButton--primary.euiButton--fill').should(
      'have.length.at.least',
      1
    );
  });

  it('Multiple detectors - multiple detectors index', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );

    cy.contains('p', '(4)');
    cy.contains('stopped-detector');
    cy.contains('initializing-detector');
    cy.contains('running-detector');
    cy.contains('feature-required-detector');
    cy.contains('stopped-index');
    cy.contains('initializing-index');
    cy.contains('running-index');
    cy.contains('feature-required-index');
    cy.contains(DETECTOR_STATE_DISABLED);
    cy.contains(DETECTOR_STATE_INIT);
    cy.contains(DETECTOR_STATE_RUNNING);
    cy.contains(DETECTOR_STATE_FEATURE_REQUIRED);
    cy.get('.euiButton--primary.euiButton--fill').should(
      'have.length.at.least',
      1
    );
  });

  it('Redirect to create detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_detector_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );
    cy.get('[data-test-subj=createDetectorButton]').click({ force: true });
    cy.contains('span', 'Create detector');
  });

  it('Start single detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_detector_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );
    cy.get('.euiTableRowCellCheckbox').within(() =>
      cy.get('.euiCheckbox__input').click({ force: true })
    );
    cy.get('[data-test-subj=listActionsButton]').click({ force: true });
    cy.get('[data-test-subj=startDetectors]').click({ force: true });
    cy.contains('The following detectors will begin initializing.');
    cy.contains('stopped-detector');
    cy.mockStartDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'start_detector_response.json',
      TEST_DETECTOR_ID,
      () => {
        cy.get('[data-test-subj=confirmButton]').click({ force: true });
      }
    );
    cy.contains('Successfully started all selected detectors');
  });

  it('Stop single detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_running_detector_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );
    cy.get('.euiTableRowCellCheckbox').within(() =>
      cy.get('.euiCheckbox__input').click({ force: true })
    );
    cy.get('[data-test-subj=listActionsButton]').click({ force: true });
    cy.get('[data-test-subj=stopDetectors]').click({ force: true });
    cy.contains('The following detectors will be stopped.');
    cy.contains('running-detector');
    cy.mockStopDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'stop_detector_response.json',
      TEST_DETECTOR_ID,
      () => {
        cy.get('[data-test-subj=confirmButton]').click({ force: true });
      }
    );
    cy.contains('Successfully stopped all selected detectors');
  });

  it.skip('Delete single detector', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'single_stopped_detector_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );
    cy.get('.euiTableRowCellCheckbox').within(() =>
      cy.get('.euiCheckbox__input').click({ force: true })
    );
    cy.get('[data-test-subj=listActionsButton]').click({ force: true });
    cy.get('[data-test-subj=deleteDetectors]').click({ force: true });
    cy.contains(
      'The following detectors and feature configurations will be permanently removed. This action is irreversible.'
    );
    cy.contains('stopped-detector');
    cy.contains('Running');
    cy.contains('No');
    cy.get('[data-test-subj=typeDeleteField]')
      .click({ force: true })
      .type('delete');
    cy.mockDeleteDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'delete_detector_response.json',
      TEST_DETECTOR_ID,
      () => {
        cy.get('[data-test-subj=confirmButton]').click({ force: true });
      }
    );
    cy.contains('Successfully deleted all selected detectors');
  });

  it('Filter by detector search', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );

    cy.contains('stopped-detector');
    cy.contains('running-detector');

    cy.get('[data-test-subj=detectorListSearch]')
      .first()
      .click({ force: true })
      .type('stopped-detector');

    cy.contains('stopped-detector');
    cy.contains('running-detector').should('not.be.visible');
  });

  it('Filter by detector state', () => {
    cy.mockGetDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'multiple_detectors_response.json',
      () => {
        cy.visit(BASE_AD_DETECTOR_LIST_PATH);
      }
    );

    cy.contains('stopped-detector');
    cy.contains('running-detector');

    cy.get('[data-test-subj=comboBoxToggleListButton]')
      .first()
      .click({ force: true });
    cy.get('.euiFilterSelectItem').first().click({ force: true });
    cy.get('.euiPageSideBar').click({ force: true });

    cy.contains('stopped-detector'); // because stopped is the first item in the detector state dropdown
    cy.contains('running-detector').should('not.be.visible');
  });
});
