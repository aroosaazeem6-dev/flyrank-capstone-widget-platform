const request = require("supertest");
const express = require("express");

const app = express();

app.use(express.json());

app.post("/api/submissions", (req, res) => {
  const { website } = req.body;

  // Honeypot:
  // Normal users leave this field empty.
  // Bots that fill it are rejected.
  if (
    typeof website === "string" &&
    website.trim().length > 0
  ) {
    return res.status(400).json({
      error: "Spam submission detected"
    });
  }

  res.status(201).json({
    message: "Submission received successfully"
  });
});

describe("Spam honeypot protection", () => {
  test("rejects a submission when the honeypot field is filled", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        widget_id: 1,
        name: "Bot User",
        email: "bot@example.com",
        message: "Spam message",
        website: "https://spam.example.com"
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.error).toBe(
      "Spam submission detected"
    );
  });

  test("allows a normal submission when the honeypot is empty", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        widget_id: 1,
        name: "Normal User",
        email: "user@example.com",
        message: "Normal message",
        website: ""
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe(
      "Submission received successfully"
    );
  });
});