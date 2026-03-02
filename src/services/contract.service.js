import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from 'url';
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export const generateContactDocuments = async (data) => {

  const datePart = new Date().toISOString().split('T')[0];
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(
    process.cwd(),
    "src",
    "template",
    "contract.html"
  );

  const templatePathWord = path.join(
    process.cwd(),
    "src",
    "template",
    "contract-template.docx"
  );

  const pdfFolder = path.join(
    process.cwd(),
    "src",
    "generated"
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
  if (Number(data.cant_paneles) > 0) {
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
  data.monto_numero = monto.toFixed(2)

  //Validacion de genero
  if (data.genero === "M") {
    data.genero = "Hombre"
  }
  else if (data.genero === "F") {
    data.genero = "Mujer"
  }
  else {
    data.genero = ""
  }


  let html = fs.readFileSync(templatePath, "utf8");

  console.log("Se procede a cargar las variables al contrato...");
  for (const key in data) {
    //console.log(data[key])
    html = html.replaceAll(`{{${key}}}`, data[key]);
  }

  //Generacion de PDF
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

  const fileName = `Contrato-${safeName.split(" ", 0)}-${safeName.split(" ", 1)}-${datePart}`;
  const pdfFileName = `${fileName}.pdf`;
  const wordFileName = `${fileName}.docx`;

  const pdfPath = path.join(
    process.cwd(),
    "src",
    "generated",
    pdfFileName
  );
  console.log("Generando PDF con datos...");
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
  });
  console.log("Contrato PDF generado con exito!");
  await browser.close();


  //Generacion de Word
  const contentWord = fs.readFileSync(templatePathWord, "binary");

  const zip = new PizZip(contentWord);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  console.log("Generando WORD con datos...");

  // Prepara array dinámico de equipos
  const equiposWord = [];

  if (Number(data.cant_paneles) > 0) {
    equiposWord.push({
      nombre_equipo: "Paneles Fotovoltaicos",
      cantidad: data.cant_paneles,
      descripcion: data.descripcion_paneles
    });
  }

  if (Number(data.cant_microinversor) > 0) {
    equiposWord.push({
      nombre_equipo: "Microinversor",
      cantidad: data.cant_microinversor,
      descripcion: data.descripcion_microinversor
    });
  }

  if (Number(data.cant_bateria) > 0) {
    equiposWord.push({
      nombre_equipo: "Baterías",
      cantidad: data.cant_bateria,
      descripcion: data.descripcion_bateria
    });
  }

  if (Number(data.cant_hibrido) > 0) {
    equiposWord.push({
      nombre_equipo: "Microinversor Hibrido",
      cantidad: data.cant_hibrido,
      descripcion: data.descripcion_hibrido
    });
  }

  // Renderiza variables
  doc.render({
    nombre: data.nombre,
    numero_doc: data.numero_doc,
    tipo_doc: data.tipo_doc,
    nacionalidad: data.nacionalidad,
    ubicacion: data.ubicacion,
    calle: data.calle,
    distrito: data.distrito,
    provincia: data.provincia,
    produccion_anual: data.produccion_anual,
    monto_letras: data.monto_letras,
    telefono: data.telefono,
    correo: data.correo,
    dia: data.dia,
    mes: data.mes,
    anio: data.anio,
    genero: data.genero,
    monto_mantenimiento: data.monto_mantenimiento,
    monto_letras_mantenimiento: data.monto_letras_mantenimiento,
    monto_numero: data.monto_numero,
    monto_veinte: data.monto_veinte,
    monto_cincuenta: data.monto_cincuenta,
    monto_diez: data.monto_diez,
    equipos_word: equiposWord
  });

  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });


  const wordFolder = path.join(
    process.cwd(),
    "src",
    "generated-word",
    wordFileName
  );

  try {
    fs.writeFileSync(wordFolder, buffer);
    console.log("Contrato WORD generado con exito!");
  }
  catch (error) {
    console.error("Error al generar WORD:", error.message);
  }



  return {
    pdfUrl: encodeURI(`http://server.volt-factory.com:3001/contracts/${pdfFileName}`),
    wordUrl: encodeURI(`http://server.volt-factory.com:3001/contracts-word/${wordFileName}`)
  };
};
