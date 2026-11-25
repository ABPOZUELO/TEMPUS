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
  const videoPath = path.join(rootDir, 'TEMPUS_HYPERFRAMES_PILOTO.mp4');

  if (!fs.existsSync(videoPath)) {
    console.error('Vídeo piloto no encontrado en:', videoPath);
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
  console.log(`[+] Enviando vídeo piloto HyperFrames a ${recipient}...`);

  const info = await transporter.sendMail({
    from: `"Tempus Video Bot" <${config.smtpUser.trim()}>`,
    to: recipient,
    subject: `🚀 [PILOTO HYPERFRAMES] Vídeo Educativo Tempus de Alta Calidad (HTML/CSS + GSAP)`,
    text: `¡Hola Jorge!\n\n` +
          `Aquí tienes el nuevo vídeo piloto renderizado con HyperFrames (HTML5 + CSS3 + animaciones fluidas con GSAP en 1080x1920 vertical a 30fps).\n\n` +
          `✨ Novedades implementadas en este piloto:\n` +
          `1. CERO billetes cayendo: adiós a las animaciones repetitivas del fondo.\n` +
          `2. Fotografía cinematográfica con efecto Ken Burns y fondos vivos con iluminación dinámica.\n` +
          `3. Gráficas explicativas financieras de alta precisión:\n` +
          `   - Contador de erosión de poder adquisitivo por inflación (de 10.000 € a 7.180 € en 10 años al 3.2%).\n` +
          `   - Distribución de flujos 50/30/20 con tarjetas dinámicas.\n` +
          `   - Terminal de asignación global de activos con más de 2.000 empresas indexadas.\n` +
          `4. Voz humana cálida y conversacional (Elvira Neural a 96 kbps) perfectamente sincronizada.\n` +
          `5. Transiciones suaves renderizadas directamente con Chrome Headless y FFmpeg.\n\n` +
          `Compara este resultado con el generado por Remotion y cuéntame tus impresiones para continuar optimizando el canal.\n\n` +
          `Un saludo,\nEquipo Tempus`,
    attachments: [
      {
        filename: 'TEMPUS_HYPERFRAMES_PILOTO.mp4',
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
