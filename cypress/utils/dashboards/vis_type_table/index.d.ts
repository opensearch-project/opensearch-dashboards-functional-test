// type definitions for custom commands like "createDefaultTodos"
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable<Subject> {
      // Common functions
      tbRemoveAggregation(id: number): Chainable<any>;
      tbRemoveAllAggregations(total: number): Chainable<any>;
      tbIsUpdateAggregationSettingsEnabled(): Chainable<any>;
      tbIsUpdateAggregationSettingsDisabled(): Chainable<any>;
      tbDiscardAggregationSettings(): Chainable<any>;
      tbUpdateAggregationSettings(): Chainable<any>;
      // Inspector
      tbOpenInspector(): Chainable<any>;
      tbCloseInspector(): Chainable<any>;
      tbGetTableDataFromInspectPanel(): Chainable<any>;
      // Functions for data panel
      tbOpenDataPanel(): Chainable<any>;
      tbToggleOpenEditor(id: number): Chainable<any>;
      tbAddMetricsAggregation(): Chainable<any>;
      tbAddBucketsAggregation(): Chainable<any>;
      tbSplitRows(): Chainable<any>;
      tbSplitTables(): Chainable<any>;
      tbSplitTablesInRows(): Chainable<any>;
      tbSplitTablesInColumns(): Chainable<any>;
      tbSelectAggregationType(agg: string, id: number): Chainable<any>;
      tbSelectSubAggregationType(agg: string, id: number, type: string): Chainable<any>;
      tbSelectAggregationField(field: string, id: number): Chainable<any>;
      tbSelectSubAggregationField(field: string, id: number, type: string): Chainable<any>;
      // Functions for buckets aggregation
      // Histogram Aggregation
      tbEnableHistogramInterval(id:number): Chainable<any>;
      tbSetHistogramInterval(interval: string, id: number): Chainable<any>;
      tbIsHistogramIntervalSet(interval: string, id: number): Chainable<any>;
      tbSetupHistogramAggregation(field: string, interval: string, id: number): Chainable<any>;
      // Terms Aggregation
      tbToggleOtherBucket(request: string): Chainable<any>;
      tbToggleMissingBucket(request: string): Chainable<any>;
      tbSetupTermsAggregation(field: string, sort: string, size: string, id: number): Chainable<any>;
      // Range Aggregation
      tbAddRange(): Chainable<any>;
      tbSetupRange(range: Array<Array<string>>, id: number): Chainable<any>;
      tbSetupRangeAggregation(field: string, range: Array<Array<string>>, id: number): Chainable<any>;
      // Date Histogram
      tbSetupMinimumlInterval(interval: string, id: number): Chainable<any>;
      tbSetupDateHistogramAggregation(field: string, interval: string, id: number): Chainable<any>;
      // Functions for table visualizations
      tbGetTableDataFromVisualization(): Chainable<any>;
      tbGetAllTableDataFromVisualization(total: number): Chainable<any>;
      tbGetTotalValueFromTable(): Chainable<any>;
      tbSelectSortColumn(tableIndex: number, colIndex: number, dir: string): Chainable<any>;
      tbGetColumnWidth(tableIndex: number, colIndex: number, name: string): Chainable<any>;
      tbAdjustColumnWidth(totalColumn: number, tableIndex: number, colIndex: number, size: number): Chainable<any>;
      tbClickTableCellAction(tableIndex: number, totalColumn: number, rowIndex: number, colIndex: number, action: string): Chainable<any>;
      tbClickFilterFromExpand(action: string): Chainable<any>;
      // Functions for Options Panel
      tbOpenOptionsPanel(): Chainable<any>;
      tbToggleOptionByName(option: string, request: string): Chainable<any>;
      tbSelectTotalFunctionByName(fun: string): Chainable<any>;
      tbSelectPercentageColumn(agg: string): Chainable<any>;
    }
  }
