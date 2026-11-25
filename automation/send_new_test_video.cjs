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
  const videoPath = path.join(rootDir, 'tempus-hyperframes', 'tempus_fondos_indexados_master.mp4');

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
  console.log(`[+] Enviando nuevo vídeo interactivo de alta calidad a ${recipient}...`);

  const info = await transporter.sendMail({
    from: `"Tempus Video Studio" <${config.smtpUser.trim()}>`,
    to: recipient,
    subject: `🔥 [NUEVA PRUEBA MAESTRA] Fondos Indexados: La Regla del Pajar (1080x1920 HD)`,
    text: `¡Hola Jorge!\n\n` +
          `Aquí tienes el NUEVO vídeo de prueba interactivo de máxima calidad, diseñado para ser súper atractivo, dinámico y fácil de comprender para cualquier persona.\n\n` +
          `📌 TEMA: ¿Por qué los Fondos Indexados baten al 90% de los inversores? (La regla del pajar de John Bogle)\n\n` +
          `✨ NOVEDADES Y ANIMACIONES DE ALTO IMPACTO:\n` +
          `1. Gancho de apertura: El peligro de jugarse todo a 1 sola acción con gráfica de quiebra cayendo en picado (-64%).\n` +
          `2. Metáfora simple del pajar: En vez de buscar la aguja, compra el pajar entero. Red interconectada de empresas líderes mundiales (Apple, Microsoft, Nvidia, Google, Amazon).\n` +
          `3. Gráfica histórica animada en vivo: Curva interactiva del S&P 500 trazándose en directo con +10.4% de media anual y marcadores de hitos históricos (Crisis 2008, Pandemia 2020, Récord 2026).\n` +
          `4. Ejemplo visual tangible con 100€/mes: Odómetro gigante subiendo a 75.800€ y barras de crecimiento comparando lo aportado (24.000€) vs el 68% de beneficios generados solos (+51.800€).\n` +
          `5. Subtítulos dinámicos estilo Karaoke sincronizados palabra por palabra con destacados en amarillo.\n` +
          `6. Locución neural natural y entusiasta (es-ES-ElviraNeural a 96 kbps) y banda sonora envolvente.\n\n` +
          `📱 TEXTO SUGERIDO PARA TIKTOK / INSTAGRAM REELS:\n` +
          `--------------------------------------------------\n` +
          `¿Invertir en una sola empresa o ser dueño del mundo entero? 🌍\n` +
          `John Bogle revolucionó Wall Street con una idea brutal: no busques la aguja en el pajar, ¡compra el pajar entero!\n\n` +
          `Descubre cómo 100€ al mes pueden convertirse en más de 75.000€ con fondos indexados en @tempuswealth.\n\n` +
          `#EducacionFinanciera #Inversiones #FondosIndexados #FinanzasPersonales #Tempus\n` +
          `--------------------------------------------------\n\n` +
          `¡Dime qué te parece este nuevo formato!`,
    attachments: [
      {
        filename: 'TEMPUS_FONDOS_INDEXADOS_MASTER.mp4',
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
