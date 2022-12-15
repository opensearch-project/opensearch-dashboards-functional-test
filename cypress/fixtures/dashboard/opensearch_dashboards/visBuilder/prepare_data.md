# Prepare Test data

It may be required to generate the same test data in future with some modifications. In that case, to cause minimal disruption to exsiting tests, follow the following steps.

## Index data

### Generate

To generate test index data, use the generate index data script. The index name is `vis-builder`. The index name is associated directly with the data

```sh
npm run generate:test-data -- vis-builder \
  ./cypress/fixtures/dashboard/opensearch_dashboards/visBuilder 

# or
npm run generate:test-data -- vis-builder \
  ./cypress/fixtures/dashboard/opensearch_dashboards/visBuilder \
  -g basic \
  -n '10000' \
  -st '2022-01-01T00:00:00.000' \
  -et '2022-10-01T00:00:00.000'
```

> Use predictable data over random data whenever possible to generate reliable visualizations

### Upload data

Refer to [writing_tests.md](../../../../../docs/writing_tests.md)

## Saved object data

VisBuilder uses the following objects for its tests

### Index Pattern:
- Name: vis-builder
- timeFieldName: timestamp

To create this index pattern, navigate to `Stack Management > Index Patterns > Create Index Pattern` and create an index pattern with the above name and title


> Old

To genrate this index pattern, use the following command in the terminal

```sh
curl 'http://localhost:5601/api/saved_objects/index-pattern/vis-builder' \
  -H 'Content-Type: application/json' \
  -H 'osd-xsrf: true' \
  --data-raw '{"attributes":{"title":"opensearch*","timeFieldName":"timestamp"}}' \
  --compressed
```

### Saved Search

Set the time to a day before the start timestamp of the data and the end date to a day after the end timestamp in the data. This is to account for timezone variations.

Name: VB: Time Range

### Visualizations:

1. Bar Chart

Y axis Media Salary, X Axis Datehistogram for timestamp

Title: VB: Basic Bar Chart  
Description: Visualization Builder: Basic Bar Chart

2. Metric Chart

Any non empty metric will suffice
   
Title: VB: Basic Metric Chart  
Description: Visualization Builder: Basic Metric Chart

3. Line Chart

Y Axis: Count

Title: VB: Basic Line Chart  
Description: Visualization Builder: Basic Line Chart

4. Non Vis builder chart

Any chart that isnt built using VisBuilder but uses the `vis-builder` index pattern

Title: VB: Non VB Vis  
Description: A non VisBuilder visualization

### Dashboards:

A Dashboard with the Bar and metric chart from above. Do not add the line chart.

Title: VB: Dashboard  
Description: Visualization Builder: Basic Dashboard

### Exporting data


Export the data from `Stack Management >  Saved Objects`

In the tests, we want to avoid clicking through a bunch of menus to reach the data. In these cases we want to directly access the visualizations and dashboards using their ID's. We can find these ID's by inspecting the exported saved object data or using the saved object API:

```sh
curl 'http://localhost:5601/api/opensearch-dashboards/management/saved_objects/_find?search=VB*&perPage=50&page=1&fields=id&type=config&type=url&type=index-pattern&type=query&type=dashboard&type=visualization&type=visualization-visbuilder&type=search&sortField=type' \
| jq '.saved_objects[] | {id: .id, title: .meta.title, type: .type}'
```

Update the corresponding ID's in `cypress/utils/dashboards/vis_builder/constants.js` 