/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { CURRENT_TENANT } from '../../../utils/commands';

const dataSourceEnabled = !!Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

if (dataSourceEnabled) {
  describe('Local cluster tests', () => {
    const localClusterName = 'Local cluster';
    before(() => {
      CURRENT_TENANT.newTenant = 'global';
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
        retryOnStatusCodeFailure: true,
        timeout: 60000,
      });
      cy.wait(5000);
      cy.get('[data-test-subj="comboBoxInput"]').click();
      cy.contains(localClusterName).click();
      cy.get('div[data-test-subj="sampleDataSetCardflights"]', {
        timeout: 60000,
      })
        .contains(/(Add|View) data/)
        .click();
      cy.wait(5000);
    });

    it('Test local cluster data source displayed in Maps app list page', () => {
      cy.visit(`${BASE_PATH}/app/maps-dashboards`);
      cy.wait(5000);
      cy.get('[data-test-subj="dataSourceAggregatedViewButton"]', {
        timeout: 120000,
      }).click();
      cy.get('.dataSourceAggregatedViewOuiPanel', { timeout: 120000 }).should(
        'contain',
        localClusterName
      );

      cy.wait(5000);

      cy.get('[data-test-subj="dataSourceAggregatedViewButton"]', {
        timeout: 120000,
      }).click();

      cy.get('.dataSourceAggregatedViewOuiPanel', { timeout: 120000 }).should(
        'contain',
        localClusterName
      );
    });

    after(() => {
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`);
      cy.wait(5000);
      cy.get('button[data-test-subj="removeSampleDataSetflights"]')
        .should('be.visible')
        .click();
    });
  });

  describe('Remote cluster tests', () => {
    let remoteClusterId;
    let remoteClusterName;
    before(() => {
      cy.createDataSourceNoAuth().then((result) => {
        remoteClusterId = result[0];
        remoteClusterName = result[1];
      });

      cy.log('Remote cluster id: ' + remoteClusterId);
      cy.log('Remote cluster name: ' + remoteClusterName);

      CURRENT_TENANT.newTenant = 'global';
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
        retryOnStatusCodeFailure: true,
        timeout: 60000,
      });
      cy.wait(5000);
      cy.get('[data-test-subj="comboBoxInput"]').click();
      cy.contains(remoteClusterName).click();
      cy.get('div[data-test-subj="sampleDataSetCardlogs"]', {
        timeout: 60000,
      })
        .contains(/(Add|View) data/)
        .click();
    });

    it('Test remote data source in Maps App list page', () => {
      cy.visit(`${BASE_PATH}/app/maps-dashboards`);
      cy.wait(5000);
      cy.get('[data-test-subj="dataSourceAggregatedViewButton"]', {
        timeout: 120000,
      }).click();
      cy.get('.dataSourceAggregatedViewOuiPanel', { timeout: 120000 }).should(
        'contain',
        remoteClusterName
      );
    });

    const savedMapName = 'saved-map-' + Date.now().toString();

    it('Test remote data source in Maps App visualization page', () => {
      cy.wait(10000);
      cy.visit(`${BASE_PATH}/app/maps-dashboards/create`);
      cy.wait(10000);
      cy.get("button[data-test-subj='addLayerButton']", {
        timeout: 120000,
      }).click();
      cy.contains('Documents', { timeout: 120000 }).click();
      cy.contains('Select index pattern', { timeout: 120000 })
        .wait(3000)
        .click({
          force: true,
        });
      cy.contains(
        `${remoteClusterName}::opensearch_dashboards_sample_data_logs`,
        {
          timeout: 120000,
        }
      ).click();
      cy.contains('Select data field', { timeout: 120000 }).click({
        force: true,
      });
      cy.wait(5000).contains('geo.coordinates').click();
      cy.get(`button[testSubj="styleTab"]`).click();
      cy.contains('Fill color').click();
      cy.get(`button[aria-label="Select #E7664C as the color"]`).click();
      cy.wait(1000).contains('Border color').click();
      cy.get(`button[aria-label="Select #DA8B45 as the color"]`).click();
      cy.wait(1000).get(`button[testSubj="settingsTab"]`).click();
      const layerName = 'Remote data documents layer';
      cy.get('[name="layerName"]').clear().type(layerName);
      cy.get(`button[data-test-subj="updateButton"]`).click();
      cy.get('[data-test-subj="layerControlPanel"]').should(
        'contain',
        layerName
      );
      cy.wait(5000).get('[data-test-subj="top-nav"]').click();
      cy.wait(5000)
        .get('[data-test-subj="savedObjectTitle"]')
        .type(savedMapName);
      cy.wait(5000)
        .get('[data-test-subj="confirmSaveSavedObjectButton"]')
        .click();
      cy.wait(5000)
        .get('[data-test-subj="breadcrumb last"]')
        .should('contain', savedMapName);
    });

    after(() => {
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`);
      cy.wait(5000);
      cy.get('[data-test-subj="comboBoxInput"]').click();
      cy.contains(remoteClusterName).click();
      cy.get('button[data-test-subj="removeSampleDataSetlogs"]')
        .should('be.visible')
        .click();
      if (remoteClusterId) {
        cy.deleteDataSource(remoteClusterId);
      }
    });
  });
}
