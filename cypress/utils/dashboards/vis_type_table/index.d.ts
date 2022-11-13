// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable<Subject> {
      // Common functions
      removeAggregation(id: number): Chainable<any>;
      removeAllAggregations(total: number): Chainable<any>;
      isUpdateAggregationSettingsEnabled(): Chainable<any>;
      isUpdateAggregationSettingsDisabled(): Chainable<any>;
      discardAggregationSettings(): Chainable<any>;
      updateAggregationSettings(): Chainable<any>;
      // Inspector
      openInspector(): Chainable<any>;
      closeInspector(): Chainable<any>;
      getTableDataFromInspectPanel(): Chainable<any>;
      // Functions for data panel
      openDataPanel(): Chainable<any>;
      toggleOpenEditor(id: number): Chainable<any>;
      addMetricsAggregation(): Chainable<any>;
      addBucketsAggregation(): Chainable<any>;
      splitRows(): Chainable<any>;
      splitTables(): Chainable<any>;
      splitTablesInRows(): Chainable<any>;
      splitTablesInColumns(): Chainable<any>;
      selectAggregationType(agg: string, id: number): Chainable<any>;
      selectSubAggregationType(agg: string, id: number, type: string): Chainable<any>;
      selectAggregationField(field: string, id: number): Chainable<any>;
      selectSubAggregationField(field: string, id: number, type: string): Chainable<any>;
      // Functions for buckets aggregation
      // Histogram Aggregation
      enableHistogramInterval(id:number): Chainable<any>;
      setHistogramInterval(interval: string, id: number): Chainable<any>;
      isHistogramIntervalSet(interval: string, id: number): Chainable<any>;
      setupHistogramAggregation(field: string, interval: string, id: number): Chainable<any>;
      // Terms Aggregation
      toggleOtherBucket(request: string): Chainable<any>;
      toggleMissingBucket(request: string): Chainable<any>;
      setupTermsAggregation(field: string, sort: string, size: string, id: number): Chainable<any>;
      // Range Aggregation
      addRange(): Chainable<any>;
      setupRange(range: Array<Array<string>>, id: number): Chainable<any>;
      setupRangeAggregation(field: string, range: Array<Array<string>>, id: number): Chainable<any>;
      // Date Histogram
      setupMinimumlInterval(interval: string, id: number): Chainable<any>;
      setupDateHistogramAggregation(field: string, interval: string, id: number): Chainable<any>;
      // Functions for table visualizations
      getTableDataFromVisualization(): Chainable<any>;
      getAllTableDataFromVisualization(total: number): Chainable<any>;
      getTotalValueFromTable(): Chainable<any>;
      selectSortColumn(tableIndex: number, colIndex: number, dir: string): Chainable<any>;
      getColumnWidth(tableIndex: number, colIndex: number, name: string): Chainable<any>;
      adjustColumnWidth(totalColumn: number, tableIndex: number, colIndex: number, size: number): Chainable<any>;
      clickTableCellAction(tableIndex: number, totalColumn: number, rowIndex: number, colIndex: number, action: string): Chainable<any>;
      clickFilterFromExpand(action: string): Chainable<any>;
      // Functions for Options Panel
      openOptionsPanel(): Chainable<any>;
      toggleOptionByName(option: string, request: string): Chainable<any>;
      selectTotalFunctionByName(fun: string): Chainable<any>;
      selectPercentageColumn(agg: string): Chainable<any>;
    }
  }
