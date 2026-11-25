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
  const videoPath = path.join(rootDir, 'tempus-hyperframes', 'tempus_fondos_indexados_v3.mp4');

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
  console.log(`[+] Enviando nuevo vídeo corregido (Voz más aguda + Metamorfosis Continua / Morphing) a ${recipient}...`);

  const info = await transporter.sendMail({
    from: `"Tempus Video Studio" <${config.smtpUser.trim()}>`,
    to: recipient,
    subject: `✨ [NUEVA VERSIÓN V3] Fondos Indexados: Transiciones con Metamorfosis Continua y Voz Más Aguda`,
    text: `¡Hola Jorge!\n\n` +
          `Aquí tienes la NUEVA VERSIÓN V3 del vídeo con los cambios que me pediste:\n\n` +
          `🌟 1. TRANSICIONES POR METAMORFOSIS CONTINUA (MORPHING):\n` +
          `   - Ya NO se borra una pantalla para que aparezca otra.\n` +
          `   - Los elementos se transforman directamente en los siguientes:\n` +
          `     • La tarjeta roja de desplome se contrae en 3D, se vuelve esmeralda y se fragmenta abriéndose en la constelación de 6 empresas.\n` +
          `     • Las 6 tarjetas colapsan en una línea base y proyectan un rayo láser curvo que dibuja la gráfica del S&P 500.\n` +
          `     • El pico de la gráfica de 5.800 pts se expande y se transmuta en la caja dorada del contador multiplicador y sus barras de crecimiento.\n` +
          `     • Las barras de crecimiento rotan 90° y se transforman directamente en las barras doradas del monograma de Tempus.\n\n` +
          `🎙️ 2. VOZ MÁS AGUDA Y JUVENIL:\n` +
          `   - Se ha ajustado el tono a +4Hz y la modulación a +4% de velocidad, logrando un timbre más juvenil, brillante y enérgico de hombre joven.\n` +
          `   - Continúa con cero cortes de audio (con márgenes de respiración visual tras cada frase).\n\n` +
          `🎯 3. SUBTÍTULOS ANCLADOS Y HUD LIMPIO:\n` +
          `   - El pill inferior de karaoke se mantiene estable y las frases van deslizándose verticalmente con suavidad.\n` +
          `   - El HUD superior permanece fijo sin ningún solapamiento.\n\n` +
          `Duración: 46 segundos | Resolución: 1080x1920 (9:16 Vertical HD) a 30 fps.\n\n` +
          `¡Échale un vistazo y dime qué te parece esta nueva dinámica de transformación fluida!`,
    attachments: [
      {
        filename: 'TEMPUS_FONDOS_INDEXADOS_V3.mp4',
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
