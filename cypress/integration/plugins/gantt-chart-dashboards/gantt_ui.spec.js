/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import { BASE_PATH } from '../../../utils/constants';

dayjs.extend(customParseFormat);

const delay = 100;
const GANTT_VIS_NAME =
  'A test gantt chart ' + Math.random().toString(36).substring(2);
const Y_LABEL = 'A unique label for Y-axis';
const X_LABEL = 'A unique label for X-axis';
const DEFAULT_SIZE = 10;

describe('Dump test data', () => {
  it('Indexes test data for gantt chart', () => {
    const dumpDataSet = (ndjson, index) =>
      cy.request({
        method: 'POST',
        form: false,
        url: 'api/console/proxy',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        qs: {
          path: `${index}/_bulk`,
          method: 'POST',
        },
        body: ndjson,
      });
    cy.fixture('plugins/gantt-chart-dashboards/jaeger-sample.txt').then(
      (ndjson) => {
        dumpDataSet(ndjson, 'jaeger');
      }
    );

    cy.request({
      method: 'POST',
      failOnStatusCode: false,
      url: 'api/saved_objects/index-pattern/jaeger',
      headers: {
        'content-type': 'application/json',
        'osd-xsrf': true,
      },
      body: JSON.stringify({ attributes: { title: 'jaeger' } }),
    });
  });
});

describe('Save a gantt chart', () => {
  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/visualize#`);
  });

  it('Creates and saves a gantt chart', () => {
    cy.get('.euiButton__text').contains('Create ').click({ force: true });
    cy.wait(delay);
    cy.get('[data-test-subj="visTypeTitle"]')
      .contains('Gantt Chart')
      .click({ force: true });
    cy.wait(delay);
    cy.contains(/^jaeger$/).click({ force: true });
    cy.wait(delay);
    cy.contains('Save').click({ force: true });
    cy.wait(delay);
    cy.get('input[data-test-subj="savedObjectTitle"]').type(GANTT_VIS_NAME);
    cy.wait(delay);
    cy.get('button[data-test-subj="confirmSaveSavedObjectButton"]').click({
      force: true,
    });
    cy.wait(delay);

    cy.contains('Saved').should('exist');
  });
});

describe('Render and configure a gantt chart', () => {
  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/visualize#`);
    cy.contains(GANTT_VIS_NAME).click({ force: true });
  });

  it('Renders no data message', () => {
    cy.contains('No data').should('exist');
  });

  it('Renders the chart', () => {
    cy.get('button.euiSuperSelectControl').eq(0).click({ force: true });
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains(/^spanID$/)
      .click({ force: true });
    cy.wait(delay);
    cy.get('button.euiSuperSelectControl').eq(1).click({ force: true });
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains(/^startTime$/)
      .click({ force: true });
    cy.wait(delay);
    cy.get('button.euiSuperSelectControl').eq(2).click({ force: true });
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains(/^duration$/)
      .click({ force: true });
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(delay);

    cy.get('.traces').should('have.length', DEFAULT_SIZE);

    cy.get('.euiButton__text').contains('Save').click({ force: true });
    cy.wait(delay);
    cy.get('button[data-test-subj="confirmSaveSavedObjectButton"]').click({
      force: true,
    });
  });
});

describe('Configure panel settings', () => {
  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/visualize#`);
    cy.contains(GANTT_VIS_NAME).click({ force: true });
    cy.contains('Panel settings').click({ force: true });
  });

  it('Changes y-axis label', () => {
    cy.get('input.euiFieldText[placeholder="Label"]')
      .eq(0)
      .focus()
      .type(Y_LABEL);
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(delay);

    cy.get('text.ytitle').contains(Y_LABEL).should('exist');

    cy.get('.euiSwitch__label')
      .contains('Show Y-axis label')
      .click({ force: true });
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(delay);

    cy.get('text.ytitle').should('not.exist');
  });

  it('Changes x-axis label', () => {
    cy.get('input.euiFieldText[placeholder="Label"]')
      .eq(1)
      .focus()
      .type(X_LABEL);
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(delay);

    cy.get('text.xtitle').contains(X_LABEL).should('exist');

    cy.get('.euiSwitch__label')
      .contains('Show X-axis label')
      .click({ force: true });
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(delay);

    cy.get('text.xtitle').should('not.exist');
  });

  it('Changes time formats', () => {
    cy.get('select').eq(3).select('MM/DD hh:mm:ss A');
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(1000);
    cy.get('.xtick')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(dayjs(text, 'MM/DD hh:mm:ss A', true).isValid()).to.be.true;
      });

    cy.get('select').eq(3).select('MM/DD/YY hh:mm A');
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(1000);
    cy.get('.xtick')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(dayjs(text, 'MM/DD/YY hh:mm A', true).isValid()).to.be.true;
      });

    cy.get('select').eq(3).select('HH:mm:ss.SSS');
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(1000);
    cy.get('.xtick')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(dayjs(text, 'HH:mm:ss.SSS', true).isValid()).to.be.true;
      });

    cy.get('select').eq(3).select('MM/DD HH:mm:ss');
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(1000);
    cy.get('.xtick')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(dayjs(text, 'MM/DD HH:mm:ss', true).isValid()).to.be.true;
      });

    cy.get('select').eq(3).select('MM/DD/YY HH:mm');
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(1000);
    cy.get('.xtick')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(dayjs(text, 'MM/DD/YY HH:mm', true).isValid()).to.be.true;
      });
  });

  it('Hides legends', () => {
    cy.get('g.traces').should('have.length', DEFAULT_SIZE);

    cy.get('.euiSwitch__label').contains('Show legend').click({ force: true });
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Update').click({ force: true });
    cy.wait(delay);

    cy.get('g.traces').should('not.exist');
  });
});

describe('Add gantt chart to dashboard', () => {
  it('Adds gantt chart to dashboard', () => {
    cy.visit(`${BASE_PATH}/app/dashboards#/create`);

    cy.contains('Add an existing').click({ force: true });
    cy.wait(delay);
    cy.get('input[data-test-subj="savedObjectFinderSearchInput"]')
      .focus()
      .type(GANTT_VIS_NAME);
    cy.wait(delay);
    cy.get(`.euiListGroupItem__label[title="${GANTT_VIS_NAME}"]`).click({
      force: true,
    });
    cy.wait(delay);

    cy.get('g.traces').should('have.length', DEFAULT_SIZE);
  });
});
