var tsConfig = require('./tsconfig.json');
var webpackConfig = require('./webpack.config')

tsConfig.compilerOptions.target = 'es5';

module.exports = function(config){
	var options = {
		basePath: 'dist',
		browsers: ['Chrome'],
		frameworks: ['angular', 'mocha', 'browserify'],
		reporters: ['mocha'],
		angular: ['mocks'],

		files: [
			require.resolve('babel-core/browser-polyfill'),
			'../node_modules/reflect-metadata/Reflect.js',
			'lib/**/*.spec.js'
		],

		preprocessors: {
			'lib/**/*.js': ['browserify']
		},

		browserify: {
			watch: true,
			noParse: [
				// require.resolve('sinon-chai')
			],
			transform: [
				['babelify', { stage: 0 }]
			]
		},

		customLaunchers: {
			Chrome_travis_ci: {
				base: 'Chrome',
				flags: ['--no-sandbox']
			}
		}
	};

	if(process.env.TRAVIS){
		options.browsers = ['Chrome_travis_ci'];
	}

	config.set(options);
};
