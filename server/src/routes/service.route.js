const express = require("express");
const {
  createService,
  deleteService,
  getService,
  getServices,
  getCategories,
  approveService,
  getPendingServices
} = require("../controllers/service.controller");
const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");
const { optionalVerifyToken } = require("../middleware/optionalVerifyToken");

const router = express.Router();

router.post("/", verifyToken, createService);
router.delete("/:id", verifyToken, deleteService);
router.get("/single/:id", getService);
router.get("/categories", getCategories);
router.get("/", optionalVerifyToken, getServices);
router.patch("/approve/:id", verifyAdmin, approveService);
router.get("/pending", verifyAdmin, getPendingServices);

module.exports = router;
