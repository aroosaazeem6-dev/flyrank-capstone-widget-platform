const request = require("supertest");
const express = require("express");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.post("/api/submissions", (req, res) => {
  const { widget_id, name, email, message } = req.body;

  if (
    widget_id === undefined ||
    widget_id === null ||
    !Number.isInteger(Number(widget_id)) ||
    Number(widget_id) <= 0
  ) {
    return res.status(400).json({
      error: "widget_id must be a positive integer"
    });
  }

  if (
    typeof name !== "string" ||
    name.trim().length === 0
  ) {
    return res.status(400).json({
      error: "name is required and must be a non-empty string"
    });
  }

  if (
    typeof email !== "string" ||
    email.trim().length === 0
  ) {
    return res.status(400).json({
      error: "email is required"
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({
      error: "email must be valid"
    });
  }

  if (
    message !== undefined &&
    message !== null &&
    typeof message !== "string"
  ) {
    return res.status(400).json({
      error: "message must be a string"
    });
  }

  res.status(201).json({
    message: "Submission received successfully"
  });
});

describe("Submission payload validation", () => {
  test("rejects missing widget_id", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        name: "Test User",
        email: "test@example.com",
        message: "Test"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "widget_id must be a positive integer"
    );
  });

  test("rejects empty name", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        widget_id: 1,
        name: "",
        email: "test@example.com",
        message: "Test"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "name is required and must be a non-empty string"
    );
  });

  test("rejects invalid email", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        widget_id: 1,
        name: "Test User",
        email: "invalid-email",
        message: "Test"
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "email must be valid"
    );
  });

  test("rejects non-string message", async () => {
    const response = await request(app)
      .post("/api/submissions")
      .send({
        widget_id: 1,
        name: "Test User",
        email: "test@example.com",
        message: 12345
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "message must be a string"
    );
  });
});