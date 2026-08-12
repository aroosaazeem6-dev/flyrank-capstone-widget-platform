const express = require("express");
const authenticate = require("../middleware/auth");

const router = express.Router();

router.get("/me", authenticate, (req, res) => {
  res.json({
    message: "Authentication successful",
    tenant: req.tenant
  });
});

module.exports = router;