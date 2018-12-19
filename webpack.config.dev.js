const CleanPlugin = require('clean-webpack-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

const dist = `${__dirname}/dist`
const { mode = 'development' } = require('yargs').argv

const config = {
  mode,
  context: __dirname,
  bail: true,
  entry: 'lib/index.ts',
  // devtool: 'eval-source-map',
  output: {
    path: dist,
    filename: 'index.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin(),
    ],
  },
  plugins: [
    new CleanPlugin([dist]),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/env'],
              ],
            },
          },
        ],
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              experimentalWatchApi: true,
            },
          },
        ],
      },
    ],
  },
}

module.exports = config
// noinspection JSUnusedGlobalSymbols
// export default config
