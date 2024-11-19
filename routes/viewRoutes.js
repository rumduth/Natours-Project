const express = require("express");
const router = express.Router();
const viewController = require("../controllers/viewController");
const authController = require("../controllers/authController");

router.use(viewController.setContentSecurityPolicy);

router.get("/", authController.isLoggedIn, viewController.getOverview);
router.get("/tours/:slug", authController.isLoggedIn, viewController.getTour);
router.get("/login", viewController.getLoginForm);

router.post(
  "/submit-user-data",
  authController.protect,
  viewController.updateUserData
);
router.get("/me", authController.protect, viewController.getAccount);

module.exports = router;