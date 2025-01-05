const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

app.post("/api/try-on", async (req, res) => {
console.log("Request received:", req.body);
  const { userImage, clothingImage } = req.body;

    console.log('hello ')
  if (!userImage || !clothingImage) {
    return res
      .status(400)
      .json({ error: "User image and clothing image are required." });
  }

  try {
    const response = await axios.post(
      "https://api.developer.pixelcut.ai/v1/try-on",
      {
        person_image_url: userImage, // Base64 string or URL of the user's image
        garment_image_url: clothingImage, // Base64 string or URL of the clothing image
      },
      {
        headers: {
          // Authorization: `Bearer ${process.env.PIXELCUT_API_KEY}`,
          // "Content-Type": "application/json",
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-KEY": process.env.PIXELCUT_API_KEY,
          ...data.getHeaders(),
        },
        
      }
    );

    res.status(200).json({ result: response.data });
  } catch (error) {
    console.error("Error with Pixelcut API:", error.message);
    res.status(500).json({ error: "Failed to process try-on request." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
