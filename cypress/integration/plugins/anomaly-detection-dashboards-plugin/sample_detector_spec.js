/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSampleDetector } from '../../../utils/helpers';

context('Sample detectors', () => {
  beforeEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });

  it('HTTP response sample detector - create and delete', () => {
    createSampleDetector('createHttpSampleDetectorButton');
  });

  it('eCommerce sample detector - create and delete', () => {
    createSampleDetector('createECommerceSampleDetectorButton');
  });

  it('Host health sample detector - create and delete', () => {
    createSampleDetector('createHostHealthSampleDetectorButton');
  });
});
