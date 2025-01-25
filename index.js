const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Utility function to handle API requests
const handleApiRequest = async (config, res, successMessage) => {
  console.log("helllooooooooooooo >>");
  try {
    const response = await axios.request(config);
    console.log('fashion ai response ..', successMessage, response.data);
    return res.status(200).json({ result: response.data });
  } catch (error) {
    console.error("API Request Error:", error);
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
// app.post("/api/fashion-ai", async (req, res) => {
//   const { userImage, clothingImage, category } = req.body;
//   console.log("Fashion AI Request Received:", req.body);

//   // Validate required fields
//   if (!userImage || !clothingImage || !category) {
//     return res.status(400).json({
//       error: "User image, clothing image, and category are required.",
//     });
//   }

//   // Configuration for Fashion AI API
//   const data = JSON.stringify({
//     model_image: userImage,
//     garment_image: clothingImage,
//     category: category,
//   });

//   const config = {
//     method: "post",
//     maxBodyLength: Infinity,
//     url: "https://api.fashn.ai/v1/run",
//     headers: {
//       "Content-Type": "application/json",
//       Accept: "application/json",
//       Authorization: `Bearer fa-TFLiAYCtn286-6sqfmFrekBX4o7Ailx1L7wry`,
//     },
//     data,
//   };

//   // Handle the request
//   return handleApiRequest(config, res, "Fashion AI API Response:");
// });

app.post("/api/fashion-ai", async (req, res) => {
  const {
    userImage,
    clothingImage,
    category,
    nsfw_filter = true, // Default: true
    cover_feet = false, // Default: false
    adjust_hands = false, // Default: false
    restore_background = false, // Default: false
    restore_clothes = false, // Default: false
    garment_photo_type = "auto", // Default: auto
    long_top = false, // Default: false
    mode = "balanced", // Default: balanced
    seed = 42, // Default: 42
    num_samples = 1, // Default: 1
  } = req.body;

  console.log("Fashion AI Request Received:", req.body);

  // Validate required fields
  if (!userImage || !clothingImage || !category) {
    return res.status(400).json({
      error: "User image, clothing image, and category are required.",
    });
  }

  // Prepare the API payload
  const data = {
    model_image: userImage,
    garment_image: clothingImage,
    category: category,
    nsfw_filter: nsfw_filter,
    cover_feet: cover_feet,
    adjust_hands: adjust_hands,
    restore_background: restore_background,
    restore_clothes: restore_clothes,
    garment_photo_type: garment_photo_type,
    long_top: long_top,
    mode: mode,
    seed: seed,
    num_samples: num_samples,
  };

  console.log('data >>', data)
  // Configuration for Fashion AI API
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.fashn.ai/v1/run",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer fa-Gwlft13yj2Ad-MbSEDjAvzn7umjQ1Rn0GxiuM`,
    },
    data: JSON.stringify(data),
  };

  try {
    // Initial API call to start the try-on process
    const initialResponse = await axios.request(config);
    console.log("Fashion AI Initial Response:", initialResponse.data);

    // Check if the response contains an ID
    if (initialResponse.data && initialResponse.data.id) {
      const tryOnId = initialResponse.data.id;
      console.log("Try-On ID:", tryOnId);

      // Wait for the try-on status and result
      const statusConfig = {
        method: "get",
        url: `https://api.fashn.ai/v1/status/${tryOnId}`,
        headers: {
          Authorization: `Bearer fa-TFLiAYCtn286-6sqfmFrekBX4o7Ailx1L7wry`,
        },
      };

      // Polling mechanism: Retry until the status is complete or fails
      const pollForResult = async () => {
        let statusResponse;
        while (true) {
          console.log("Fetching status for Try-On ID:", tryOnId);
          statusResponse = await axios.request(statusConfig);
          console.log("Status Response:", statusResponse.data);

          // Break if the status is successful or an error occurs
          if (
            statusResponse.data &&
            statusResponse.data.status === "completed"
          ) {
            return statusResponse.data;
          } else if (
            statusResponse.data &&
            statusResponse.data.status === "failed"
          ) {
            throw new Error("Try-On process failed.");
          }

          // Wait for 2 seconds before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      };

      // Poll for the result
      const finalResult = await pollForResult();

      // Return the result to the client
      return res.status(200).json({ result: finalResult });
    } else {
      return res
        .status(400)
        .json({ error: "No Try-On ID returned from the API." });
    }
  } catch (error) {
    console.error("Fashion AI API Error:", error.message);
    if (error.response) {
      console.error("Response Data:", error.response.data);
      console.error("Response Status:", error.response.status);
    }
    return res
      .status(500)
      .json({ error: "Failed to process the request. Please try again." });
  }
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message);
  res.status(500).json({ error: "An unexpected error occurred." });
});

// Server Startup Code
const PORT = process.env.PORT || 8080; // Use environment variable PORT or default to 8080
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
