const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const clearanceRoutes = require("./routes/clearanceRoutes");

const app = express();

// Allow the React frontend to communicate with the backend.
app.use(cors());

// Parse normal JSON requests.
app.use(express.json());

// Allow uploaded files to be accessed from the browser.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic route to check if the server is running.
app.get("/", (req, res) => {
  res.send("Barangay Document Request API is running.");
});

// Register document request API routes.
app.use("/api/clearance-requests", clearanceRoutes);

// Handle unknown endpoints.
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

// Handle Multer/upload errors.
app.use((error, req, res, next) => {
  console.error(error);

  if (error.message) {
    return res.status(400).json({
      message: error.message,
    });
  }

  next(error);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
