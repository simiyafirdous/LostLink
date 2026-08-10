const router = require("express").Router();
const controller = require("../controllers/foundItemController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/", protect, upload.single("image"), controller.createFoundItem);
router.get("/mine", protect, controller.getMyFoundItems);
router.get("/", controller.getFoundItems);
router.get("/:id", controller.getFoundItem);
router.put("/:id", controller.updateFoundItem);
router.delete("/:id", controller.deleteFoundItem);

module.exports = router;
