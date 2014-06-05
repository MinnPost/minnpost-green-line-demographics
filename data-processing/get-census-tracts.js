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
// Median household income: B19013
// White alone: B02008
// Total population: B01003
// Means of transportation to work: B08301
var tables = ['B19013', 'B02008', 'B01003', 'B08301'];
var acsGroup = 'acs2012_5yr';
var geomUrl = 'http://api.censusreporter.org/1.0/geo/tiger2012/[[[GEOM_ID]]]?geom=true';
var dataUrl = 'http://api.censusreporter.org/1.0/data/show/[[[ACS_GROUP]]]?table_ids=[[[TABLE_IDS]]]&geo_ids=[[[GEOM_IDS]]]';
var geometryOutput = path.join(__dirname, '../data/census-tracts.geo.json');



// Get gemoetries
function getGeometries(censusData) {
  var censusGeoJSON = { type: 'FeatureCollection', features: [] };

  // Handle reciving geometry
  function geometriesRecieved(geometry) {
    censusGeoJSON.features.push(geometry);

    // Save if we have all
    if (censusGeoJSON.features.length >= tracts.length) {
      // Match census data with gemoetries
      censusGeoJSON.features.forEach(function(f, fi) {
        f.properties.data = censusData[f.properties.full_geoid];
      });

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

  // Go through each tract and add to collection
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
}


// Get census table data
url = dataUrl.replace('[[[ACS_GROUP]]]', acsGroup)
  .replace('[[[TABLE_IDS]]]', tables.join(','))
  .replace('[[[GEOM_IDS]]]', tracts.join(','));

request(url, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var data = JSON.parse(body).data;

    // Filter out only the parts we really need.
    // B08301010 is public transporation column
    Object.keys(data).forEach(function(tract, i) {
      data[tract].B08301.estimate = {
        'B08301010': data[tract].B08301.estimate.B08301010
      };
      data[tract].B08301.error = {
        'B08301010': data[tract].B08301.error.B08301010
      };

      // Normalize by population
      var population = data[tract].B01003.estimate.B01003001;
      data[tract].B02008.by_population = {};
      data[tract].B02008.by_population.B02008001 = data[tract].B02008.estimate.B02008001 / population;
      data[tract].B08301.by_population = {};
      data[tract].B08301.by_population.B08301010 = data[tract].B08301.estimate.B08301010 / population;
    });

    // Get geomoetries and put with data
    getGeometries(data);
  }
  else {
    console.error(error);
  }
});
