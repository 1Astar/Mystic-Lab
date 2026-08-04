const { proxyShareApi } = require('../_share-proxy.cjs');

/** GET/POST /api/share/* */
module.exports = async function handler(req, res) {
  const raw = req.query.path;
  const parts = Array.isArray(raw)
    ? raw.map(String)
    : String(raw || '')
        .split('/')
        .filter(Boolean);
  await proxyShareApi(req, res, parts);
};
