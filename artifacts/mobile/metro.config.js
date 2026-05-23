const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const originalServerConfig = config.server || {};
config.server = {
  ...originalServerConfig,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      middleware(req, res, next);
    };
  },
};

module.exports = config;
