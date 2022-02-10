/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_FIXTURE_BASE_PATH,
  BASE_AD_CREATE_AD_PATH,
} from '../../../utils/constants';

context('Create detector', () => {
  it.skip('Create detector - from dashboard', () => {
    cy.mockSearchIndexOnAction(
      AD_FIXTURE_BASE_PATH + 'search_index_response.json',
      () => {
        cy.visit(BASE_AD_CREATE_AD_PATH);
      }
    );

    cy.contains('h1', 'Create detector');

    const detectorName = 'detector-name';
    cy.get('input[name="detectorName"]').type(detectorName, { force: true });

    cy.mockGetIndexMappingsOnAction(
      AD_FIXTURE_BASE_PATH + 'index_mapping_response.json',
      () => {
        cy.get('input[role="textbox"]').first().type('e2e-test-index{enter}', {
          force: true,
        });
      }
    );

    cy.get('input[role="textbox"]').last().type('timestamp{enter}', {
      force: true,
    });

    cy.mockCreateDetectorOnAction(
      AD_FIXTURE_BASE_PATH + 'post_detector_response.json',
      () => {
        cy.get('[data-test-subj=createOrSaveDetectorButton]').click({
          force: true,
        });
      }
    );

    cy.contains('h1', detectorName);
    cy.contains('h3', 'Detector configuration');
  });
});
