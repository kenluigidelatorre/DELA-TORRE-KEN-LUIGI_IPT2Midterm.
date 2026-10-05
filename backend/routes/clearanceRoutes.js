const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
} = require("../controllers/clearanceController");

// Configure where uploaded files will be stored.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + extension;

    cb(null, uniqueName);
  },
});

// Only allow JPG, JPEG, PNG, and PDF files.
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and PDF files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// REST API routes.
router.get("/", getAllRequests);

router.get("/:id", getRequestById);

router.post("/", upload.single("attachment"), createRequest);

router.put("/:id", upload.single("attachment"), updateRequest);

router.delete("/:id", deleteRequest);

module.exports = router;
