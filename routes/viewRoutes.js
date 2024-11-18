const express = require("express");
const router = express.Router();
const viewController = require("../controllers/viewController");
const authController = require("../controllers/authController");

router.use(viewController.setContentSecurityPolicy);
router.use(authController.isLoggedIn);

router.get("/", viewController.getOverview);
router.get("/tours/:slug", viewController.getTour);
router.get("/login", viewController.getLoginForm);

module.exports = router;
