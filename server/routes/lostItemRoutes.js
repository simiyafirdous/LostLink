const router = require("express").Router();
const controller = require("../controllers/lostItemController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/", protect, upload.single("image"), controller.createLostItem);
router.get("/mine", protect, controller.getMyLostItems);
router.get("/", controller.getLostItems);
router.get("/:id", controller.getLostItem);
router.put("/:id", controller.updateLostItem);
router.delete("/:id", controller.deleteLostItem);

module.exports = router;
