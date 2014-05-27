/**
 * Get data from Census Reporter.
 */

// Modules
var fs = require('fs');
var path = require('path');
var request = require('request');

// Data
var tracts = require('../data/census-tracts-ids.json');

// Variables
var tables = ['B01003'];
var acsGroup = 'acs2012_5yr';
var geomUrl = 'http://api.censusreporter.org/1.0/geo/tiger2012/[[[GEOM_ID]]]?geom=true';
var dataUrl = 'http://api.censusreporter.org/1.0/data/show/[[[ACS_GROUP]]]?table_ids=[[[TABLE_IDS]]]&geo_ids=[[[GEOM_IDS]]]';
var geometryOutput = path.join(__dirname, '../data/census-tracts.geo.json');
var dataOutput = path.join(__dirname, '../data/census-tracts-tables.geo.json');
var censusGeoJSON;
var censusData;




// Let's get geometries first
censusGeoJSON = { type: 'FeatureCollection', features: [] };
function geometriesRecieved(geometry) {
  censusGeoJSON.features.push(geometry);
  if (censusGeoJSON.features.length >= tracts.length) {
    // Save file
    fs.writeFile(geometryOutput, JSON.stringify(censusGeoJSON, null, 2), function(error) {
      if (error) {
        console.error(error);
      }
      else {
        console.log('Census tracts GeoJSON created.');
      }
    });
  }
}

// Go through each tract, get geometry, and then test if we have them all
tracts.forEach(function(t, ti) {
  url = geomUrl.replace('[[[GEOM_ID]]]', t);
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      geometriesRecieved(JSON.parse(body));
    }
    else {
      console.error(error);
    }
  });
});



// Get census table data
url = dataUrl.replace('[[[ACS_GROUP]]]', acsGroup);
url = url.replace('[[[TABLE_IDS]]]', tables.join(','));
url = url.replace('[[[GEOM_IDS]]]', tracts.join(','));
request(url, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    fs.writeFile(dataOutput, JSON.stringify(JSON.parse(body), null, 2), function(error) {
      if (error) {
        console.error(error);
      }
      else {
        console.log('Census table data created.');
      }
    });
  }
  else {
    console.error(error);
  }
});
