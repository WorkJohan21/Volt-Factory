import express from "express";
import { generateContactDocuments } from "../services/contract.service.js";

const router = express.Router();

router.post("/contract/create", async (req, res) => {
  try {
    const url = await generateContactDocuments(req.body);
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando contrato" });
  }
});

export default router;
