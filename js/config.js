/**
 * RequireJS config which maps out where files are and shims
 * any non-compliant libraries.
 */
require.config({
  shim: {
  },
  baseUrl: 'js',
  paths: {
    'requirejs': '../bower_components/requirejs/require',
    'almond': '../bower_components/almond/almond',
    'text': '../bower_components/text/text',
    'jquery': '../bower_components/jquery/dist/jquery',
    'underscore': '../bower_components/underscore/underscore',
    'd3': '../bower_components/d3/d3',
    'topojson': '../bower_components/topojson/topojson',
    'mpConfig': '../bower_components/minnpost-styles/dist/minnpost-styles.config',
    'mpFormatters': '../bower_components/minnpost-styles/dist/minnpost-styles.formatters',
    'minnpost-green-line-demographics': 'app'
  }
});
