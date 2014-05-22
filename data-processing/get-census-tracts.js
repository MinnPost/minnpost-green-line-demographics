/**
 * Get data from Census Reporter.
 */

var tracts = require('../data/green-line-census-tracts.json');
var tables = [''];


console.log('http://api.censusreporter.org/1.0/data/download/latest?table_ids=B03001&geo_ids=' + tracts.join(',') + '&format=geojson');
