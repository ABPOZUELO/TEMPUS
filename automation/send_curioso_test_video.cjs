const fs = require('fs');
const path = require('path');

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const configPath = path.join(__dirname, 'email_config.json');
  if (!fs.existsSync(configPath)) {
    console.error('Configuración de correo no encontrada en:', configPath);
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const videoPath = path.join(rootDir, 'tempus-hyperframes', 'tempus_dato_curioso_01_pro.mp4');

  if (!fs.existsSync(videoPath)) {
    console.error('Vídeo no encontrado en:', videoPath);
    process.exit(1);
  }

  const nodemailerPath = path.join(rootDir, 'tempus-video', 'node_modules', 'nodemailer');
  const nodemailer = require(nodemailerPath);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.smtpUser.trim(),
      pass: config.smtpPass.replace(/\s+/g, '')
    }
  });

  const recipient = config.recipient || 'tempuswealthmanagement@gmail.com';
  console.log(`[+] Enviando vídeo PRO (Datos Curiosos #1 - Escenarios 2D Animados + Transiciones Morph + Fotos HD) a ${recipient}...`);

  const info = await transporter.sendMail({
    from: `"Tempus Video Studio" <${config.smtpUser.trim()}>`,
    to: recipient,
    subject: `🚀 [EDICIÓN PRO 2D] Dato Curioso #01: Escenarios 2D Animados + Fotos HD + Transiciones Chulas`,
    text: `¡Hola Jorge!\n\n` +
          `Aquí tienes la NUEVA VERSIÓN PRO del vídeo de Datos Curiosos (Alemania 1923) con un salto enorme de calidad visual, recreaciones completas con figuras 2D en movimiento y transiciones dinámicas:\n\n` +
          `🎬 1. ESCENARIOS COMPLETOS CON PERSONAJES Y FIGURAS 2D ANIMADAS:\n` +
          `   - Escena 1 (La Panadería): Alex empuja una carretilla cargada hasta arriba de fajos (con rueda giratoria, piernas en marcha y gotas de sudor) frente al panadero en 2D que señala el cartel de 200.000 Millones.\n` +
          `   - Escena 2 (El Castillo de Dinero): Dos niños en 2D construyendo bloque a bloque una pirámide de billetes mientras saltan de alegría (junto al tren de juguete tachado por impagable).\n` +
          `   - Escena 3 (Paredes y Chimenea): Un decorador en 2D pegando billetes en la pared con brocha y Alex con bufanda lanzando fajos a una chimenea con llamas vectoriales vivas y chispas.\n` +
          `   - Escena 4 (La Imprenta del Banco Central): Máquina impresora 2D con engranajes girando, sirena roja y billetes saliendo disparados mientras la moneda de poder adquisitivo se encoge.\n` +
          `   - Escena 5 (Fortaleza Tempus): 4 columnas crecientes de activos reales (Bonos, Oro, S&P 500, Tempus) con Alex en lo alto sosteniendo el escudo dorado de Tempus que rebota las flechas rojas de la inflación.\n\n` +
          `⚡ 2. TRANSICIONES CHULAS CON METAMORFOSIS Y SONIDO (SFX):\n` +
          `   - Transición 1 → 2: La carretilla vuelca hacia delante y los fajos salen volando en 3D para aterrizar convirtiéndose en los ladrillos del castillo de los niños.\n` +
          `   - Transición 2 → 3: Un rodillo gigante de pintor barre toda la pantalla desenrollando una pared de billetes que abre el salón con chimenea.\n` +
          `   - Transición 3 → 4: Zoom desde las chispas del fuego hacia un portal de engranajes gigantes de acero que conecta con la imprenta.\n` +
          `   - Transición 4 → 5: Alquimia dorada con onda expansiva que funde el papel en las columnas doradas de Tempus.\n` +
          `   - Incluye efectos de sonido sincronizados (golpe de sello, whooshes, pops de bloques, fuego crepitando y acorde dorado).\n\n` +
          `📸 3. FOTOS HISTÓRICAS EN ALTA DEFINICIÓN (MUSEO / WIKIMEDIA HD):\n` +
          `   - Sustituidas las miniaturas por escaneos nítidos en HD (incluyendo la foto restaurada a color de 1923 de los niños apilando fajos reales).\n\n` +
          `Formato: 1080x1920 (9:16 Vertical Full HD, 30 fps) · Duración: 54 segundos.\n\n` +
          `¡Dime qué te parece este nivel visual para la serie diaria!`,
    attachments: [
      {
        filename: 'TEMPUS_DATO_CURIOSO_01_PRO.mp4',
        path: videoPath
      }
    ]
  });

  console.log('✅ Correo enviado con éxito. MessageId:', info.messageId);
}

main().catch(err => {
  console.error('[!] Error enviando el correo:', err);
  process.exit(1);
});
