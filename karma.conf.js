let webpackConfig = require('./webpack.config')

module.exports = function (config) {
  let options = {
    basePath: '',
    frameworks: ['angular', 'mocha', 'chai', 'sinon'],
    angular: ['mocks'],

    files: [
      { pattern: 'lib/**/*.spec.ts', watched: false },
    ],

    preprocessors: {
      'lib/**/*.ts': ['webpack'],
    },

    webpack: {
      mode: null,
      module: webpackConfig.module,
      resolve: webpackConfig.resolve,
    },

    webpackMiddleware: {
      logLevel: 'error',
    },

    reporters: ['progress'],
    colors: true,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: true,
    concurrency: Infinity,
  };
  config.set(options);
};
