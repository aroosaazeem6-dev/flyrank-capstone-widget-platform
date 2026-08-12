const request = require("supertest");
const express = require("express");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.post("/api/submissions", (req, res) => {
  res.status(201).json({
    message: "Submission received successfully"
  });
});

// JSON error handler
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload too large"
    });
  }

  res.status(500).json({
    error: "Internal server error"
  });
});

describe("Payload size protection", () => {
  test("rejects payload larger than 10KB", async () => {
    const largeMessage = "A".repeat(20 * 1024);

    const response = await request(app)
      .post("/api/submissions")
      .send({
        widget_id: 1,
        name: "Test User",
        email: "test@example.com",
        message: largeMessage
      });

    expect(response.statusCode).toBe(413);

    expect(response.body.error).toBe(
      "Payload too large"
    );
  });
});