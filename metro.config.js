const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SSR modülünü skip et
config.resolver.alias = {
  './withSSR.js': false,
  './withSSR': false
};

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;