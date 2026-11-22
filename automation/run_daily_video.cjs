const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR = path.resolve(__dirname, '..');
const VIDEO_DIR = path.join(BASE_DIR, 'tempus-video');
const CALENDAR_FILE = path.join(__dirname, 'content_calendar.json');
const OUTPUT_BASE = path.join(BASE_DIR, 'VIDEOS_DIARIOS');

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function main() {
  console.log('=== INICIANDO GENERADOR AUTOMÁTICO DE VÍDEO TEMPUS ===');
  const todayStr = getTodayString();
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

  // 1. Cargar calendario y seleccionar tema del día (o por argumento CLI)
  const calendar = JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf8'));
  const argTopicId = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  const topicIndex = argTopicId ? calendar.findIndex(t => t.id === argTopicId) : (dayOfYear % calendar.length);
  const topic = { ...calendar[topicIndex >= 0 ? topicIndex : 0] };
  console.log(`[+] Fecha: ${todayStr} | Tema #${topic.id}: "${topic.hookTitle}" (${topic.category})`);

  // 2. Crear carpeta de salida del día
  const dayOutputDir = path.join(OUTPUT_BASE, todayStr);
  if (!fs.existsSync(dayOutputDir)) {
    fs.mkdirSync(dayOutputDir, { recursive: true });
  }

  // 3. Generar locución por slide con IA y calcular duración exacta
  const publicDir = path.join(VIDEO_DIR, 'public');
  let calculatedDurations = [133, 194, 221, 217, 231];
  if (topic.voiceScripts && Array.isArray(topic.voiceScripts)) {
    try {
      const { generateAllVoiceovers } = require('./generate_voiceover.cjs');
      const voiceResult = await generateAllVoiceovers(topic.voiceScripts, publicDir);
      if (voiceResult && voiceResult.slideDurations) {
        calculatedDurations = voiceResult.slideDurations;
      }
    } catch (voiceErr) {
      console.warn('[!] Advertencia generando voces:', voiceErr.message);
    }
  }

  // Asignar duraciones dinámicas de cada slide a los props
  topic.slideDurations = calculatedDurations;

  // 4. Escribir props para Remotion
  const propsFile = path.join(dayOutputDir, 'props.json');
  fs.writeFileSync(propsFile, JSON.stringify(topic, null, 2), 'utf8');

  // 5. Escribir caption.txt para copiar y pegar rápido
  const captionFile = path.join(dayOutputDir, 'caption.txt');
  fs.writeFileSync(captionFile, topic.caption, 'utf8');
  console.log(`[+] Caption guardado en: ${captionFile}`);

  // 6. Renderizar vídeo con Remotion
  const finalVideoFile = path.join(dayOutputDir, `tempus_${todayStr}.mp4`);
  console.log(`[+] Compilando vídeo educativo con Remotion a: ${finalVideoFile}...`);
  const renderCmd = `npx remotion render DynamicDailyVideo "${finalVideoFile}" --props="${propsFile.replace(/\\/g, '/')}"`;
  
  try {
    execSync(renderCmd, { cwd: VIDEO_DIR, stdio: ['ignore', 'pipe', 'pipe'] });
    console.log(`[✔] VÍDEO GENERADO CON ÉXITO: ${finalVideoFile}`);
  } catch (renderErr) {
    console.error('[!] Error en render:', renderErr.stderr ? renderErr.stderr.toString() : renderErr.message);
    throw renderErr;
  }

  // Copia de conveniencia en la raíz para previsualización inmediata
  const rootPreview = path.join(BASE_DIR, 'TEMPUS_PROMO_REEL_VOZ.mp4');
  try {
    fs.copyFileSync(finalVideoFile, rootPreview);
    console.log(`[✔] Copia local actualizada en: ${rootPreview}`);
  } catch (copyErr) {
    console.warn('[!] No se pudo copiar a la raíz:', copyErr.message);
  }

  // 7. Enviar notificación por correo con el vídeo adjunto
  const emailConfigFile = path.join(__dirname, 'email_config.json');
  if (fs.existsSync(emailConfigFile)) {
    try {
      const emailConfig = JSON.parse(fs.readFileSync(emailConfigFile, 'utf8'));
      if (emailConfig.smtpUser && emailConfig.smtpPass) {
        const recipient = emailConfig.recipient || 'tempuswealthmanagement@gmail.com';
        console.log(`[+] Enviando correo a: ${recipient} con el vídeo adjunto...`);
        await sendEmailWithAttachment(emailConfig, topic, finalVideoFile, todayStr);
        console.log(`[✔] Correo enviado correctamente a ${recipient}!`);
      } else {
        console.log('[i] Configuración de correo pendiente de credenciales en email_config.json.');
      }
    } catch (err) {
      console.error('[!] Error enviando email:', err.message);
    }
  }

  console.log('=== PROCESO COMPLETADO CON ÉXITO ===');
}

async function sendEmailWithAttachment(config, topic, videoPath, dateStr) {
  const nodemailer = require(path.join(VIDEO_DIR, 'node_modules', 'nodemailer'));
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.smtpUser.trim(),
      pass: config.smtpPass.replace(/\s+/g, '')
    }
  });

  const recipient = config.recipient || 'tempuswealthmanagement@gmail.com';
  const mailOptions = {
    from: `"Tempus Bot" <${config.smtpUser.trim()}>`,
    to: recipient,
    subject: `🎬 Vídeo Tempus Educativo [${dateStr}] - ${topic.hookTitle}`,
    text: `¡Buenos días Jorge!\n\n` +
          `Tu vídeo diario educativo de Tempus ya está compilado con gráficos animados en alta resolución.\n\n` +
          `📌 TEMA DE HOY: ${topic.hookTitle} (${topic.category})\n\n` +
          `📝 TEXTO Y HASHTAGS PARA PUBLICAR EN TIKTOK / REELS:\n` +
          `--------------------------------------------------\n` +
          `${topic.caption}\n` +
          `--------------------------------------------------\n\n` +
          `📁 Tienes el vídeo adjunto a este correo en formato 9:16 vertical (1080x1920) y guardado en tu PC en:\n${videoPath}\n\n` +
          `¡A romperla hoy con la educación financiera! 🚀\nTempus Wealth Management`,
    attachments: [
      {
        filename: `tempus_${dateStr}.mp4`,
        path: videoPath
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

main().catch(err => {
  console.error('[!] Error fatal en la generación:', err);
  process.exit(1);
});
