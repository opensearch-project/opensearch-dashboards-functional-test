/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getNodeData } from './helpers';
import _ from 'lodash';

Cypress.Commands.add('getVisPanelByTitle', (title) =>
  cy.get(`[data-title="${title}"]`).parents('.embPanel').should('be.visible')
);

Cypress.Commands.add('getChart', () =>
  cy.get('[class="chart"]').find('svg').should('be.visible')
);

Cypress.Commands.add('openVisContextMenu', { prevSubject: true }, (panel) =>
  cy
    .wrap(panel)
    .find(`[data-test-subj="embeddablePanelContextMenuClosed"]`)
    .click()
    .then(() => cy.get('.euiContextMenu'))
);

Cypress.Commands.add(
  'clickVisPanelMenuItem',
  { prevSubject: 'optional' },
  (menu, text) =>
    (menu ? cy.wrap(menu) : cy.get('.euiContextMenu'))
      .find('button')
      .contains(text)
      .click()
      .then(() => cy.get('.euiContextMenu'))
);

Cypress.Commands.add(
  'getTextNodes',
  {
    prevSubject: true,
  },
  (chart) => cy.wrap(chart).find('text')
);

Cypress.Commands.add(
  'getArcNodes',
  {
    prevSubject: true,
  },
  (chart) => cy.wrap(chart).find('[class="arcs"]').find('path[class="slice"]')
);

Cypress.Commands.add(
  'getCircleNodes',
  {
    prevSubject: true,
  },
  (chart) =>
    cy.wrap(chart).find('[class="points line"]').find('circle[class="circle"]')
);

Cypress.Commands.add(
  'getNodeData',
  {
    prevSubject: true,
  },
  (node) => cy.wrap(getNodeData(node.get(0)))
);

Cypress.Commands.add(
  'filterNodesBy',
  {
    prevSubject: true,
  },
  ($nodes, filter, value) => {
    let nodes = [];
    $nodes.map((idx, node) => {
      if (getNodeData(node)[filter] === value) nodes.push(node);
    });
    return nodes;
  }
);

Cypress.Commands.add('getLabelNodes', { prevSubject: true }, (chart) => {
  return cy.wrap(chart).find('[class="labels"]').find('text');
});

Cypress.Commands.add(
  'containsText',
  { prevSubject: true },
  (chart, text, exactMatch = false) => {
    return cy
      .wrap(chart)
      .getTextNodes()
      .then(($texts) => {
        $texts = $texts.filter(
          (idx, node) =>
            (exactMatch && node.firstChild.nodeValue === text) ||
            _.includes(node.firstChild.nodeValue, text)
        );

        if ($texts.length > 0) {
          cy.assert(
            true,
            `expected to find a node with the text "${text}", multiple nodes found`
          );
        } else if ($texts.length === 0) {
          cy.assert(true, `expected to find a node with the text "${text}"`);
        } else {
          cy.fail(
            `expected to find a node with the text "${text}" but failed to find it!`
          );
        }

        return $texts;
      });
  }
);

Cypress.Commands.add(
  'getLegendNodes',
  {
    prevSubject: true,
  },
  (visPanel) =>
    cy
      .wrap(visPanel)
      .find('ul[class="visLegend__list"]')
      .find('span[class="visLegend__valueTitle"]')
      .then(($legends) => {
        cy.assert(
          true,
          `expected to find legend nodes within the vis panel, found ${$legends.length}`
        );

        return $legends;
      })
);
