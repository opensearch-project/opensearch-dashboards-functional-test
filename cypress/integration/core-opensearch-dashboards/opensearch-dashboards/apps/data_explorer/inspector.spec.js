/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  DE_DEFAULT_END_TIME,
  DE_DEFAULT_START_TIME,
} from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);

describe('inspector', () => {
  before(() => {
    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  it('should display request stats with no results', () => {
    cy.getElementByTestId('openInspectorButton').click();

    cy.getElementByTestId('inspectorPanel')
      .get('.euiTable tr:nth-child(2) td:nth-child(2) span')
      .invoke('text')
      .should('eq', '0');
  });

  it('should display request stats with results', () => {
    cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
    cy.waitForSearch();
    cy.getElementByTestId('openInspectorButton').click();
    cy.getElementByTestId('inspectorPanel')
      .get('.euiTable tr:nth-child(2) td:nth-child(2) span')
      .invoke('text')
      .should('eq', '14004');
  });

  afterEach(() => {
    cy.getElementByTestId('euiFlyoutCloseButton').should('be.visible').click();
  });
});
