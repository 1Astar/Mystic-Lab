const { proxyMysticApi } = require('../../../_mystic-proxy.cjs');

/** POST /api/mystic/chat/completions → Cloudflare Pages */
module.exports = async function handler(req, res) {
  await proxyMysticApi(req, res, ['chat', 'completions']);
};
