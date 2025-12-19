import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from 'url';

export const generateContractPdf = async (data) => {

  const datePart = new Date().toISOString().split('T')[0];
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(
    process.cwd(),
    "src",
    "template",
    "contract.html"
  );

  try {
    const rutaImagen = path.join(__dirname, '..', 'asset', 'logoVolt.png');

    const bitmap = fs.readFileSync(rutaImagen);
    const logoBase64 = Buffer.from(bitmap).toString('base64');
    data.logoVolt = `data:image/png;base64,${logoBase64}`;

    console.log("Imagen cargada con éxito");
  } catch (error) {
    console.error("Error al leer la imagen:", error.message);
  }
  let html = fs.readFileSync(templatePath, "utf8");

  for (const key in data) {
    //console.log(data[key])
    html = html.replaceAll(`{{${key}}}`, data[key]);
  }

  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "load" });

  const fileName = `Contrato-${data.nombre}-${datePart}.pdf`;
  const outputPath = path.join(
    process.cwd(),
    "src",
    "generated",
    fileName
  );

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return `/contracts/${fileName}`;
};
