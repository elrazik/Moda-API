const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Utility function to handle API requests
const handleApiRequest = async (config, res, successMessage) => {
  try {
    const response = await axios.request(config);
    console.log(successMessage, response.data);
    return res.status(200).json({ result: response.data });
  } catch (error) {
    console.error("API Request Error:", error.message);
    if (error.response) {
      console.error("Response Data:", error.response.data);
      console.error("Response Status:", error.response.status);
    }
    return res
      .status(500)
      .json({ error: "Failed to process the request. Please try again." });
  }
};

// Route 1: Pixelcut Try-On API
app.post("/api/try-on", async (req, res) => {
  const { userImage, clothingImage } = req.body;
  console.log("Pixelcut Try-On Request Received:", req.body);

  // Validate required fields
  if (!userImage || !clothingImage) {
    return res
      .status(400)
      .json({ error: "User image and clothing image are required." });
  }

  // Configuration for Pixelcut API
  const data = JSON.stringify({
    person_image_url: userImage,
    garment_image_url: clothingImage,
  });
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.developer.pixelcut.ai/v1/try-on",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-KEY": process.env.PIXELCUT_API_KEY,
    },
    data,
  };

  // Handle the request
  return handleApiRequest(config, res, "Pixelcut Try-On API Response:");
});

// Route 2: Fashion AI API
app.post("/api/fashion-ai", async (req, res) => {
  const { userImage, clothingImage, category } = req.body;
  console.log("Fashion AI Request Received:", req.body);

  // Validate required fields
  if (!userImage || !clothingImage || !category) {
    return res
      .status(400)
      .json({
        error: "User image, clothing image, and category are required.",
      });
  }

  // Configuration for Fashion AI API
  const data = JSON.stringify({
    model_image: userImage,
    garment_image: clothingImage,
    category,
  });
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.fashn.ai/v1/run",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-KEY": `Bearer ${process.env.FASHION_AI_API}`,
    },
    data,
  };

  // Handle the request
  return handleApiRequest(config, res, "Fashion AI API Response:");
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message);
  res.status(500).json({ error: "An unexpected error occurred." });
});

module.exports = app;
