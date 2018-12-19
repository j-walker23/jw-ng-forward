import CleanPlugin from 'clean-webpack-plugin'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import { Configuration } from 'webpack'


const dist = `${__dirname}/dist`

const config: Configuration = {
  context: __dirname,
  bail: true,
  entry: 'lib/index.ts',
  devtool: 'eval-source-map',
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

// noinspection JSUnusedGlobalSymbols
export default config
