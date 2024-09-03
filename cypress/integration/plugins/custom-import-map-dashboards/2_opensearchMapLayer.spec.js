/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { CURRENT_TENANT } from '../../../utils/commands';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('Default OpenSearch base map layer', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.deleteAllIndices();
    miscUtils.addSampleData();
    cy.wait(15000);
  });

  it('check if default OpenSearch map layer can be open', () => {
    cy.wait(10000);
    cy.visit(`${BASE_PATH}/app/maps-dashboards/create`);
    cy.wait(10000);
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Default map'
    );
    cy.get('canvas.maplibregl-canvas').trigger('mousemove', {
      x: 100,
      y: 100,
      force: true,
    });
    cy.get('canvas.maplibregl-canvas').trigger('mousemove', {
      x: 200,
      y: 200,
      force: true,
    });
    for (let i = 0; i < 21; i++) {
      cy.wait(1000)
        .get('canvas.maplibregl-canvas')
        .trigger('dblclick', { force: true });
    }
    cy.get('[data-test-subj="mapStatusBar"]').should('contain', 'zoom: 22');
  });

  after(() => {
    miscUtils.removeSampleData();
  });
});
