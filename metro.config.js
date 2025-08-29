const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  alias: {
    ...(config.resolver?.alias ?? {}),
    app: path.resolve(__dirname, 'app'),
    '@': path.resolve(__dirname, 'src'),
  },
  sourceExts: [...(config.resolver?.sourceExts ?? []), 'cjs'],
};

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;
