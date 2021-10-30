"use strict";

const server = require("./index")({
  logger: {
    level: "info",
    prettyPrint: true,
  },
});

server.listen(process.env.PORT || 5001, "0.0.0.0", function (err) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
