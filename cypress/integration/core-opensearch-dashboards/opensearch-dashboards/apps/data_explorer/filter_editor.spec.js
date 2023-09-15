/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('discover filter editor', () => {
    before(() => {
        cy.setAdvancedSetting({ 
            defaultIndex: 'logstash-*',
         });

         miscUtils.visitPage('app/data-explorer/discover#/');
         cy.waitForLoader()
    });

    describe('filter editor', function () {
        it('should add a phrases filter', function () {
          cy.submitFilterFromDropDown('extension.raw', 'is one of', 'jpg')
          cy.getElementByTestId('filter filter-enabled filter-key-extension.raw filter-value-jpg filter-unpinned')
            .should('be.visible')
        });
  
        it('should show the phrases if you re-open a phrases filter', function () {
          cy.getElementByTestId('filter filter-enabled filter-key-extension.raw filter-value-jpg filter-unpinned')
            .click()
          cy.getElementByTestId('editFilter')
            .click()
          cy.getElementByTestId('filterFieldSuggestionList')
            .should('have.text', 'extension.raw')
          cy.get('[data-test-subj~="filterParamsComboBox"]')
            .should('have.text', 'jpg')
        });
  
        it('should support filtering on nested fields', () => {
          cy.submitFilterFromDropDown('nestedField.child', 'is', 'nestedValue')
         
          cy.getElementByTestId('filter filter-enabled filter-key-nestedField.child filter-value-nestedValue filter-unpinned')
            .should('be.visible')
          cy.verifyHitCount('1')
        });
      });
})