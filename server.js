const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const { fromPath } = require("pdf2pic");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/unlock-pdf", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const password = req.body.password;

    // Load PDF with password
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { password });

    // Save unlocked PDF temporarily
    const unlockedPdfBytes = await pdfDoc.save();
    const unlockedPath = `uploads/unlocked-${Date.now()}.pdf`;
    fs.writeFileSync(unlockedPath, unlockedPdfBytes);

    // Convert PDF pages to images
    const converter = fromPath(unlockedPath, {
      density: 200,
      saveFilename: "page",
      savePath: "outputs",
      format: "png",
    });

    const totalPages = pdfDoc.getPageCount();
    let images = [];
    for (let i = 1; i <= totalPages; i++) {
      const result = await converter(i);
      images.push(result.path);
    }

    res.json({ success: true, images });

    // Cleanup
    fs.unlinkSync(filePath);
  } catch (err) {
    res.json({ success: false, message: "Invalid password or corrupted PDF." });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
