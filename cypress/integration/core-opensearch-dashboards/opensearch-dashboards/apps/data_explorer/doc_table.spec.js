/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('discover doc table', () => {
    beforeEach(() => {
        cy.setAdvancedSetting({ 
            defaultIndex: 'logstash-*',
         });

         miscUtils.visitPage(`app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`);
         cy.waitForLoader()
         cy.waitForSearch()
    });

      describe('add and remove columns', function () {
        it('should add more columns to the table', function () {
            cy.getElementByTestId('fieldFilterSearchInput')
              .type('phpmemory')

            cy.getElementByTestId('fieldToggle-phpmemory')
              .should('be.visible')
              .click()

            cy.getElementByTestId('dataGridHeaderCell-phpmemory')
              .should('be.visible')
        });
  
        it('should remove columns from the table', function () {
            cy.getElementByTestId('fieldToggle-phpmemory')
              .should('be.visible')
              .click()

            cy.getElementByTestId('dataGridHeaderCell-phpmemory')
              .should('not.be.visible')
        });
      });
})