const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const { fromPath } = require("pdf2pic");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 3000;

app.use("/output", express.static(path.join(__dirname, "output")));

app.post("/unlock-pdf", upload.single("pdf"), async (req, res) => {
  const pdfPath = req.file.path;
  const password = req.body.password;
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  try {
    // Load and unlock PDF with password
    const pdfBytes = fs.readFileSync(pdfPath);
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes, { password });
    } catch (e) {
      fs.unlinkSync(pdfPath);
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Save unlocked PDF
    const unlockedPdfPath = path.join(outputDir, `unlocked-${Date.now()}.pdf`);
    const unlockedBytes = await pdfDoc.save();
    fs.writeFileSync(unlockedPdfPath, unlockedBytes);

    // Convert to images (high quality)
    const imagesDir = path.join(outputDir, `images-${Date.now()}`);
    fs.mkdirSync(imagesDir);
    const converter = fromPath(unlockedPdfPath, {
      density: 300,
      saveFilename: "page",
      savePath: imagesDir,
      format: "png",
      width: 1200,
      height: 1600,
    });

    const totalPages = pdfDoc.getPageCount();
    const imageUrls = [];
    for (let i = 1; i <= totalPages; i++) {
      const result = await converter(i);
      const imgName = path.basename(result.path);
      imageUrls.push(`/output/${path.basename(imagesDir)}/${imgName}`);
    }

    return res.json({
      pdfUrl: `/output/${path.basename(unlockedPdfPath)}`,
      images: imageUrls,
    });
  } catch (err) {
    console.error("Error unlocking PDF:", err);
    return res.status(500).json({ message: "Server error while processing PDF" });
  } finally {
    fs.unlinkSync(pdfPath); // cleanup
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
