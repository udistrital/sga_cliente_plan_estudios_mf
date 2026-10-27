const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;

module.exports = (config, options) => {
  const singleSpaWebpackConfig = singleSpaAngularWebpack(config, options);

  // Angular ya genera los source maps con SourceMapDevToolPlugin; el devtool de single-spa
  // duplica main.js.map y provoca "Multiple assets emit different content to the same filename"
  singleSpaWebpackConfig.devtool = false;

  // Feel free to modify this webpack config however you'd like to
  return singleSpaWebpackConfig;
};
