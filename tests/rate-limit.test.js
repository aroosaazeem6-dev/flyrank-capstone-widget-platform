const request = require("supertest");
const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(express.json());

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many submission attempts. Please try again later."
  }
});

app.post(
  "/api/submissions",
  submissionLimiter,
  (req, res) => {
    res.status(201).json({
      message: "Submission received successfully"
    });
  }
);

describe("Submission rate limiting", () => {
  test("blocks requests after the 10-request limit", async () => {
    const responses = [];

    for (let i = 0; i < 11; i++) {
      const response = await request(app)
        .post("/api/submissions")
        .send({
          widget_id: 1,
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          message: "Rate limit test"
        });

      responses.push(response);
    }

    const successfulRequests = responses.filter(
      (response) => response.statusCode === 201
    );

    const blockedRequests = responses.filter(
      (response) => response.statusCode === 429
    );

    expect(successfulRequests.length).toBe(10);
    expect(blockedRequests.length).toBe(1);

    expect(blockedRequests[0].body.error).toBe(
      "Too many submission attempts. Please try again later."
    );
  });
});