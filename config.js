const env = process.env;

const config = {
  db: {
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: 24244,
    ssl: {
      rejectUnauthorized: true,
      ca: `-----BEGIN CERTIFICATE-----
` + env.DB_CERT + `
-----END CERTIFICATE-----`,
    },
  }
};

module.exports = config;
