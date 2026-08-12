const request = require("supertest");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

app.post("/api/submissions", (req, res) => {
  res.status(201).json({
    message: "Submission received successfully"
  });
});

describe("CORS preflight", () => {
  test("allows POST requests from another origin", async () => {
    const response = await request(app)
      .options("/api/submissions")
      .set("Origin", "http://localhost:5500")
      .set("Access-Control-Request-Method", "POST")
      .set(
        "Access-Control-Request-Headers",
        "Content-Type"
      );

    expect(response.statusCode).toBe(204);

    expect(
      response.headers["access-control-allow-origin"]
    ).toBe("http://localhost:5500");

    expect(
      response.headers["access-control-allow-methods"]
    ).toContain("POST");

    expect(
      response.headers["access-control-allow-headers"]
    ).toContain("Content-Type");
  });
});