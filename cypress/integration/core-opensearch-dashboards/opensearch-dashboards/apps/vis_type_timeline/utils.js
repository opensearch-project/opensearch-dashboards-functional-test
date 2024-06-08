/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { TL_CHAINABLE_EXPRESSION } from '../../../../../utils/constants';

export const constructTimelineExpression = ({
  indexName,
  avgMetricName,
  timefield,
  dataSourceName,
}) => {
  const openSearchFunction = dataSourceName
    ? `.opensearch(index=${indexName}, metric=avg:${avgMetricName}, timefield=${timefield}, data_source_name="${dataSourceName}")`
    : `.opensearch(index=${indexName}, metric=avg:${avgMetricName}, timefield=${timefield})`;

  return `${openSearchFunction}${TL_CHAINABLE_EXPRESSION}.yaxis(label="Average ${avgMetricName}")`;
};
