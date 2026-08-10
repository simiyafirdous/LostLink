const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createClaim,
  getIncomingClaims,
  getMyClaims,
  updateClaimStatus,
  getClaims
} = require("../controllers/claimController");

router.post("/", protect, createClaim);
router.post("/:itemId", protect, createClaim);
router.get("/incoming", protect, getIncomingClaims);
router.get("/mine", protect, getMyClaims);
router.patch("/:id", protect, updateClaimStatus);
router.patch("/:id/review", protect, updateClaimStatus);
router.get("/", protect, authorize("moderator", "admin"), getClaims);

module.exports = router;
