// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable<Subject> {
      //discover
      getTimeConfig(start: string, end: string): Chainable<any>;
      saveSearch(name: string): Chainable<any>;
      loadSaveSearch(name: string): Chainable<any>;
      verifyHitCount(count: string): Chainable<any>;

      //discover histogram
      waitForSearch(): Chainable<any>;
      prepareTest(fromTime: string, toTime: string, interval: string): Chainable<any>;
      isChartCanvasExist(): Chainable<any>;
      isChartIntervalWarningIconExist(): Chainable<any>;

      //large string
      submitQuery(query: string): Chainable<any>;
      verifyMarkCount(count: string): Chainable<any>;
    }
  }