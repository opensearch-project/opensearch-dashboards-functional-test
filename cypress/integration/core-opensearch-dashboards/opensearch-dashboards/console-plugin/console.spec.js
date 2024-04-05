/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('console app', () => {
  const DEFAULT_REQUEST = `GET _search
{
  "query": {
    "match_all": {}
  }
}`.trim();

  beforeEach(() => {
    // Navigate to the console page before each test
    miscUtils.visitPage('/app/dev_tools#/console');
    // Assuming there's a method to collapse the help pane in your page objects or you directly use a command here
    cy.getElementByTestId('help-close-button').click({ force: true });
    cy.wait(1000);
  });

  it('should show the default request', () => {
    // Get the request text and assert it matches the default request
    // Adjust the selector to target the element containing the request
    cy.getVisibleTextFromAceEditor('request-editor').should(
      'eq',
      DEFAULT_REQUEST
    );
  });

  it('default request response should include `"timed_out" : false`', () => {
    // Click the "Play" button to submit the request
    // Adjust the selector as needed
    cy.getElementByTestId('sendRequestButton').click();

    // Check the response for the expected text
    // Adjust the selector to target the element containing the response
    cy.getElementByTestId('response-editor').should(
      'contain',
      '"timed_out": false,'
    );
  });

  it('settings should allow changing the text size', () => {
    // Navigate to settings and change the font size, then verify the change
    // This assumes you have a way to navigate to settings and change them, possibly abstracted in commands
    cy.changeConsoleFontSize(20);
    cy.getElementByTestId('request-editor').should(
      'have.css',
      'font-size',
      '20px'
    );

    cy.changeConsoleFontSize(24);
    cy.getElementByTestId('request-editor').should(
      'have.css',
      'font-size',
      '24px'
    );
  });

  it('should resize the editor', () => {
    // Set initial window size
    cy.viewport(1300, 1100);

    // Capture initial size
    let initialWidth;
    cy.get('.conApp').then(($editor) => {
      initialWidth = $editor.width();
    });

    // Change window size
    cy.viewport(1000, 1100);

    // Assert that the editor width has decreased
    cy.get('.conApp').should(($editor) => {
      expect($editor.width()).to.be.lessThan(initialWidth);
    });
  });
});
