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

  const monto = Number(data.monto_numero);

  if (isNaN(monto)) {
    throw new Error("monto_numero inválido");
  }

  const porcentaje20 = monto * 0.2;
  const porcentaje50 = monto * 0.5;
  const porcentaje10 = monto * 0.1;

  try {
    const rutaImagen = path.join(__dirname, '..', 'asset', 'logoVolt.png');

    const bitmap = fs.readFileSync(rutaImagen);
    const logoBase64 = Buffer.from(bitmap).toString('base64');
    data.logoVolt = `data:image/png;base64,${logoBase64}`;

    console.log("Imagen cargada con éxito...");
  } catch (error) {
    console.error("Error al leer la imagen:", error.message);
  }

  //DESGLOSE DE SUMINISTROS
  const equipos = []

  //Modulos Fotovoltaicos
  if (Number(data.cant_paneles > 0)) {
    equipos.push(`
    <tr>
      <td><b>Paneles Fotovoltaicos</b></td>
      <td>${data.cant_paneles}</td>
      <td>${data.descripcion_paneles}</td>
    </tr>
  `);
  }

  //Microinversor normal
  if (Number(data.cant_microinversor > 0)) {
    equipos.push(`
    <tr>
      <td><b>Microinversor</b></td>
      <td>${data.cant_microinversor}</td>
      <td>${data.descripcion_microinversor}</td>
    </tr>
  `);
  }

  //Microinversor hibrido
  if (Number(data.cant_hibrido > 0)) {
    equipos.push(`
    <tr>
      <td><b>Microinversor Híbrido</b></td>
      <td>${data.cant_hibrido}</td>
      <td>${data.descripcion_hibrido}</td>
    </tr>
  `);
  }

  //Baterias
  if (Number(data.cant_bateria > 0)) {
    equipos.push(`
    <tr>
      <td><b>Baterias</b></td>
      <td>${data.cant_bateria}</td>
      <td>${data.descripcion_bateria}</td>
    </tr>
  `);
  }

  //Variable para la tabla de equipos
  data.equipos_html = equipos.join("");

  //Variables de porcentajes de pago
  data.monto_veinte = porcentaje20.toFixed(2)
  data.monto_cincuenta = porcentaje50.toFixed(2)
  data.monto_diez = porcentaje10.toFixed(2)

  let html = fs.readFileSync(templatePath, "utf8");

  console.log("Se procede a cargar las variables al contrato...");
  for (const key in data) {
    //console.log(data[key])
    html = html.replaceAll(`{{${key}}}`, data[key]);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "load" });

  const safeName = data.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
  const fileName = `Contrato-${safeName.split(" ", 0)}-${safeName.split(" ", 1)}-${datePart}.pdf`;
  const outputPath = path.join(
    process.cwd(),
    "src",
    "generated",
    fileName
  );
  console.log("Generando PDF con datos...");
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
  });
  console.log("Contrato generado con exito!");
  await browser.close();

  return encodeURI(`http://server.volt-factory.com:3001/contracts/${fileName}`);
};
