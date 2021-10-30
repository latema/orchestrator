// CommonJs
const Fastify = require("fastify");

function buildFastify(opts = {}) {
  console.log("\x1b[36m%s\x1b[0m", "build..");
  const fastify = Fastify(opts);

  fastify.register(require("fastify-cors"));

  fastify.register(require("./routes"));

  return fastify;
}

module.exports = buildFastify;
