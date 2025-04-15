/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  describe('Assistant sidecar spec', () => {
    beforeEach(() => {
      // Set welcome screen tracking to false
      localStorage.setItem('home:welcome:show', 'false');
      // Set new theme modal to false
      localStorage.setItem('home:newThemeModal:show', 'false');
    });

    beforeEach(() => {
      // Visit OSD
      cy.visit(`${BASE_PATH}/app/home`);

      cy.wait(120000);
    });

    describe('sidecar spec', () => {
      it('open sidecar and render normally, support show and hide', () => {
        // The header may render multiple times, wait for UI to be stable
        cy.wait(5000);

        // enable to toggle and open sidecar, OSD will be pushed accordingly.
        cy.get(`button[aria-label="toggle chat flyout icon"]`).click();
        cy.get('[class~="chatbot-sidecar"]').should('be.visible');
        cy.get('[class~="chatbot-sidecar"]').should(
          'have.css',
          'width',
          '460px'
        );
        //Wrapper and header have related padding style.
        cy.get('[class~="app-wrapper"]').should(
          'have.css',
          'padding-right',
          '460px'
        );
        cy.get('[id="globalHeaderBars"]')
          .children()
          .should('have.css', 'padding-right', '460px');

        // click toggle to call sidecar hide, sidecar will be hidden and paddingSize on header and wrapper will be zero.
        cy.get(`button[aria-label="toggle chat flyout icon"]`).click();
        cy.get('[class~="chatbot-sidecar"]').should(
          'have.css',
          'display',
          'none'
        );
        cy.get('[class~="app-wrapper"]').should(
          'not.have.attr',
          'padding-right'
        );
        cy.get('[id="globalHeaderBars"]')
          .children()
          .should('not.have.attr', 'padding-right');

        // click toggle to call sidecar show
        cy.get(`button[aria-label="toggle chat flyout icon"]`).click();
        cy.get('[class~="chatbot-sidecar"]').should('be.visible');
        cy.get('[class~="app-wrapper"]').should(
          'have.css',
          'padding-right',
          '460px'
        );
        cy.get('[id="globalHeaderBars"]')
          .children()
          .should('have.css', 'padding-right', '460px');
      });

      it('open sidecar and support to switch docked mode', () => {
        // The header may render multiple times, wait for UI to be stable
        cy.wait(5000);

        // enable to toggle and open sidecar, OSD will be pushed accordingly.
        cy.get(`button[aria-label="toggle chat flyout icon"]`).click();
        cy.get('[class~="chatbot-sidecar"]').should('be.visible');
        cy.get('[class~="app-wrapper"]').should(
          'have.css',
          'padding-right',
          '460px'
        );

        // switch to docked left
        cy.get('[id="sidecarModeIcon"]').click();
        cy.get('[data-test-subj="sidecar-mode-icon-menu-item-left"]').click();
        cy.get('[class~="app-wrapper"]').should(
          'have.css',
          'padding-left',
          '460px'
        );

        // switch to docked take over
        cy.get('[id="sidecarModeIcon"]').click();
        cy.get(
          '[data-test-subj="sidecar-mode-icon-menu-item-takeover"]'
        ).click();
        cy.get('[class~="app-wrapper"]').should(
          'not.have.attr',
          'padding-left'
        );
        cy.get('[class~="app-wrapper"]').should(
          'not.have.attr',
          'padding-right'
        );
      });

      it('open sidecar and support resizable', () => {
        // The header may render multiple times, wait for UI to be stable
        cy.wait(5000);

        // enable to toggle and open sidecar, OSD will be pushed accordingly.
        cy.get(`button[aria-label="toggle chat flyout icon"]`).click();
        // switch to docked left
        cy.get('[id="sidecarModeIcon"]').click();
        cy.get('[data-test-subj="sidecar-mode-icon-menu-item-left"]').click();
        cy.get('[class~="chatbot-sidecar"]').should('be.visible');
        cy.get('[class~="chatbot-sidecar"]').should(
          'have.css',
          'width',
          '460px'
        );

        //drag from left to right
        cy.get('[data-test-subj="resizableButton"]').trigger('mousedown', {
          clientX: 0,
          pageX: 0,
          pageY: 0,
        });
        cy.window().trigger('mousemove', { clientX: 1000, pageX: 0, pageY: 0 });
        cy.window().trigger('mouseup', { force: true });
        cy.get('[class~="chatbot-sidecar"]').should(
          'have.css',
          'width',
          `${1000 + 460}px`
        );

        //drag from right to left
        cy.get('[data-test-subj="resizableButton"]').trigger('mousedown', {
          clientX: 0,
          pageX: 0,
          pageY: 0,
        });
        cy.window().trigger('mousemove', {
          clientX: -1000,
          pageX: 0,
          pageY: 0,
        });
        cy.window().trigger('mouseup', { force: true });
        cy.get('[class~="chatbot-sidecar"]').should(
          'have.css',
          'width',
          `${1460 - 1000}px`
        );
      });
    });
  });
}
