/**
 * Simple script to get the green line and stops from the larger dataset.
 */
var fs = require('fs');
var path = require('path');

var routes = require('../data/metrotransit-routes.geo.json');
var stops = require('../data/metrotransit-planned-stops.geo.json');

var greenLineRoute = '902';
var greenLineStops = ['Blue / Green', 'Green Line'];
var routeOutput = path.join(__dirname, '../data/metrotransit-green-line.geo.json');
var stopsOutput = path.join(__dirname, '../data/metrotransit-green-line-stops.geo.json');



// Go through and find the Green line routes
routes.features = routes.features.filter(function(r, ri) {
  return (r.properties.route === greenLineRoute);
});

// Save as file
fs.writeFile(routeOutput, JSON.stringify(routes, null, 2), function(error) {
  if (error) {
    console.error(error);
  }
  else {
    console.log('Green Line route GeoJSON found and saved.');
  }
});



// Go through and find the Green line routes
stops.features = stops.features.filter(function(s, si) {
  return (greenLineStops.indexOf(s.properties.Transitway) !== -1);
});

// Save as file
fs.writeFile(stopsOutput, JSON.stringify(stops, null, 2), function(error) {
  if (error) {
    console.error(error);
  }
  else {
    console.log('Green Line stops GeoJSON filtered and saved ' + stops.features.length + ' stops.');
  }
});
