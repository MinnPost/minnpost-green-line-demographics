
/**
 * Helpers functions such as formatters or extensions
 * to libraries.
 */
define('helpers', ['jquery', 'underscore'],
  function($, _) {

  var helpers = {};

  /**
   * Override Backbone's ajax call to use JSONP by default as well
   * as force a specific callback to ensure that server side
   * caching is effective.
   */
  helpers.overrideBackboneAJAX = function() {
    Backbone.ajax = function() {
      var options = arguments;

      if (options[0].dataTypeForce !== true) {
        options[0].dataType = 'jsonp';
        options[0].jsonpCallback = 'mpServerSideCachingHelper' +
          _.hash(options[0].url);
      }
      return Backbone.$.ajax.apply(Backbone.$, options);
    };
  };

  /**
   * Returns version of MSIE.
   */
  helpers.isMSIE = function() {
    var match = /(msie) ([\w.]+)/i.exec(navigator.userAgent);
    return match ? parseInt(match[2], 10) : false;
  };

  /**
   * Wrapper for a JSONP request, the first set of options are for
   * the AJAX request, while the other are from the application.
   */
  helpers.jsonpRequest = function(requestOptions, appOptions) {
    var options = requestOptions || {};
    options.dataType = 'jsonp';

    /*
    options.jsonpCallback = 'mpServerSideCachingHelper' +
      _.hash(options.url);

    if (appOptions.remoteProxy) {
      options.url = options.url + '&callback=mpServerSideCachingHelper';
      options.url = appOptions.remoteProxy + encodeURIComponent(options.url);
      options.cache = true;
    }
    */

    return $.ajax.apply($, [options]);
  };

  /**
   * Data source handling.  For development, we can call
   * the data directly from the JSON file, but for production
   * we want to proxy for JSONP.
   *
   * `name` should be relative path to dataset
   * `options` are app options
   *
   * Returns jQuery's defferred object.
   */
  helpers.getLocalData = function(name, options) {
    var useJSONP = false;
    var defers = [];
    name = (_.isArray(name)) ? name : [ name ];

    // If the data path is not relative, then use JSONP
    if (options && options.paths && options.paths.data.indexOf('http') === 0) {
      useJSONP = true;
    }

    // Go through each file and add to defers
    _.each(name, function(d) {
      var defer;

      if (useJSONP) {
        defer = helpers.jsonpRequest({
          url: options.remoteProxy + encodeURI(options.paths.data + d)
        }, options);
      }
      else {
        defer = $.getJSON(options.paths.data + d);
      }
      defers.push(defer);
    });

    return $.when.apply($, defers);
  };

  /**
   * Reads query string and turns into object.
   */
  helpers.parseQueryString = function() {
    var assoc  = {};
    var decode = function(s) {
      return decodeURIComponent(s.replace(/\+/g, " "));
    };
    var queryString = location.search.substring(1);
    var keyValues = queryString.split('&');

    _.each(keyValues, function(v, vi) {
      var key = v.split('=');
      if (key.length > 1) {
        assoc[decode(key[0])] = decode(key[1]);
      }
    });

    return assoc;
  };

  return helpers;
});


define('text!templates/application.underscore',[],function () { return '<div class="application-container">\n  <div class="message-container"></div>\n\n  <div class="content-container">\n\n    <div class="loading-container">\n      <i class="loading"></i> Loading...\n    </div>\n\n    <div class="demographics-chooser cf">\n      <div class="demographic pop <%= (currentSet == \'pop\') ? \'active\' : \'\' %>" data-set="pop">\n        <div class="inside">\n          <div class="strong">Population density</div>\n          <div class="caption">Population per square kilometer.  &#177;<span class="margin"></span> margin of error &#8224;.</div>\n          <div class="legend"></div>\n        </div>\n      </div>\n\n      <div class="demographic income <%= (currentSet == \'income\') ? \'active\' : \'\' %>" data-set="income">\n        <div class="inside">\n          <div class="strong">Household income</div>\n          <div class="caption">Median household income for each tract.  &#177;<span class="margin"></span> margin of error &#8224;.</div>\n          <div class="legend"></div>\n        </div>\n      </div>\n\n      <div class="demographic white <%= (currentSet == \'white\') ? \'active\' : \'\' %>" data-set="white">\n        <div class="inside">\n          <div class="strong">People of color</div>\n          <div class="caption">Percentage of population that are people of color (not white).  &#177;<span class="margin"></span> margin of error &#8224;.</div>\n          <div class="legend"></div>\n        </div>\n      </div>\n\n      <div class="demographic transit <%= (currentSet == \'transit\') ? \'active\' : \'\' %>" data-set="transit">\n        <div class="inside">\n          <div class="strong">Public transit</div>\n          <div class="caption">Percentage of worker population that uses public transportation for work.  &#177;<span class="margin"></span> margin of error &#8224;.</div>\n          <div class="legend"></div>\n        </div>\n      </div>\n    </div>\n\n    <div class="map-container">\n      <div class="tooltip-container">\n        <div class="tooltip">\n          <div class="stop-info"></div>\n          <div class="tract-info"></div>\n        </div>\n      </div>\n\n      <div id="green-line-map"></div>\n    </div>\n\n  </div>\n\n  <div class="footnote-container">\n    <div class="footnote">\n      <p>&#8224; Margin of error for each demographic is the average margin of error for all census tracts being presented.</p>\n\n      <p>\n        Line route and stop data provided by MetroTransit via the <a href="http://www.datafinder.org/" target="_blank">MetroGIS DataFinder</a>.\n\n        Demographic data from the Census Bureau\'s 2012 American Community Survey 5 year estimates via <a href="http://censusreporter.org/" target="_blank">Census Reporter</a>.\n\n        Some code, techniques, and data on <a href="https://github.com/minnpost/minnpost-green-line-demographics" target="_blank">Github</a>.</p>\n    </div>\n  </div>\n</div>\n';});


define('text!templates/fallback.underscore',[],function () { return '<div class="application-container">\n  <div class="message-container"></div>\n\n  <div class="content-container fallback">\n\n    <img src="<%= paths.images %>fallback-pop-density.png" />\n    <div class="separator"></div>\n    <img src="<%= paths.images %>fallback-income.png" />\n    <div class="separator"></div>\n    <img src="<%= paths.images %>fallback-color.png" />\n    <div class="separator"></div>\n    <img src="<%= paths.images %>fallback-transit.png" />\n\n  </div>\n\n  <div class="footnote-container">\n    <div class="footnote">\n      <p>&#8224; Margin of error for each demographic is the average margin of error for all census tracts being presented.</p>\n\n      <p>\n        Line route and stop data provided by MetroTransit via the <a href="http://www.datafinder.org/" target="_blank">MetroGIS DataFinder</a>.\n\n        Demographic data from the Census Bureau\'s 2012 American Community Survey 5 year estimates via <a href="http://censusreporter.org/" target="_blank">Census Reporter</a>.\n\n        Some code, techniques, and data on <a href="https://github.com/minnpost/minnpost-green-line-demographics" target="_blank">Github</a>.</p>\n    </div>\n  </div>\n</div>\n';});

/**
 * Main application file for: minnpost-green-line-demographics
 *
 * This pulls in all the parts
 * and creates the main object for the application.
 */

// Create main application
define('minnpost-green-line-demographics', [
  'jquery', 'underscore', 'mpConfig', 'mpFormatters',
  'helpers',
  'text!templates/application.underscore',
  'text!templates/fallback.underscore'
], function(
  $, _, mpConfig, mpFormatters,
  helpers, tApplication, tFallback
  ) {

  // Test for SVG
  function hasSVG() {
    return !!('createElementNS' in document && document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect);
  }

  // To use later
  var d3, topojson;

  // Constructor for app
  var App = function(options) {
    this.options = _.extend(this.defaultOptions, options);
    this.el = this.options.el;
    this.$el = $(this.el);
    this.$ = function(selector) { return this.$el.find(selector); };
    this.loadApp();
  };

  // Extend with custom methods
  _.extend(App.prototype, {
    // Start
    start: function() {
      var thisApp = this;

      // If SVG is available, load some other things
      if (hasSVG()) {
        require(['d3', 'topojson'], function(d3proxy, topojsonproxy) {
          d3 = d3proxy;
          topojson = topojsonproxy;
          thisApp.full();
        });
      }
      else {
        this.fallback();
      }
    },

    // Fallback
    fallback: function() {
      this.templateFallback = _.template(tFallback);
      this.$el.html(this.templateFallback({
        paths: this.options.paths
      }));
    },

    // Full app
    full: function() {
      var thisApp = this;

      // Tract data options
      this.sets = {
        'pop': {
          table: 'B01003',
          column: 'B01003001',
          prop: 'by_area',
          error_prop: 'by_area_error',
          colors: ['#c8e0dc', '#8bc1c7', '#4da0bb', '#087db2', '#0d57a0'],
          format: d3.format(',.0f')
        },
        'white': {
          table: 'B02008',
          column: 'B02008001',
          prop: 'by_population',
          error_prop: 'by_population_error',
          colors: ['#e6fde6', '#daf8c4', '#dbef9a', '#e7e36f', '#fbd341'],
          format: d3.format('%,.2f')
        },
        'income': {
          table: 'B19013',
          column: 'B19013001',
          prop: 'estimate',
          error_prop: 'error',
          colors: ['#e5f5ef', '#c7ebe4', '#a6e1dd', '#81d6db', '#55cbdd'],
          format: d3.format('$,.0f')
        },
        'transit': {
          table: 'B08301',
          column: 'B08301010',
          prop: 'by_population',
          error_prop: 'by_population_error',
          colors: ['#dcefd4', '#d2d99c', '#dabe66', '#ec983c', '#ff6633'],
          format: d3.format('%,.2f')
        }
      };
      this.dataset = 'pop';

      // Main template
      this.templateApplication = _.template(tApplication);
      this.$el.html(this.templateApplication({
        currentSet: this.dataset
      }));

      // The DOM creation with underscore templating is
      // not synchronous, so we hack around it
      _.delay(function() {
        // Get data then build app
        thisApp.getData().done(function() {
          thisApp.buildMap();
          thisApp.handleEvents();
        });
      }, 200);
    },

    // Build base D3 Map
    buildMap: function() {
      var thisApp = this;
      var $container = this.$el.find('#green-line-map');
      var width = $container.width();
      var height = $container.height();

      // Make canvas
      var svg = d3.select($container[0]).append('svg')
        .attr('width', width)
        .attr('height', height);

      // Make projection and path handler.  Use mercator for the trueness of
      // direction and at this scale, the area should not be warped
      // significantly
      var projectionData = this.data.greenLine;
      var centroid = d3.geo.centroid(projectionData);
      var projection = d3.geo.mercator()
        .scale(150)
        .translate([width / 2, height / 2]);
      var projectionPath = d3.geo.path().projection(projection)
        .pointRadius(function(d) { return 0.0015; });

      // Make group for features
      var featureGroup = this.featureGroup = svg.append('g').attr('class', 'feature-group');

      // Fit map to data
      var b = projectionPath.bounds(projectionData);
      featureGroup.attr('transform',
        'translate(' + projection.translate() + ') ' +
        'scale(' + 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height) + ') ' +
        'translate(' + -(b[1][0] + b[0][0]) / 2 + ',' + -(b[1][1] + b[0][1]) / 2 + ')');

      // Add Census tracts
      this.data.tracts = topojson.feature(this.data.tractsTopo,
        this.data.tractsTopo.objects['census-tracts.geo']);
      this.tracts = featureGroup.selectAll('.census-tract')
        .data(this.data.tracts.features)
        .enter().append('path')
          .attr('class', 'census-tract')
          .attr('d', projectionPath);

      // Add landmarks
      this.data.landmarks = topojson.feature(this.data.landmarksTopo,
        this.data.landmarksTopo.objects['landmarks.geo']);
      featureGroup.selectAll('.landmark-feature')
        .data(this.data.landmarks.features)
        .enter().append('path')
          .attr('class', function(d) {
            return 'landmark-feature ' + d.properties.type;
          })
          .attr('d', projectionPath);

      // Add green line route
      featureGroup.selectAll('.greenline-route')
        .data(this.data.greenLine.features)
        .enter().append('path')
          .attr('class', 'greenline-route')
          .attr('d', projectionPath);

      // Add stops
      featureGroup.selectAll('.stop')
        .data(this.data.stops.features)
        .enter().append('path')
          .attr('class', 'stop')
          .attr('d', projectionPath)
          // Attach path to data for later use
          .attr('filter', function(d) { d.stop = this; });

      // Make Voronoi map for hovering over stop
      this.voronoiStops = d3.geom.voronoi()
        .x(function(d) { return projection(d.geometry.coordinates)[0]; })
        .y(function(d) { return projection(d.geometry.coordinates)[1]; })
        .clipExtent([[0, 0], [width, height]]);

      featureGroup.selectAll('.voronoi-stops')
        .data(this.voronoiStops(this.data.stops.features))
        .enter().append('path')
          .attr('class', 'voronoi-stops')
          .attr('d', function(d) { return 'M' + d.join('L') + 'Z'; })
          .on('mouseover', function(d) {
            d3.select(d.point.stop).classed('active', true);
            thisApp.updateTooltip({
              stop: d.point.properties.Station + ' station'
            });
          })
          .on('mouseout', function(d) {
            d3.select(d.point.stop).classed('active', false);
            thisApp.updateTooltip(false);
          });

      // Make scales and legends
      this.makeLegendsScales();

      // Update tracts
      this.updateTracts();
    },

    // Make event handling
    handleEvents: function() {
      var thisApp = this;

      // Choosing demographics
      this.$('.demographic').on('click', function(e) {
        e.preventDefault();
        var $this = $(this);

        // Update demographic interface
        thisApp.$('.demographic').removeClass('active');
        $this.addClass('active');

        // Update data
        thisApp.dataset = $this.data('set');
        thisApp.updateTracts();
      });
    },

    // Legend and scales
    makeLegendsScales: function() {
      _.each(this.sets, function(s, si) {
        // Accessorors
        s.access = function(d) { return d.properties.data[s.table][s.prop][s.column]; };
        s.estimate = function(d) { return d.properties.data[s.table].estimate[s.column]; };
        s.error = function(d) { return d.properties.data[s.table][s.error_prop][s.column]; };

        // Scale
        var values = this.data.tracts.features.map(s.access).sort(function(a, b) {
          return a - b;
        });
        s.scale = d3.scale.quantile()
          .domain(values)
          .range(s.colors);

        // Add ends
        d3.select('.demographic.' + si + ' .legend')
          .append('div')
          .attr('class', 'legend-block-end')
          .text(s.format(values[0]));

        // Draw colors legend
        s.legend = d3.select('.demographic.' + si + ' .legend')
          .selectAll('.legend-block')
          .data(s.scale.range())
          .enter().append('div')
            .classed('legend-block', true)
            .attr('title', function(d, i) {
              var range = s.scale.invertExtent(d);
              return '>= ' + s.format(range[0]) + ' and < ' + s.format(range[1]);
            })
            .style('background-color', function(d) { return d; });

        // Add ends
        d3.select('.demographic.' + si + ' .legend')
          .append('div')
          .attr('class', 'legend-block-end')
          .text(s.format(values[values.length - 1]));

        // While we are here, we should figure out the average
        // margin of error
        s.avg_error = (this.data.tracts.features.map(s.error).reduce(function(p, c, i, a) {
          return p + c;
        }, 0)) / this.data.tracts.features.length;

        // Show margin of error
        s.legend = d3.select('.demographic.' + si + ' .margin')
          .text(s.format(s.avg_error));

        // Set new properties
        this.sets[si] = s;
      }, this);
    },

    // Update tracts
    updateTracts: function() {
      var thisApp = this;
      var dataset = this.sets[this.dataset];

      this.tracts
        .transition()
        .duration(300)
        .style('fill', function(d) { return dataset.scale(dataset.access(d)); });

        /*
        Can;t find a way to pass mouse events down passed voronoi layers
        //.on('mouseover', null)
        .on('mouseover', function(d) {
          console.log(getProp(d));
          thisApp.updateTooltip({
            tract: 'Tract: ' + getProp(d)
          });
        });
        */
    },

    // Update tooltip
    updateTooltip: function(content) {
      var $tooltip = this.$('.tooltip');
      var $stop = this.$('.tooltip .stop-info');
      var $tract = this.$('.tooltip .tract-info');

      if (content === false) {
        $tooltip.hide();
      }
      else {
        $tooltip.show();
      }

      if (_.isObject(content) && content.stop) {
        $stop.html(content.stop);
      }
      if (_.isObject(content) && content.tract) {
        $tract.html(content.tract);
      }
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
          thisApp.data.landmarksTopo = c[0];
          thisApp.data.tractsTopo = d[0];

          // Remove loading
          thisApp.$el.find('.loading-container').slideUp('fast');
        });
    },

    // Default options
    defaultOptions: {
      projectName: 'minnpost-green-line-demographics',
      remoteProxy: 'http://mp-jsonproxy.herokuapp.com/proxy?callback=?&url=',
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
 * Run application.
 */
require(['jquery', 'minnpost-green-line-demographics'], function($, App) {
  $(document).ready(function() {
    var app = new App();
  });
});

