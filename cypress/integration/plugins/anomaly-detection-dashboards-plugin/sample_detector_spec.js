/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSampleDetector } from '../../../utils/helpers';
import { AD_URL } from '../../../utils/plugins/anomaly-detection-dashboards-plugin/constants';

context('Sample detectors', () => {
  before(() => {
    cy.visit(AD_URL.OVERVIEW, { timeout: 10000 });
  });
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
