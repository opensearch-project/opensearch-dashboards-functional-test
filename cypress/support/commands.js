/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
  failureThreshold: 0.05, // threshold for entire image
  failureThresholdType: 'percent', // percent of image or number of pixels
  capture: 'viewport', // capture viewport in screenshot
});
