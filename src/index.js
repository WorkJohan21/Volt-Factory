import express from "express";
import contractRoutes from "./routes/contract.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log(">>> Registrando rutas /volt");
app.use("/volt", contractRoutes);
app.post("/test", (req, res) => res.send("OK"));
app.use("/contracts", express.static("src/generated"));

app.listen(3001, () => {
  console.log("Servidor corriendo en Puerto 3000 2.0");
});