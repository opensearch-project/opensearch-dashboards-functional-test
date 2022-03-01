/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

describe('Cypress', () => {
  it('Download from reporting homepage', () => {
    cy.visit(`${BASE_PATH}/app/reports-dashboards#/`);
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      '/reports-dashboards'
    );

    cy.wait(12500);
    cy.get('#landingPageOnDemandDownload').click({ force: true });
    cy.get('body').then($body => {
      if ($body.find('#downloadInProgressLoadingModal').length > 0) {
        return;
      }
      else {
        assert(false);
      }
    })
  });

  it('Download pdf from in-context menu', () => {
    cy.visit(`${BASE_PATH}/app/dashboards#`);
    cy.wait(5000);

    // click first entry in dashboards page
    cy.get('tr.euiTableRow:nth-child(1) > td:nth-child(2) > div:nth-child(2) > a:nth-child(1)').click({ force: true });

    // click Reporting in-context menu
    cy.get('#downloadReport > span:nth-child(1) > span:nth-child(1)').click({ force: true });

    // download PDF 
    cy.get('#generatePDF > span:nth-child(1) > span:nth-child(2)').click({ force: true });

    cy.get('#reportGenerationProgressModal');
  });

  it('Download png from in-context menu', () => {
    cy.visit(`${BASE_PATH}/app/dashboards#`);
    cy.wait(5000);

    // click first entry in dashboards page
    cy.get('tr.euiTableRow:nth-child(1) > td:nth-child(2) > div:nth-child(2) > a:nth-child(1)').click({ force: true });

    // click Reporting in-context menu
    cy.get('#downloadReport > span:nth-child(1) > span:nth-child(1)').click({ force: true });

    cy.get('#generatePNG').click({ force: true });

    cy.get('#reportGenerationProgressModal');
  });

  it('Download csv from saved search in-context menu', () => {
    cy.visit(`${BASE_PATH}/app/discover#`);
    cy.wait(5000);

    // open saved search list
    cy.get('button.euiButtonEmpty:nth-child(3) > span:nth-child(1) > span:nth-child(1)').click({ force: true });
    cy.wait(5000);

    // click first entry
    cy.get('li.euiListGroupItem:nth-child(1) > button:nth-child(1)').click({ force: true });

    // open reporting menu
    cy.get('#downloadReport').click({ force: true });

    cy.get('#generateCSV').click({ force: true });
  });

  it('Download from Report definition details page', () => {
    // create an on-demand report definition 

    cy.visit(`${BASE_PATH}/app/reports-dashboards#/`);
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      '/reports-dashboards'
    );
    cy.wait(10000);

    cy.get('tr.euiTableRow-isSelectable:nth-child(1) > td:nth-child(1) > div:nth-child(2) > button:nth-child(1)').first().click(); 

    cy.url().should('include', 'report_definition_details');

    cy.get('#generateReportFromDetailsFileFormat').should('exist');

    cy.get('#generateReportFromDetailsFileFormat').click({ force: true });

    cy.get('#downloadInProgressLoadingModal');
  });
});
