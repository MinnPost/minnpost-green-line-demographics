/**
 * Simple script to get the green line.
 */
var fs = require('fs');
var path = require('path');
var routes = require('../data/metrotransit-routes.geo.json');
var greenLine = '902';
var outputFile = path.join(__dirname, '../data/metrotransit-green-line.geo.json');
var output;

// Go through and find the Green line
routes.features.forEach(function(f, fi) {
  if (f.properties.route === greenLine) {
    output = f;
  }
});

// Add crs for reference
output.crs = routes.crs

// Save as file
fs.writeFile(outputFile, JSON.stringify(output, null, 2), function(error) {
  if (error) {
    console.error(error);
  }
  else {
    console.log('Green Line GeoJSON saved found and save.');
  }
});
