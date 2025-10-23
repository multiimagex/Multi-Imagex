const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();

app.use(cors());

app.get("/extract", async (req, res) => {
  const videoId = req.query.v;
  if (!videoId) return res.status(400).json({ error: "Missing video ID" });

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const text = await response.text();

    // YouTube ke meta tag se tags extract karna
    const match = text.match(/<meta name="keywords" content="([^"]+)"/i);
    const tags = match ? match[1].split(",").map((t) => t.trim()) : [];

    if (!tags.length)
      return res.status(404).json({ message: "No tags found", tags: [] });

    res.json({ videoId, tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ YouTube Tag Extractor Proxy is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
