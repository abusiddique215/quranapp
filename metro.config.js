const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution of the app directory
config.resolver.alias = {
  ...config.resolver.alias,
  'app': path.resolve(__dirname, 'app'),
  '@': path.resolve(__dirname, 'src'),
};

// Add support for resolving additional extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Improve source map generation
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