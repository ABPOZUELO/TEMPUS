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
  const videoPath = path.join(rootDir, 'tempus-hyperframes', 'tempus_dato_curioso_01.mp4');

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
  console.log(`[+] Enviando vídeo de prueba (Datos Curiosos #1 - Fotos Reales + Personaje 2D) a ${recipient}...`);

  const info = await transporter.sendMail({
    from: `"Tempus Video Studio" <${config.smtpUser.trim()}>`,
    to: recipient,
    subject: `🔥 [DATO CURIOSO #01] Alemania 1923: Fotos Históricas + Personaje 2D Animado (TikTok & Reels)`,
    text: `¡Hola Jorge!\n\n` +
          `Aquí tienes el nuevo vídeo de prueba para la serie diaria de DATOS CURIOSOS orientada a TikTok e Instagram Reels, creado con HyperFrames:\n\n` +
          `📸 1. FOTOS HISTÓRICAS REALES (GOOGLE / ARCHIVOS):\n` +
          `   - Billete auténtico de 500 Mil Millones de Marcos de 1923.\n` +
          `   - Fotografía histórica de niños usando fajos de dinero real como bloques de construcción para castillos.\n` +
          `   - Fotografía del ciudadano empapelando su salón con billetes porque salía más barato que la pintura.\n` +
          `   - Bóvedas del Reichsbank abarrotadas de dinero devaluado.\n\n` +
          `🎨 2. PERSONAJES 2D VECTORIALES CON EXPRESIONES DINÁMICAS:\n` +
          `   - Personaje animado en 2D que interactúa con las fotos y datos en cada escena:\n` +
          `     • Cara de asombro total (manos en mejillas y ojos abiertos) al ver el precio del pan.\n` +
          `     • Apuntando con entusiasmo a la foto de los niños jugando.\n` +
          `     • Tiritando de frío y con brazos cruzados mirando el fuego de billetes.\n` +
          `     • Explicando con gestos la pérdida de valor por imprimir dinero sin respaldo.\n` +
          `     • Pulgar arriba y tarjeta dorada de Tempus recomendando inversión en activos reales.\n\n` +
          `✨ 3. TRANSICIONES POR METAMORFOSIS CONTINUA:\n` +
          `   - Los elementos se transforman orgánicamente de una escena a otra sin cortes a negro ni saltos bruscos.\n\n` +
          `🎙️ 4. VOZ JOVEN, ENÉRGICA Y SUBTÍTULOS ANCLADOS:\n` +
          `   - Locución de Álvaro Neural calibrada con tono juvenil (+4Hz) y ritmo ágil (+4%), sin cortes de voz y con subtítulos de karaoke fijos en la zona inferior.\n\n` +
          `Formato: 1080x1920 (9:16 Vertical HD) a 30 fps | Duración: 54 segundos (óptimo para retención en TikTok y Reels).\n\n` +
          `¡Échale un vistazo y dime qué te parece este nuevo formato con personajes 2D y fotos reales!`,
    attachments: [
      {
        filename: 'TEMPUS_DATO_CURIOSO_01.mp4',
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
