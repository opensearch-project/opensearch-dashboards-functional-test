/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  IM_PLUGIN_NAME,
  BASE_PATH,
  BACKEND_BASE_PATH,
} from '../../../utils/constants';

const rolloverValidAlias = 'rollover-valid-alias';
const rolloverAliasNeedTargetIndex = 'rollover-alias-need-target-index';
const rolloverDataStream = 'data-stream-rollover';
const validIndex = 'index-000001';
const invalidIndex = 'index-test-rollover';

const visitRolloverPage = (source, readyText) => {
  cy.intercept('POST', '**/api/ism/apiCaller').as('apiCaller');
  cy.visit(`${BASE_PATH}/app/${IM_PLUGIN_NAME}#/rollover/${source}`);
  // Only the hash changes between tests, so cy.visit alone may not reload the
  // app and can leave the previous test's rollover page rendered. Force a full
  // load and wait for the page to fetch its data before interacting.
  cy.reload();
  cy.wait('@apiCaller', { timeout: 60000 });
  cy.contains(readyText, { timeout: 60000 });
  cy.get('[data-test-subj="rolloverSubmitButton"]', { timeout: 60000 }).should(
    'not.be.disabled'
  );
};

describe('Rollover', () => {
  before(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');
    cy.deleteTemplate('index-common-template');
    cy.deleteAllIndices();
    cy.request({
      url: `${BACKEND_BASE_PATH}/_data_stream/*`,
      method: 'DELETE',
      failOnStatusCode: false,
    });
    cy.createIndex(validIndex);
    cy.createIndex(invalidIndex);
    cy.addIndexAlias(rolloverValidAlias, validIndex);
    cy.addIndexAlias(rolloverAliasNeedTargetIndex, invalidIndex);
    cy.createIndexTemplate('index-common-template', {
      index_patterns: ['data-stream-*'],
      data_stream: {},
      template: {
        aliases: {
          alias_for_common_1: {},
          alias_for_common_2: {},
        },
        settings: {
          number_of_shards: 2,
          number_of_replicas: 1,
        },
      },
    });
    cy.request({
      url: `${BACKEND_BASE_PATH}/_data_stream/${rolloverDataStream}`,
      method: 'PUT',
      failOnStatusCode: false,
    });
  });

  describe('rollover', () => {
    it('rollover data stream successfully', () => {
      visitRolloverPage(rolloverDataStream, 'Configure source');

      // click create
      cy.get('[data-test-subj="rolloverSubmitButton"]').click();

      cy.contains(/has been successfully rolled over./);
    });

    it('rollover valid alias successfully', () => {
      visitRolloverPage(rolloverValidAlias, 'Configure new rollover index');

      // click create
      cy.get('[data-test-subj="rolloverSubmitButton"]').click();

      cy.contains(/has been successfully rolled over./);
    });

    it('rollover invalid alias successfully', () => {
      visitRolloverPage(
        rolloverAliasNeedTargetIndex,
        'Configure new rollover index'
      );

      // click create
      cy.get('[data-test-subj="rolloverSubmitButton"]').click();

      cy.contains('Invalid index name.');

      cy.get('[data-test-subj="form-name-index"] input').type(
        'index-test-rollover-target'
      );

      // click create
      cy.get('[data-test-subj="rolloverSubmitButton"]').click();

      cy.contains(/has been successfully rolled over./);
    });
  });

  after(() => {
    cy.deleteTemplate('index-common-template');
    cy.deleteAllIndices();
    cy.request({
      url: `${BACKEND_BASE_PATH}/_data_stream/*`,
      method: 'DELETE',
      failOnStatusCode: false,
    });
  });
});
