const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const app = express();
const upload = multer();

app.post("/unlock-pdf", upload.single("pdf"), async (req,res)=>{
    try{
        const pdfBytes = req.file.buffer;
        const password = req.body.password;
        const pdfDoc = await PDFDocument.load(pdfBytes, {password});
        const unlockedPdfBytes = await pdfDoc.save();
        res.set({
            "Content-Type":"application/pdf",
            "Content-Disposition":"attachment; filename=unlocked.pdf"
        });
        res.send(unlockedPdfBytes);
    } catch(err){
        res.status(400).send("Incorrect password or unsupported PDF encryption");
    }
});

app.listen(3000, ()=>console.log("Server running on http://localhost:3000"));
