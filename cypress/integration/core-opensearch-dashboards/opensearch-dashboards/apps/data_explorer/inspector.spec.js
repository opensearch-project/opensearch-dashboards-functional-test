/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('inspector', () => {
    before(() => {
        cy.setAdvancedSetting({ 
            defaultIndex: 'logstash-*',
         });

         miscUtils.visitPage('app/data-explorer/discover#/');
         cy.waitForLoader()
    });

    describe('should display request stats with no results', () => {
        cy.getElementByTestId('openInspectorButton')
          .click()
        cy.getElementByTestId('inspectorPanel')
          .should('be.visible')
    });

    after(() => {
        cy.getElementByTestId('euiFlyoutCloseButton')
          .should('be.visible')
          .click()
    })
})