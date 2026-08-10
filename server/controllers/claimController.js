const Claim = require("../models/Claim");
const Item = require("../models/Item");

/**
 * POST /api/claims or POST /api/claims/:itemId
 * Submits a new ownership claim for a found item with verification answers.
 */
const createClaim = async (req, res, next) => {
  try {
    const {
      foundItemId,
      itemId,
      lostItemId,
      message,
      proofDetails,
      verificationAnswers = [],
      matchScore = 0
    } = req.body;

    const targetFoundId = foundItemId || itemId || req.params.itemId;
    if (!targetFoundId) {
      return res.status(400).json({ message: "Found item ID is required to initiate a claim." });
    }

    const foundItem = await Item.findById(targetFoundId);
    if (!foundItem) {
      return res.status(404).json({ message: "Found item not found." });
    }

    const finderId = foundItem.owner;
    if (finderId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot claim your own reported found item." });
    }

    // Check if user already submitted a pending claim for this item
    const existingClaim = await Claim.findOne({
      foundItem: foundItem._id,
      claimant: req.user._id,
      status: "pending"
    });

    if (existingClaim) {
      return res.status(400).json({ message: "You already have a pending claim for this item." });
    }

    const claim = await Claim.create({
      foundItem: foundItem._id,
      item: foundItem._id,
      lostItem: lostItemId || null,
      claimant: req.user._id,
      finder: finderId,
      matchScore: Number(matchScore) || 0,
      verificationAnswers: Array.isArray(verificationAnswers) ? verificationAnswers : [],
      message: message || proofDetails || "Claim submitted with verification responses.",
      proofDetails: proofDetails || "",
      status: "pending"
    });

    // Update item status to claim_pending
    foundItem.status = "claim_pending";
    await foundItem.save();

    res.status(201).json({ message: "Claim submitted successfully.", claim });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/claims/incoming
 * Returns claims filed against items posted by the current user (the finder).
 */
const getIncomingClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find({ finder: req.user._id })
      .populate("claimant", "name email")
      .populate("foundItem")
      .populate("lostItem")
      .sort({ createdAt: -1 });

    res.json({ claims });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/claims/mine
 * Returns claims filed by the current user (the claimant).
 * Contact details for finder are ONLY exposed if status is approved.
 */
const getMyClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id })
      .populate("foundItem")
      .populate("lostItem")
      .populate("finder", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const sanitizedClaims = claims.map((c) => {
      // Safety Rule: Only include finder contact details if approved
      if (c.status !== "approved") {
        delete c.finder;
      }
      return c;
    });

    res.json({ claims: sanitizedClaims });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/claims/:id
 * Finder approves or rejects an incoming claim.
 */
const updateClaimStatus = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'." });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found." });

    // Authorization: Only finder or admin/moderator
    const isFinder = claim.finder?.toString() === req.user._id.toString();
    const isAdmin = ["admin", "moderator"].includes(req.user.role);

    if (!isFinder && !isAdmin) {
      return res.status(403).json({ message: "You are not authorized to update this claim." });
    }

    claim.status = status;
    claim.reviewNote = reviewNote || "";
    claim.reviewedBy = req.user._id;
    await claim.save();

    // If approved, update items status to resolved
    if (status === "approved" && claim.foundItem) {
      await Item.findByIdAndUpdate(claim.foundItem, {
        status: "resolved",
        resolvedWith: claim.lostItem || null
      });

      if (claim.lostItem) {
        await Item.findByIdAndUpdate(claim.lostItem, {
          status: "resolved",
          resolvedWith: claim.foundItem
        });
      }
    } else if (status === "rejected" && claim.foundItem) {
      // Revert found item back to open status if rejected
      await Item.findByIdAndUpdate(claim.foundItem, { status: "open" });
    }

    const updatedClaim = await Claim.findById(claim._id)
      .populate("claimant", "name email")
      .populate("finder", "name email")
      .populate("foundItem");

    res.json({ message: `Claim ${status} successfully.`, claim: updatedClaim });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/claims
 * Admin / Moderator view for all claims.
 */
const getClaims = async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const claims = await Claim.find(filter)
      .populate("foundItem")
      .populate("claimant", "name email")
      .populate("finder", "name email")
      .sort({ createdAt: -1 });

    res.json({ claims });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim,
  getIncomingClaims,
  getMyClaims,
  updateClaimStatus,
  getClaims
};
