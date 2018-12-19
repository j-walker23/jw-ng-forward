import CleanPlugin from 'clean-webpack-plugin'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import { Configuration } from 'webpack'
import yargs from 'yargs'

let { mode = 'development' } = yargs.argv

const dist = `${__dirname}/dist`

const config: Configuration = {
  mode,
  entry: 'lib/writers.ts',
  // devtool: 'eval-source-map',
  // devtool: 'cheap-source-map',
  output: {
    path: dist,
    filename: 'index.js',
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
  stats: {
    maxModules: 1000,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/env', { modules: 'cjs' }],
              ],
            },
          },
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

// noinspection JSUnusedGlobalSymbols
export default config
