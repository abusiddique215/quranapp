const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  resolver: {
    alias: {
      ...(defaultConfig.resolver?.alias ?? {}),
      app: path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'src'),
    },
    sourceExts: [...(defaultConfig.resolver?.sourceExts ?? []), 'cjs'],
  },
  transformer: {
    ...defaultConfig.transformer,
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);
