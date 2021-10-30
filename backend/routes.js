const { Worker } = require("worker_threads");
const variablesWorker = new Worker("./src/variables.js");

variablesWorker.on("exit", (exitCode) => {
  console.log(exitCode);
});

let jobs = [];

async function routes(fastify, options, next) {
  fastify.get("/", async (request, reply) => {
    return { hello: "world" };
  });
  fastify.get("/status", async (request, reply) => {
    const job = jobs
      .slice()
      .reverse()
      .find((job) => {
        return job.id === request.query.id;
      });
    if (!job) {
      reply.status(404).send();
      return;
    }
    reply.send(job);
  });
  fastify.post("/currentDay", async (request, reply) => {
    const id = `${Date.now()}`;
    jobs.push({ step: "/currentDay", status: "RUNNING", id });
    variablesWorker.postMessage("currentDay");
    variablesWorker.on("message", (result) => {
      jobs.push({ workflow: "/currentDay", status: "DONE", id });
      reply.send({ id, result });
    });

    variablesWorker.on("error", (error) => {
      reply.send(new Error(error));
    });
  });
  fastify.post("/simple", async (request, reply) => {
    const id = `${Date.now()}`;
    jobs.push({ step: "/simple", status: "RUNNING", id });
    variablesWorker.postMessage("simple");
    variablesWorker.on("message", (result) => {
      jobs.push({ workflow: "/simple", status: "DONE", id });
      reply.status(200).send({ id, result });
    });

    variablesWorker.on("error", (error) => {
      reply.send(new Error(error));
    });
  });
}

module.exports = routes;
