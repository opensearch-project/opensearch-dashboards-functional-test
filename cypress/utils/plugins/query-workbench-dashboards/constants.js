/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const QUERY_WORKBENCH_DELAY = 1000;

export const testDataSet = [
  {
    url: 'https://raw.githubusercontent.com/opensearch-project/sql/main/integ-test/src/test/resources/accounts.json',
    index: 'accounts',
  },
  {
    url: 'https://raw.githubusercontent.com/opensearch-project/sql/main/integ-test/src/test/resources/employee_nested.json',
    index: 'employee_nested',
  },
];

export const verifyDownloadData = [
  {
    title: 'Download and verify JDBC',
    url: 'api/sql_console/sqlquery',
    file: 'JDBCFile',
  },
  {
    title: 'Download and verify CSV',
    url: 'api/sql_console/sqlcsv',
    file: 'CSVFile',
  },
  {
    title: 'Download and verify Text',
    url: 'api/sql_console/sqltext',
    file: 'TextFile',
  },
];

export const testQueries = [
  {
    title: 'Test GROUP BY',
    query: 'select count(*) from accounts group by gender;',
    cell_idx: 3,
    expected_string: '493',
  },
  {
    title: 'Test GROUP BY with aliases and scalar function',
    query: 'SELECT ABS(age) AS a FROM accounts GROUP BY ABS(age);',
    cell_idx: 17,
    expected_string: '27',
  },
  {
    title: 'Test GROUP BY and HAVING',
    query:
      'SELECT age, MAX(balance) FROM accounts GROUP BY age HAVING MIN(balance) > 3000;',
    cell_idx: 5,
    expected_string: '49119',
  },
  {
    title: 'Test ORDER BY',
    query: 'SELECT account_number FROM accounts ORDER BY account_number DESC;',
    cell_idx: 5,
    expected_string: '998',
  },
  {
    title: 'Test JOIN',
    query:
      'select a.account_number, a.firstname, a.lastname, e.id, e.name from accounts a join employee_nested e order by a.account_number;',
    cell_idx: 45,
    expected_string: 'Duke',
  },
];

export const files = {
  JDBCFile: `{"schema":[{"name":"account_number","type":"long"},{"name":"firstname","type":"text"},{"name":"address","type":"text"},{"name":"balance","type":"long"},{"name":"gender","type":"text"},{"name":"city","type":"text"},{"name":"employer","type":"text"},{"name":"state","type":"text"},{"name":"age","type":"long"},{"name":"email","type":"text"},{"name":"lastname","type":"text"}],"datarows":[[97,"Karen","512 Cumberland Walk",49671,"F","Fredericktown","Tsunamia","MO",40,"karentrujillo@tsunamia.com","Trujillo"],[168,"Carissa","975 Flatbush Avenue",49568,"M","Neibert","Zillacom","IL",20,"carissasimon@zillacom.com","Simon"],[240,"Oconnor","659 Highland Boulevard",49741,"F","Kilbourne","Franscene","NH",35,"oconnorclay@franscene.com","Clay"],[248,"West","717 Hendrickson Place",49989,"M","Maury","Obliq","WA",36,"westengland@obliq.com","England"],[803,"Marissa","963 Highland Avenue",49567,"M","Bloomington","Centregy","MS",25,"marissaspears@centregy.com","Spears"],[842,"Meagan","833 Bushwick Court",49587,"F","Craig","Biospan","TX",23,"meaganbuckner@biospan.com","Buckner"],[854,"Jimenez","603 Cooper Street",49795,"F","Moscow","Verton","AL",25,"jimenezbarry@verton.com","Barry"]],"total":7,"size":7,"status":200}`,
  CSVFile: `account_number,firstname,address,balance,gender,city,employer,state,age,email,lastname
97,Karen,512 Cumberland Walk,49671,F,Fredericktown,Tsunamia,MO,40,karentrujillo@tsunamia.com,Trujillo
168,Carissa,975 Flatbush Avenue,49568,M,Neibert,Zillacom,IL,20,carissasimon@zillacom.com,Simon
240,Oconnor,659 Highland Boulevard,49741,F,Kilbourne,Franscene,NH,35,oconnorclay@franscene.com,Clay
248,West,717 Hendrickson Place,49989,M,Maury,Obliq,WA,36,westengland@obliq.com,England
803,Marissa,963 Highland Avenue,49567,M,Bloomington,Centregy,MS,25,marissaspears@centregy.com,Spears
842,Meagan,833 Bushwick Court,49587,F,Craig,Biospan,TX,23,meaganbuckner@biospan.com,Buckner
854,Jimenez,603 Cooper Street,49795,F,Moscow,Verton,AL,25,jimenezbarry@verton.com,Barry`,
  TextFile: `account_number|firstname|address|balance|gender|city|employer|state|age|email|lastname
97|Karen|512 Cumberland Walk|49671|F|Fredericktown|Tsunamia|MO|40|karentrujillo@tsunamia.com|Trujillo
168|Carissa|975 Flatbush Avenue|49568|M|Neibert|Zillacom|IL|20|carissasimon@zillacom.com|Simon
240|Oconnor|659 Highland Boulevard|49741|F|Kilbourne|Franscene|NH|35|oconnorclay@franscene.com|Clay
248|West|717 Hendrickson Place|49989|M|Maury|Obliq|WA|36|westengland@obliq.com|England
803|Marissa|963 Highland Avenue|49567|M|Bloomington|Centregy|MS|25|marissaspears@centregy.com|Spears
842|Meagan|833 Bushwick Court|49587|F|Craig|Biospan|TX|23|meaganbuckner@biospan.com|Buckner
854|Jimenez|603 Cooper Street|49795|F|Moscow|Verton|AL|25|jimenezbarry@verton.com|Barry`,
};
