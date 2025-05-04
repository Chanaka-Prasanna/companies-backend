// --- Import Dependencies ---
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

// --- Load Environment Variables ---
dotenv.config();

// --- Configurations ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/";
const DATABASE_NAME = "job_tracker_db";
const COLLECTION_NAME = "companies";

// --- Initialize Express App ---
const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// --- MongoDB Client Setup ---
let collection;
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then((client) => {
    console.log("✅ MongoDB connection successful.");
    const db = client.db(DATABASE_NAME);
    collection = db.collection(COLLECTION_NAME);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });

// --- Routes ---
app.get("/", (req, res) => {
  res.json({ message: "Express server is running!" });
});

// POST /add_company
app.post("/add_company", async (req, res) => {
  try {
    const data = req.body;

    if (!data.companyName || !data.country) {
      return res
        .status(400)
        .json({ message: "Missing required fields: companyName and country" });
    }

    const companyDoc = {
      companyName: data.companyName,
      country: data.country,
      companyWebsite: data.companyWebsite || "",
      availablePositions: data.availablePositions || [],
      dateAdded: new Date(),
    };

    const result = await collection.insertOne(companyDoc);
    console.log(`💾 Saved to MongoDB (ID: ${result.insertedId})`);
    res.status(201).json({ message: "Company added successfully to Database" });
  } catch (e) {
    console.error("❌ Error in /add_company:", e.message);
    res.status(500).json({ message: "An unexpected error occurred" });
  }
});

// GET /get_companies
app.get("/get_companies", async (req, res) => {
  try {
    const { company, country, position } = req.query;
    const query = {};

    if (company) query.companyName = { $regex: company, $options: "i" };
    if (country) query.country = { $regex: country, $options: "i" };
    if (position) query.availablePositions = position;

    const companies = await collection
      .find(query)
      .sort({ dateAdded: -1 })
      .toArray();

    const formattedCompanies = companies.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
      dateAdded: doc.dateAdded?.toISOString(),
    }));

    res.status(200).json(formattedCompanies);
  } catch (e) {
    console.error("❌ Error in /get_companies:", e.message);
    res.status(500).json({ message: "An unexpected error occurred" });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
