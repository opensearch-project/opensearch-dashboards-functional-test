/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../../../utils/constants';
import { ADMIN_AUTH } from '../../../../../utils/commands';

const SAVED_OBJECTS_PATH = `${BASE_PATH}/app/management/opensearch-dashboards/objects`;
const IMPORT_API = '/api/saved_objects/_import';
const FIXTURE_PATH =
  'dashboard/opensearch_dashboards/saved_objects_management/test_saved_objects.ndjson';

const importViaFetch = (fixturePath, queryParams = '') => {
  return cy
    .fixture(fixturePath)
    .then((file) => Cypress.Blob.binaryStringToBlob(file))
    .then((blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'test_saved_objects.ndjson');

      const headers = { 'osd-xsrf': 'true' };

      // Add basic auth header if security is enabled
      if (Cypress.env('SECURITY_ENABLED')) {
        const credentials = btoa(
          `${ADMIN_AUTH.username}:${ADMIN_AUTH.password}`
        );
        headers['Authorization'] = `Basic ${credentials}`;
      }

      return cy.wrap(
        fetch(`${Cypress.config().baseUrl}${IMPORT_API}${queryParams}`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include',
        }).then((res) => res.json())
      );
    });
};

const cleanupTestObjects = () => {
  cy.deleteSavedObject('index-pattern', 'test-index-pattern-id');
  cy.deleteSavedObject('dashboard', 'test-dashboard-id');
  cy.deleteSavedObject('visualization', 'test-visualization-id');
};

describe('Saved Objects Import', () => {
  beforeEach(() => {
    cleanupTestObjects();
  });

  describe('API', () => {
    it('should import saved objects without options', () => {
      importViaFetch(FIXTURE_PATH).then((body) => {
        expect(body.success).to.eq(true);
        expect(body.successCount).to.eq(3);
      });
    });

    it('should import saved objects with overwrite=true', () => {
      importViaFetch(FIXTURE_PATH, '?overwrite=true').then((body) => {
        expect(body.success).to.eq(true);
        expect(body.successCount).to.eq(3);
      });
    });

    it('should report conflict when objects exist and overwrite=false', () => {
      importViaFetch(FIXTURE_PATH, '?overwrite=true').then(() => {
        importViaFetch(FIXTURE_PATH, '?overwrite=false').then((body) => {
          expect(body.success).to.eq(false);
          expect(body.errors).to.have.length.greaterThan(0);
          body.errors.forEach((error) => {
            expect(error.error.type).to.eq('conflict');
          });
        });
      });
    });

    it('should import with createNewCopies=true', () => {
      importViaFetch(FIXTURE_PATH, '?createNewCopies=true').then((body) => {
        expect(body.success).to.eq(true);
        body.successResults.forEach((result) => {
          expect(result.destinationId).to.not.eq(result.id);
          cy.deleteSavedObject(result.type, result.destinationId);
        });
      });
    });

    it('should reject overwrite and createNewCopies together', () => {
      importViaFetch(FIXTURE_PATH, '?overwrite=true&createNewCopies=true').then(
        (body) => {
          expect(body.statusCode).to.eq(400);
        }
      );
    });

    it('should reject invalid file extension', () => {
      const formData = new FormData();
      formData.append('file', new Blob(['invalid']), 'test.txt');

      const headers = { 'osd-xsrf': 'true' };
      if (Cypress.env('SECURITY_ENABLED')) {
        const credentials = btoa(
          `${ADMIN_AUTH.username}:${ADMIN_AUTH.password}`
        );
        headers['Authorization'] = `Basic ${credentials}`;
      }

      cy.wrap(
        fetch(`${Cypress.config().baseUrl}${IMPORT_API}?overwrite=true`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include',
        }).then((res) => res.json())
      ).then((body) => {
        expect(body.statusCode).to.eq(400);
        expect(body.message).to.include('Invalid file extension');
      });
    });
  });

  describe('UI', () => {
    it('should import saved objects via UI', () => {
      cy.visit(SAVED_OBJECTS_PATH);
      cy.getElementByTestId('importObjects').click();
      cy.get('.euiFlyout').should('exist');

      cy.fixture(FIXTURE_PATH, 'binary').then((fileContent) => {
        const blob = Cypress.Blob.binaryStringToBlob(fileContent);
        const file = new File([blob], 'test_saved_objects.ndjson', {
          type: 'application/x-ndjson',
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        cy.get('.euiFilePicker__input').then(($input) => {
          $input[0].files = dataTransfer.files;
          $input[0].dispatchEvent(new Event('change', { bubbles: true }));
        });
      });

      cy.getElementByTestId('importSavedObjectsImportBtn').click();
      cy.getElementByTestId('importSavedObjectsSuccess', {
        timeout: 10000,
      }).should('exist');
      cy.getElementByTestId('importSavedObjectsDoneBtn').click();
    });

    it('should show import flyout with correct elements', () => {
      cy.visit(SAVED_OBJECTS_PATH);
      cy.getElementByTestId('importObjects').click();

      cy.get('.euiFlyout').within(() => {
        cy.contains('Import').should('exist');
        cy.get('.euiFilePicker').should('exist');
      });

      cy.getElementByTestId('importSavedObjectsCancelBtn').click();
    });

    it('should handle import with overwrite', () => {
      cy.importSavedObjects(FIXTURE_PATH);
      cy.visit(SAVED_OBJECTS_PATH);
      cy.getElementByTestId('importObjects').click();

      cy.fixture(FIXTURE_PATH, 'binary').then((fileContent) => {
        const blob = Cypress.Blob.binaryStringToBlob(fileContent);
        const file = new File([blob], 'test_saved_objects.ndjson', {
          type: 'application/x-ndjson',
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        cy.get('.euiFilePicker__input').then(($input) => {
          $input[0].files = dataTransfer.files;
          $input[0].dispatchEvent(new Event('change', { bubbles: true }));
        });
      });

      cy.getElementByTestId('importSavedObjectsImportBtn').click();
      cy.getElementByTestId('importSavedObjectsSuccess', {
        timeout: 10000,
      }).should('exist');
    });
  });
});
