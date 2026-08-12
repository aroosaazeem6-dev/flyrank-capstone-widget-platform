const request = require("supertest");
const express = require("express");
const path = require("path");

const app = express();

app.get("/widget.js", (req, res) => {
  const version = req.query.v || "1";

  if (version !== "1") {
    return res.status(404).json({
      error: "Widget version not found"
    });
  }

  res.set(
    "Cache-Control",
    "public, max-age=31536000, immutable"
  );

  res.type("application/javascript");

  res.sendFile(
    path.join(
      __dirname,
      "../widget/widget-client.js"
    )
  );
});

test("serves version 1 widget JavaScript", async () => {
  const response = await request(app)
    .get("/widget.js?id=1&v=1");

  expect(response.statusCode).toBe(200);

  expect(response.headers["content-type"]).toContain(
    "application/javascript"
  );

  expect(response.text).toContain(
    "FlyRank Widget"
  );
});

test("rejects an unsupported widget version", async () => {
  const response = await request(app)
    .get("/widget.js?id=1&v=999");

  expect(response.statusCode).toBe(404);

  expect(response.body.error).toBe(
    "Widget version not found"
  );
});