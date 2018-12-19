module.exports = {
  presets: [
    [
      '@babel/env',
      // {
      //   useBuiltIns: 'usage',
      //   modules: 'cjs',
      //   targets: 'defaults',
      // },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      '@babel/plugin-transform-modules-commonjs',
    ],
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    [
      '@babel/plugin-proposal-decorators',
      {
        decoratorsBeforeExport: true,
      },
    ],

  ],
}
