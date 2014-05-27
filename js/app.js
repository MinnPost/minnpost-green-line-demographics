/**
 * Main application file for: minnpost-green-line-demographics
 *
 * This pulls in all the parts
 * and creates the main object for the application.
 */

// Create main application
define('minnpost-green-line-demographics', [
  'jquery', 'underscore', 'd3', 'topojson', 'mpConfig', 'mpFormatters',
  'helpers',
  'text!templates/application.mustache'
], function(
  $, _, d3, topojson, mpConfig, mpFormatters,
  helpers,
  tApplication
  ) {

  // Constructor for app
  var App = function(options) {
    this.options = _.extend(this.defaultOptions, options);
    this.el = this.options.el;
    this.$el = $(this.el);
    this.$ = function(selector) { return this.$el.find(selector); };
    this.$content = this.$el.find('.content-container');
    this.loadApp();
  };

  // Extend with custom methods
  _.extend(App.prototype, {
    // Start function
    start: function() {
      var thisApp = this;
      this.templateApplication = _.template(tApplication);
      this.$el.html(this.templateApplication({}));

      // The DOM creation with underscore templating is
      // not synchronous, so we hack around it
      _.delay(function() {
        // Get data then build app
        thisApp.getData().done(function() {
          thisApp.buildMap();
        });
      }, 200);
    },

    // Build base D3 Map
    buildMap: function() {
      var $container = this.$el.find('#green-line-map');
      var width = $container.width();
      var height = $container.height();

      // Make canvas
      var svg = d3.select($container[0]).append('svg')
        .attr('width', width)
        .attr('height', height);

      // Make projection and path handler
      var projectionData = this.data.greenLine;
      var centroid = d3.geo.centroid(projectionData);
      var projection = d3.geo.albersUsa()
        .scale(150)
        .translate([width / 2, height / 2]);
      var projectionPath = d3.geo.path().projection(projection)
        .pointRadius(function(d) { return 0.0015; });

      // Make group for features
      var featureGroup = svg.append('g').attr('class', 'feature-group');

      // Fit map to data
      var b = projectionPath.bounds(projectionData);
      featureGroup.attr('transform',
        'translate(' + projection.translate() + ') ' +
        'scale(' + 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height) + ') ' +
        'translate(' + -(b[1][0] + b[0][0]) / 2 + ',' + -(b[1][1] + b[0][1]) / 2 + ')');

      // Add Census tracts
      featureGroup.selectAll('.census-tract')
        .data(topojson.feature(this.data.tracts, this.data.tracts.objects['census-tracts.geo']).features)
        .enter()
          .append('path')
          .attr('class', 'census-tract')
          .attr('d', projectionPath);

      // Add landmarks
      featureGroup.selectAll('.landmark-feature')
        .data(topojson.feature(this.data.landmarks, this.data.landmarks.objects['landmarks.geo']).features)
        .enter()
          .append('path')
          .attr('class', function(d) {
            return 'landmark-feature ' + d.properties.type;
          })
          .attr('d', projectionPath);

      // Add green line route
      featureGroup.selectAll('.greenline-route')
        .data(this.data.greenLine.features)
        .enter()
          .append('path')
          .attr('class', 'greenline-route')
          .attr('d', projectionPath);

      // Add stops
      featureGroup.selectAll('.stop')
        .data(this.data.stops.features)
        .enter()
          .append('path')
          .attr('class', 'stop')
          .attr('d', projectionPath);

    },

    // Get data sources
    getData: function() {
      var thisApp = this;

      return helpers.getLocalData([
        'metrotransit-green-line.geo.json',
        'metrotransit-green-line-stops.geo.json',
        'landmarks.topo.json',
        'census-tracts.topo.json'
      ], this.options)
        .done(function(a, b, c, d) {
          thisApp.data = thisApp.data || {};
          thisApp.data.greenLine = a[0];
          thisApp.data.stops = b[0];
          thisApp.data.landmarks = c[0];
          thisApp.data.tracts = d[0];

          // Remove loading
          thisApp.$el.find('.loading-container').slideUp('fast');
        });
    },

    // Default options
    defaultOptions: {
      projectName: 'minnpost-green-line-demographics',
      remoteProxy: null,
      el: '.minnpost-green-line-demographics-container',
      availablePaths: {
        local: {

          css: ['.tmp/css/main.css'],
          images: 'images/',
          data: 'data/'
        },
        build: {
          css: [
            '//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css',
            'dist/minnpost-green-line-demographics.libs.min.css',
            'dist/minnpost-green-line-demographics.latest.min.css'
          ],
          ie: [
            'dist/minnpost-green-line-demographics.libs.min.ie.css',
            'dist/minnpost-green-line-demographics.latest.min.ie.css'
          ],
          images: 'dist/images/',
          data: 'dist/data/'
        },
        deploy: {
          css: [
            '//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css',
            'https://s3.amazonaws.com/data.minnpost/projects/minnpost-green-line-demographics/minnpost-green-line-demographics.libs.min.css',
            'https://s3.amazonaws.com/data.minnpost/projects/minnpost-green-line-demographics/minnpost-green-line-demographics.latest.min.css'
          ],
          ie: [
            'https://s3.amazonaws.com/data.minnpost/projects/minnpost-green-line-demographics/minnpost-green-line-demographics.libs.min.ie.css',
            'https://s3.amazonaws.com/data.minnpost/projects/minnpost-green-line-demographics/minnpost-green-line-demographics.latest.min.ie.css'
          ],
          images: 'https://s3.amazonaws.com/data.minnpost/projects/minnpost-green-line-demographics/images/',
          data: 'https://s3.amazonaws.com/data.minnpost/projects/minnpost-green-line-demographics/data/'
        }
      }
    },

    // Load up app
    loadApp: function() {
      this.determinePaths();
      this.getLocalAssests(function(map) {
        this.renderAssests(map);
        this.start();
      });
    },

    // Determine paths.  A bit hacky.
    determinePaths: function() {
      var query;
      this.options.deployment = 'deploy';

      if (window.location.host.indexOf('localhost') !== -1) {
        this.options.deployment = 'local';

        // Check if a query string forces something
        query = helpers.parseQueryString();
        if (_.isObject(query) && _.isString(query.mpDeployment)) {
          this.options.deployment = query.mpDeployment;
        }
      }

      this.options.paths = this.options.availablePaths[this.options.deployment];
    },

    // Get local assests, if needed
    getLocalAssests: function(callback) {
      var thisApp = this;

      // If local read in the bower map
      if (this.options.deployment === 'local') {
        $.getJSON('bower.json', function(data) {
          callback.apply(thisApp, [data.dependencyMap]);
        });
      }
      else {
        callback.apply(this, []);
      }
    },

    // Rendering tasks
    renderAssests: function(map) {
      var isIE = (helpers.isMSIE() && helpers.isMSIE() <= 8);

      // Add CSS from bower map
      if (_.isObject(map)) {
        _.each(map, function(c, ci) {
          if (c.css) {
            _.each(c.css, function(s, si) {
              s = (s.match(/^(http|\/\/)/)) ? s : 'bower_components/' + s + '.css';
              $('head').append('<link rel="stylesheet" href="' + s + '" type="text/css" />');
            });
          }
          if (c.ie && isIE) {
            _.each(c.ie, function(s, si) {
              s = (s.match(/^(http|\/\/)/)) ? s : 'bower_components/' + s + '.css';
              $('head').append('<link rel="stylesheet" href="' + s + '" type="text/css" />');
            });
          }
        });
      }

      // Get main CSS
      _.each(this.options.paths.css, function(c, ci) {
        $('head').append('<link rel="stylesheet" href="' + c + '" type="text/css" />');
      });
      if (isIE) {
        _.each(this.options.paths.ie, function(c, ci) {
          $('head').append('<link rel="stylesheet" href="' + c + '" type="text/css" />');
        });
      }

      // Add a processed class
      this.$el.addClass('processed');
    }
  });

  return App;
});


/**
 * Run application
 */
require(['jquery', 'minnpost-green-line-demographics'], function($, App) {
  $(document).ready(function() {
    var app = new App();
  });
});
