import express from "express";
import contractRoutes from "./routes/contract.routes.js";

const app = express();

app.use(express.json());
app.use("/contracts", express.static("src/generated"));
app.use("/api/contracts", contractRoutes);

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});