/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Server-side fixture loading commands to bypass Cypress 13's browser memory
 * limit (100MB) when processing large fixture files.
 */

const _getAuth = () => {
  if (Cypress.env('SECURITY_ENABLED')) {
    return {
      username: Cypress.env('username'),
      password: Cypress.env('password'),
    };
  }
  return null;
};

Cypress.Commands.add(
  'importJSONMapping',
  (filename, openSearchUrl = Cypress.env('openSearchUrl')) => {
    cy.task(
      'importJSONMapping',
      { filename, openSearchUrl, auth: _getAuth() },
      { timeout: 120000 }
    );
  }
);

Cypress.Commands.add(
  'importJSONDoc',
  (filename, openSearchUrl = Cypress.env('openSearchUrl'), bulkMax = 1600) => {
    cy.task(
      'importJSONDoc',
      { filename, openSearchUrl, auth: _getAuth(), bulkMax },
      { timeout: 300000 }
    );
  }
);

Cypress.Commands.add(
  'clearJSONMapping',
  (filename, openSearchUrl = Cypress.env('openSearchUrl')) => {
    cy.task(
      'clearJSONMapping',
      { filename, openSearchUrl, auth: _getAuth() },
      { timeout: 60000 }
    );
  }
);

Cypress.Commands.add(
  'importJSONDocIfNeeded',
  (
    index,
    indexMappingPath,
    indexDataPath,
    openSearchUrl = Cypress.env('openSearchUrl')
  ) => {
    const items = Array.isArray(index) ? index : [index];
    const queryString = items.join(',');
    cy.getIndices(queryString).then((response) => {
      if (response.status === 404) {
        cy.importJSONMapping(indexMappingPath, openSearchUrl);
        cy.importJSONDoc(indexDataPath, openSearchUrl);
      }
    });
  }
);
