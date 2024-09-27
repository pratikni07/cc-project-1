const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


// Extract bucket name from the full URL
const bucketName = process.env.S3_BUCKET_NAME.replace("https://", "").split(
  "."
)[0];

// Multer-S3 configuration
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

// Define schema and model
const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  imageUrl: String,
});

const Item = mongoose.model("Item", itemSchema);

// Routes
app.post("/api/items", upload.single("image"), async (req, res) => {
  try {
    console.log("Received request:", req.body);
    console.log("File:", req.file);

    const newItem = new Item({
      name: req.body.name,
      description: req.body.description,
      imageUrl: req.file.location,
    });

    const savedItem = await newItem.save();
    console.log("Saved item:", savedItem);

    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Error in POST /api/items:", error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    console.log("fiefineif");
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    console.error("Error in GET /api/items:", error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
