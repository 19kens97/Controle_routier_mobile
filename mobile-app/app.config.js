module.exports = ({ config }) => {
  const appEnv = (process.env.APP_ENV || "").toLowerCase();
  const isProd = appEnv === "prod" || appEnv === "production";

  return {
    ...config,
    android: {
      ...config.android,
      usesCleartextTraffic: !isProd,
    },
  };
};
