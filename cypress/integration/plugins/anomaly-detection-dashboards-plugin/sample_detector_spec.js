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
    const responses = [];
    cy.intercept('POST', '**/api/anomaly_detectors/**', (req) => {
      const response = {
        path: new URL(req.url).pathname,
        status: 'No response received',
      };
      responses.push(response);
      req.on('response', (res) => {
        response.status = res.statusCode;
        response.body = res.body;
      });
    });

    // Preserve the backend error hidden by the sample-creation toast.
    cy.on('fail', (error) => {
      error.message += `\nHost health creation responses:\n${JSON.stringify(
        responses,
        null,
        2
      )}`;
      throw error;
    });

    createSampleDetector('createHostHealthSampleDetectorButton');
  });
});
