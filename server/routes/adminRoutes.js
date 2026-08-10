const router = require("express").Router();
const controller = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
router.use(protect, authorize("admin"));
router.get("/dashboard", controller.getDashboard);
router.get("/users", controller.getUsers);
router.patch("/users/:id", controller.updateUser);
module.exports = router;
