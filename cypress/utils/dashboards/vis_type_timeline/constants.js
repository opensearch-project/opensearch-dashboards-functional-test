/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../base_constants';

// Data
export const TL_INDEX_DATA = 'vis-timeline.data.txt';
export const TL_PATH_FIXTURE =
  'dashboard/opensearch_dashboards/vis_type_timeline/';
export const TL_PATH_INDEX_DATA = TL_PATH_FIXTURE + TL_INDEX_DATA;
export const TL_INDEX_START_TIME = 'Dec 31, 2021 @ 00:00:00.000';
export const TL_INDEX_END_TIME = 'Oct 2, 2022 @ 00:00:00.000';
export const TL_INDEX_ID = 'vis-timeline';
export const TL_INDEX_PATTERN = 'index-pattern-vis-timeline';

// App URL Paths
export const TL_VIS_APP_PATH = '/app/visualize';
export const TL_CREATE_URL = `${BASE_PATH}${TL_VIS_APP_PATH}#/create?type=timelion`; // URL pattern still uses Timelion

// Visualization
export const TL_CHAINABLE_EXPRESSION = '.lines(show=true)';
export const TL_ERROR_TOAST_MESSAGE_CLASSES =
  '.euiToast.euiToast--danger.euiGlobalToastListItem';
export const TL_ERROR_TOAST_MESSAGE_CLOSE_BUTTON =
  'button.euiToast__closeButton';
