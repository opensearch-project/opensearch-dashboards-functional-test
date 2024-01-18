/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';

describe('Assistant basic spec', () => {
  before(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');
  });

  beforeEach(() => {
    // Visit ISM OSD
    cy.visit(`${BASE_PATH}/app/home`);

    // Common text to wait for to confirm page loaded, give up to 60 seconds for initial load
    cy.get(`input[placeholder="Ask question"]`, { timeout: 60000 }).should(
      'be.length',
      1
    );
  });

  describe('show up', () => {
    it.only('successfully', () => {});
  });
});
