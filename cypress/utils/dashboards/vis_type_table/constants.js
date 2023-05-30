/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';

// Data
export const TABLE_INDEX_PATTERN = 'index-pattern-vis-table';
export const TABLE_INDEX_ID = 'vis-table';
export const TABLE_INDEX_DATA = 'table.data.txt';
export const TABLE_SO_DATA = 'table_saved_objects.ndjson';
export const TABLE_PATH_FIXTURE =
  'dashboard/opensearch_dashboards/vis_type_table/';
export const TABLE_PATH_INDEX_DATA = TABLE_PATH_FIXTURE + TABLE_INDEX_DATA;
export const TABLE_PATH_SO_DATA = TABLE_PATH_FIXTURE + TABLE_SO_DATA;
export const TABLE_INDEX_DOC_COUNT = '10,000';
export const TABLE_INDEX_START_TIME = 'Dec 31, 2021 @ 00:00:00.000';
export const TABLE_INDEX_END_TIME = 'Oct 2, 2022 @ 00:00:00.000';
export const TABLE_BASIC_VIS_TITLE = 'TABLE: Basic';
// App URL Paths
export const TABLE_VIS_APP_PATH = '/app/visualize';
export const TABLE_CREATE_URL = `${BASE_PATH}${TABLE_VIS_APP_PATH}#/create?type=table&indexPattern=${TABLE_INDEX_PATTERN}`;
// Type
export const TABLE_VIS_TYPE = 'visualization';
// Aggregation
export const TABLE_OPTIONS = [
  'showPartialRows',
  'showMetricsAtAllLevels',
  'showTotal',
];
export const TABLE_TOTAL_FUNCTIONS = ['Sum', 'Average', 'Min', 'Max', 'Count'];
