const { proxyShareApi } = require('../_share-proxy.cjs');

/** POST /api/share */
module.exports = async function handler(req, res) {
  await proxyShareApi(req, res, []);
};
