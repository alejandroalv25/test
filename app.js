const express = require('express');
const app = express();
const port = 3000;

const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
	  <style>
        /* Estilo para el área de firma */
        #signature-pad {
          border: 2px solid #007BFF; /* Color y grosor del borde */
          border-radius: 10px; /* Radio de las esquinas del borde */
        }
      </style>
    </head>
    <body>
	
		<!-- Barra de navegación con el encabezado -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <a class="navbar-brand" href="#">AMAGA TOUR 1</a>
      </nav>
	
      <div class="container">
	  <h1 class="mt-4">Formulario de registro de servicios</h1>
        <form method="post" action="/procesar">
          <div class="form-group">
            <label for="tipoDocumento">Tipo de Documento:</label>
            <select id="tipoDocumento" name="tipoDocumento" class="form-control" required>
              <option value="CC">CC</option>
              <option value="TI">TI</option>
              <option value="RC">RC</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          <div class="form-group">
            <label for="numeroDocumento">Documento:</label>
            <input type="text" id="numeroDocumento" name="numeroDocumento" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="nombres">Nombres:</label>
            <input type="text" id="nombres" name="nombres" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="apellidos">Apellidos:</label>
            <input type="text" id="apellidos" name="apellidos" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="placas">Placas:</label>
            <input type="text" id="placas" name="placas" class="form-control" required>
          </div>
          <div class="form-group">
			<label for="firma">Firma:</label>
            <canvas id="signature-pad" width="400" height="200"></canvas>
          </div>
          <div class="form-group">	
            <input type="hidden" name="firma" id="firma">
          </div>
		  <div class="form-group">
			<button type="submit" class="btn btn-primary">Crear contrato</button>
		  </div>
        </form>
      </div>
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.3/dist/umd/popper.min.js"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/signature_pad/1.5.3/signature_pad.min.js"></script>
      <script>
        // JavaScript code for signature functionality
        const canvas = document.getElementById('signature-pad');
        const signaturePad = new SignaturePad(canvas);

        const hiddenInput = document.getElementById('firma');

        // Cuando se envía el formulario, convierte la firma en base64 y colócala en el campo oculto
        document.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          hiddenInput.value = signaturePad.toDataURL();
          e.target.submit();
        });
      </script>
    </body>
    </html>
  `);
});






app.post('/procesar', (req, res) => {
  const tipoDocumento = req.body.tipoDocumento;
  const numeroDocumento = req.body.numeroDocumento;
  const nombres = req.body.nombres;
  const apellidos = req.body.apellidos;
  const placas = req.body.placas;
  const firmaBase64 = req.body.firma;
  const direccion = "Calle 50 #5121";
  const fecha = new Date();
  const fechaActual = new Date(); // Obtener la fecha y hora actual
// Obtener el día, mes y año
  const dia = fechaActual.getDate().toString().padStart(2, '0'); // Añadir cero al principio si es necesario
  const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0'); // Sumar 1 al mes ya que los meses comienzan en 0
  const año = fechaActual.getFullYear().toString().slice(-2);
  const empresa = 'Amaga Tour S.A.S';
  const nitEmpresa = '123456789';
  const direccionEmpresa = 'Calle 50';
  const ciudadEmpresa = 'Amagá'
  const tiempoActual = new Date().getTime()
  const firmaEmpresaBase64 = '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';
  

  // Generar el contrato en formato PDF
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('contrato.pdf'));
  //doc.fontSize(16).text(`Contrato para ${nombre}`);
  //doc.text(`Tipo de Documento: ${tipoDocumento}`);
  //doc.text(`Nombres: ${nombres}`);
  //doc.text(`Apellidos: ${apellidos}`);
  //doc.text(`Placas: ${placas}`);
  
  // Convierte la cadena en base64 a un archivo de imagen temporal
  fs.writeFileSync('firmaEmpresaTemp.png', firmaEmpresaBase64, 'base64');
  
  doc.fontSize(16).text('CONTRATO DE SERVICIO DE ALQUILER DE MOTOCARRO12', { align: 'center' });
  doc.moveDown(1);
   // Llenar los campos del contrato con los datos del formulario
  doc.text(`Entre ${tipoDocumento} ${numeroDocumento}, ${nombres} ${apellidos}, mayor de edad, de nacionalidad colombiana, domiciliado en ${direccion}, en adelante denominado el "Arrendatario", por una parte, y ${empresa}, con NIT ${nitEmpresa}, una empresa legalmente constituida bajo las leyes de Colombia, con domicilio en ${direccionEmpresa}, en adelante denominado el "Arrendador", por la otra parte, acuerdan celebrar el presente contrato de alquiler de motocarro, sujeto a las siguientes cláusulas:`, { align: 'justify' });
  doc.moveDown(1);
  doc.text('CLAUSULA 1 - OBJETO DEL CONTRATO', { align: 'left' });
  doc.moveDown(1);
  doc.text(`El Arrendador se compromete a alquilar al Arrendatario el motocarro cuyos detalles se especifican a continuación:`, { align: 'justify' });
  doc.moveDown(1);
  doc.text(`Placa del Motocarro: ${placas}`, { align: 'left' });
  doc.moveDown(1);
  doc.text(`El Arrendatario alquilará el motocarro para viajar por un período de 1 hora.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text('CLAUSULA 2 - CONDICIONES DE ALQUILER', { align: 'left' });
  doc.moveDown(1);
  doc.text(`2.1. El Arrendador entregará el motocarro en buenas condiciones de funcionamiento y limpieza al inicio del período de alquiler.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text(`2.2. El Arrendatario se compromete a utilizar el motocarro con cuidado y diligencia durante el período de alquiler y a respetar todas las leyes y regulaciones de tránsito vigentes en Colombia.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text(`2.3. El Arrendatario no podrá ceder, subarrendar ni transferir de ninguna manera los derechos de este contrato a terceros.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text(`2.4. El Arrendatario se hace responsable de cualquier daño o pérdida causada al motocarro durante el período de alquiler.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text('CLAUSULA 3 - PRECIO Y FORMA DE PAGO', { align: 'left' });
  doc.moveDown(1);
  doc.text(`3.1. El precio del alquiler del motocarro por 1 hora es de [Monto en Pesos Colombianos]. El Arrendatario se compromete a pagar esta suma al Arrendador antes del inicio del período de alquiler.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text(`3.2. El pago se realizará en efectivo.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text('CLAUSULA 4 - RESPONSABILIDAD DEL ARRENDADOR', { align: 'left' });
  doc.moveDown(1);
  doc.text(`El Arrendador se compromete a mantener el motocarro en buen estado de funcionamiento y a realizar el mantenimiento necesario para garantizar su operatividad.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text('CLAUSULA 5 - RESPONSABILIDAD DEL ARRENDATARIO', { align: 'left' });
  doc.moveDown(1);
  doc.text(`El Arrendatario asume toda la responsabilidad por cualquier accidente, daño o lesión que pueda sufrir durante el período de alquiler del motocarro.`, { align: 'justify' });
  doc.moveDown(1);
  doc.text('CLAUSULA 6 - LEGISLACIÓN APLICABLE', { align: 'left' });
  doc.moveDown(1);
  doc.text(`Este contrato se regirá por las leyes de la República de Colombia y cualquier controversia que surja en relación con el mismo será resuelta por los tribunales competentes de [Ciudad de Jurisdicción].`, { align: 'justify' });
  doc.moveDown(1);
  doc.text('CLAUSULA 7 - FIRMA DE LAS PARTES', { align: 'left' });
  doc.moveDown(1);
  doc.text(`El presente contrato se firma en ${ciudadEmpresa}, el día ${dia}-${mes}-${año}.`, { align: 'justify' });
  doc.moveDown(5);
  doc.text(`Firma del Arrendatario Firma del Representante Legal de ${empresa}`, { align: 'left' });
  doc.moveDown(1);
  doc.image('firmaEmpresaTemp.png', 100, doc.y + 20, { width: 200 });
  doc.moveDown(5);
  doc.text(`---------------------------------`, { align: 'left' });
  doc.moveDown(1);
  doc.text(`Firma del arrendador`, { align: 'left' });
  doc.moveDown(1);
  // Dibujar la firma en el PDF
  doc.image(firmaBase64, 100, doc.y + 20, { width: 200 });
  doc.moveDown(5);
  doc.text(`---------------------------------`, { align: 'left' });
  doc.moveDown(1);
  doc.text(`${tipoDocumento} ${numeroDocumento}`, { align: 'left' });
  doc.moveDown(1);
  doc.text(`${nombres} ${apellidos}`, { align: 'left' });

  

  // Agregar contenido del contrato aquí

  // Guardar el PDF
  doc.end();
  

  // Enviar el PDF por correo electrónico
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'alejandroalv25@gmail.com', // Reemplaza con tu dirección de correo
      pass: 'pjgf kbzb tmde zgxv' // Reemplaza con tu contraseña
    }
  });

  const mailOptions = {
    from: 'alejandroalv25@gmail.com', // Reemplaza con tu dirección de correo
    to: 'alejandroalv25@gmail.com', // Reemplaza con la dirección del destinatario
    subject: `Contrato ${placas} ${numeroDocumento}` ,
    text: 'Adjunto se encuentra el contrato en formato PDF.',
    attachments: [{ filename: 'contrato.pdf', path: 'contrato.pdf' }]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error al enviar el correo electrónico: ' + error);
    } else {
      console.log('Correo electrónico enviado: ' + info.response);
    }
  });

  // Mostrar los datos y el contrato al usuario con Bootstrap
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    </head>
    <body>
	
	<!-- Barra de navegación con el encabezado -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <a class="navbar-brand" href="#">AMAGA TOUR</a>
      </nav>
      <div class="container">
        <h1 class="mt-4">Formulario de registro de servicios fue firmado</h1>
        <!-- <p>Tipo de Documento: ${tipoDocumento}</p>
        <p>Documento: ${numeroDocumento}</p>
        <p>Nombres: ${nombres}</p>
        <p>Apellidos: ${apellidos}</p>
        <p>Placas: ${placas}</p>
        <p>Firma:</p>
        <img src="${firmaBase64}" alt="Firma" class="img-fluid"> -->
		
		<div class="container mt-4">
        <!-- Contenido del contrato y datos del usuario aquí -->

        <!-- Botón para regresar al inicio -->
        <a href="/" class="btn btn-primary">Regresar al inicio</a>
      </div>
      </div>
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.3/dist/umd/popper.min.js"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`La aplicación está escuchando en el puerto ${port}`);
});
