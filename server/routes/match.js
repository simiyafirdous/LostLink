const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const rateLimitAI = require("../middleware/rateLimitAI");
const {
  getItemMatches,
  reanalyzeItem,
  getVerifyQuestions
} = require("../controllers/matchController");

router.get("/:id/matches", protect, getItemMatches);
router.post("/:id/reanalyze", protect, rateLimitAI, reanalyzeItem);
router.get("/:id/verify-questions", protect, getVerifyQuestions);

module.exports = router;
