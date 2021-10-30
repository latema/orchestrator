const tap = require("tap");
const supertest = require("supertest");
const buildFastify = require("./index");

tap.test("GET `/` route", async (t) => {
  const fastify = buildFastify();
  t.teardown(() => fastify.close());

  await fastify.ready();

  const response = await supertest(fastify.server)
    .get("/")
    .expect(200)
    .expect("Content-Type", "application/json; charset=utf-8");
  t.same(response.body, { hello: "world" });
});

tap.test("POST `/simple` route", async (t) => {
  const fastify = buildFastify();
  t.teardown(() => fastify.close());

  await fastify.ready();

  const response = await supertest(fastify.server)
    .post("/simple")
    .expect(200)
    .expect("Content-Type", "application/json; charset=utf-8");
  t.match(response.text, "number5_plus_8");
  t.match(response.text, "13");
});

tap.test("POST `/currentDay` route", async (t) => {
  const fastify = buildFastify();
  t.teardown(() => fastify.close());

  await fastify.ready();

  const response = await supertest(fastify.server)
    .post("/currentDay")
    .expect(200)
    .expect("Content-Type", "application/json; charset=utf-8");
  t.match(response.text, "dateTime");
});
