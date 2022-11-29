# Writing tests

Most features added to OpenSearch Dashboards and its Plugins will require functional tests. Many of it components are quite similar. This doc should make it easier to setup your test correctly and make the test more useful and follow best practices.


- [Writing tests](#writing-tests)
  - [Adding and using data](#adding-and-using-data)
    - [Generating/Using test data](#generatingusing-test-data)
      - [Generating data with script](#generating-data-with-script)
    - [Indexing data](#indexing-data)
      - [Upload](#upload)
    - [Createing an index pattern](#createing-an-index-pattern)
    - [Cleaning up data](#cleaning-up-data)
  - [Saved objects](#saved-objects)
    - [Generating seed saved objects](#generating-seed-saved-objects)
    - [Seeding saved object data](#seeding-saved-object-data)
  - [Useful commands](#useful-commands)
  - [Best practices](#best-practices)


## Adding and using data

Very often in our tests we need specific data in our indices for our tests to run correctly. This usually involves 4 steps:

1. Generating Data
2. Indexing data
3. Creating an index pattern for the data
4. Cleaning up data and index patterns

Here is how you can add and manage data for your tests.

### Generating/Using test data

You can create test data using any common scripting language that outputs data in the [ndjson](https://github.com/ndjson/ndjson-spec) format. e.g.

```json
{"index":{"_id":0}}
{"timestamp":"2022-01-10T00:00:00.000Z","username":"Hershel62","email":"Isaiah.Crooks37@yahoo.com",}
{"index":{"_id":1}}
{"timestamp":"2022-01-10T01:00:00.000Z","username":"Velva.Schaden","email":"Fern.Bernhard21@gmail.com"}
```

And add them to the appropriate fixture folder in `./cypress/fixtures`. Alternatively you can also use any test fixture that meets your needs inside the fixtures folder, although it is best to avoid that since that fixture may change in future if it was not explicitly marked for use by your feature and break tests.

To generate data that does not change, you can use the generate data script in `scripts/generate_data` to create consistent custom data for your tests.

#### Generating data with script

You can use the genertae data script to generate consistent data for your tests. You can add your custom document generation function to generate any shape of data that you need. To use the script, run

```sh
npm run generate:test-data -- vis_builder "cypress/fixtures/dashboard/opensearch_dashboards/"
```

Here `vis_builder` is the name of the index. To see all options provided, run `npm run generate:test-data -- --help`

To create a custom data model, refer `scripts/generate_data/create_vis_builder_data.js`

### Indexing data

You will need to index your data both while writing your tests and to create the necessary saved object data. For the latter, simply use the `cy.bulkUploadDocs` command. e.g.

```ts
cy.bulkUploadDocs('fixture_path', index_id)
```

But to upload data to test various scenarios and generate saved object test fixtures use the bulk api to index the generated data.

#### Upload

To upload your data and consume it within Dashboards, you can use the bulk api in your terminal (src: https://opensearch.org/docs/latest/opensearch/index-data/#introduction-to-indexing). 
If you do not care about the mapping for your test data, just upload the test data. This will automatically map the data and create the index pattern.

```sh
# Upload Data
curl -H "Content-Type: application/x-ndjson" -POST http://localhost:9200/data/_bulk --data-binary "@path_to_data"

# Verify (Jq to pretty print response)
curl http://localhost:9200/{index_name} | jq
```

> If you need to cleanup the data, just change the GET verify call to a DELETE call

If you want specific datatypes for your index fields, you can manually create the mappings for your data and then ingest the data

This involves you using the Dashboards dev tools to make our lives easier while creating the data

First create index with desired mapping in dev tools(Only map the fields you want to override the default mapping for. This must be done before uploading the data). e.g. 
```sh
PUT vis-builder
{
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date"
      },
      "age": {
        "type": "integer"
      },
      "salary": {
        "type": "integer"
      }
    }
  }
}
```

Then upload the data as mentioned earlier.

### Createing an index pattern

Creating an index pattern can be achieved using the command

```ts
cy.createIndexPattern(INDEX_PATTERN_ID, {
    title: INDEX_PATTERN,
    timeFieldName?: 'timestamp',
});
```

### Cleaning up data

Depending on whether you want to delete your index pattern, indexed data or both you have two separate commands available to do this

To delete an index pattern
```ts
cy.deleteIndexPattern(INDEX_PATTERN_ID);
```

To delete an index
```ts
cy.deleteIndex(INDEX_ID);
```

> Note: If you are not cleaning up your data, but continue to index the same data in other tests, make sure that the id for your documents are defined so that new records arent created for every run that might result in flakey tests depending on the order of the tests.

## Saved objects

Data in OpenSearch Dashboards is primarily persisted using saved objects. To ensure the repeatability of tests, it is sometimes necessary to seed this data in our tests. To do this we need to generate test seed data and then import the saved object.

### Generating seed saved objects

First index the data that you need to create the appropriate saved objects for. This is optional if your saved objects dont rely on index data.

Then create the saved objects in your test instance and export them from the saved object manager under `Stack Management > Saved Objects`. 

> Note: Remember to uncheck the "Include related objects" flag if you do not wish to export the saved objects that it references (Checked by default).

### Seeding saved object data

To seed the saved object data for your tests, use the command

```ts
cy.importSavedObject('fixture_path', overwrite?: true)
```

## Useful commands

Many other useful commands have been defined under the `./cypress/utils` folder. Many of them have also been typed so that your IDE can auto suggest them, but it is not a complete list. To see the all the available commands, explore the `**/commands.js` files in there. And if possible add their types to the corresponding `**/index.d.ts` files.

## Best practices

Please refer to Cypress's documentation on best practices for writing test at https://docs.cypress.io/guides/references/best-practices