/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
    BASE_PATH
  } from '../../../utils/constants';

describe('Before', () => {
    before(() => {
        cy.deleteAllIndices();
        
        localStorage.setItem('home:welcome:show', 'true');
        
        cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`);

        // Click on "Sample data" tab
        cy.contains('Sample data').click({ force: true });
        // Load sample flights data
        cy.get(`button[data-test-subj="addSampleDataSetflights"]`).click({
            force: true,
        });

        // Verify that sample data is add by checking toast notification
        cy.contains('Sample flight data installed', { timeout: 60000 });
    });

    it('setup completed', () => {});
  }
);