require('dotenv').config();

export default {
  port: process.env.PORT || 8080,
  node_env: process.env.NODE_ENV || "development"
};