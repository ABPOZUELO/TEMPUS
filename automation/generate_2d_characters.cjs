const fs = require('fs');
const path = require('path');

const charDir = path.join(__dirname, '..', 'tempus-hyperframes', 'assets', 'characters');
if (!fs.existsSync(charDir)) fs.mkdirSync(charDir, { recursive: true });

// Shared palette:
// Skin: #FCD5B5, Shadows: #EBB692
// Hair: #1E293B, Eyes: #0F172A
// Jacket/Hoodie: #064E3B (Emerald Green Tempus), Accents: #D97706 (Gold) & #10B981
// Shirt: #FFFFFF

// 1. Shocked Character (Scene 1: 200 mil millones por un pan)
const charShocked = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#022C22"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Floating Exclamation Shock Badges -->
  <g class="shock-fx">
    <circle cx="90" cy="110" r="24" fill="#EF4444" opacity="0.9" filter="url(#glow)"/>
    <text x="90" y="119" font-family="'Inter', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">!</text>
    
    <circle cx="310" cy="90" r="28" fill="#F59E0B" opacity="0.9" filter="url(#glow)"/>
    <text x="310" y="100" font-family="'Inter', sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle">!?</text>
  </g>

  <!-- Body / Torso -->
  <g id="body">
    <!-- Inner White Shirt -->
    <path d="M 160 300 L 240 300 L 250 490 L 150 490 Z" fill="#F8FAFC"/>
    <path d="M 200 300 L 200 450" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="8 8"/>

    <!-- Stylish Tempus Emerald Jacket -->
    <path d="M 120 330 C 120 280, 160 270, 200 270 C 240 270, 280 280, 280 330 L 295 490 L 235 490 L 220 330 L 180 330 L 165 490 L 105 490 Z" fill="url(#jacketGrad)"/>
    
    <!-- Gold Lapel Pins / Trim -->
    <path d="M 175 290 L 195 350 L 175 355 Z" fill="url(#goldGrad)"/>
    <path d="M 225 290 L 205 350 L 225 355 Z" fill="url(#goldGrad)"/>
    <circle cx="150" cy="330" r="7" fill="url(#goldGrad)"/>
  </g>

  <!-- Neck -->
  <rect x="180" y="240" width="40" height="45" rx="10" fill="#EBB692"/>

  <!-- Hands on Cheeks (Shock Pose) -->
  <!-- Left Hand -->
  <g id="hand-left">
    <path d="M 110 320 Q 95 240 120 200 Q 135 180 145 210 Q 135 250 145 320 Z" fill="#FCD5B5"/>
    <ellipse cx="130" cy="205" rx="12" ry="20" fill="#FCD5B5" transform="rotate(-15 130 205)"/>
  </g>
  <!-- Right Hand -->
  <g id="hand-right">
    <path d="M 290 320 Q 305 240 280 200 Q 265 180 255 210 Q 265 250 255 320 Z" fill="#FCD5B5"/>
    <ellipse cx="270" cy="205" rx="12" ry="20" fill="#FCD5B5" transform="rotate(15 270 205)"/>
  </g>

  <!-- Head Group -->
  <g id="head">
    <!-- Face Base -->
    <ellipse cx="200" cy="180" rx="72" ry="78" fill="#FCD5B5"/>
    
    <!-- Ears -->
    <ellipse cx="126" cy="185" rx="12" ry="16" fill="#EBB692"/>
    <ellipse cx="274" cy="185" rx="12" ry="16" fill="#EBB692"/>

    <!-- Hair (Back) -->
    <path d="M 125 170 C 115 90, 160 70, 200 70 C 240 70, 285 90, 275 170 C 290 140, 285 90, 255 70 C 220 50, 180 50, 145 70 C 115 90, 110 140, 125 170 Z" fill="#1E293B"/>

    <!-- Hair (Front modern swoop) -->
    <path d="M 125 145 C 140 100, 180 90, 220 95 C 260 100, 275 125, 275 145 C 265 120, 235 110, 205 112 C 175 114, 145 130, 125 145 Z" fill="#0F172A"/>

    <!-- High Arched Shocked Eyebrows -->
    <path d="M 150 130 Q 165 115 180 128" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 220 128 Q 235 115 250 130" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Wide Shocked Eyes -->
    <g id="eyes">
      <!-- Left Eye -->
      <ellipse cx="165" cy="165" rx="18" ry="22" fill="#FFFFFF"/>
      <ellipse cx="165" cy="165" rx="11" ry="14" fill="#0F172A"/>
      <circle cx="168" cy="160" r="5" fill="#FFFFFF"/>
      <circle cx="162" cy="170" r="2.5" fill="#FFFFFF"/>

      <!-- Right Eye -->
      <ellipse cx="235" cy="165" rx="18" ry="22" fill="#FFFFFF"/>
      <ellipse cx="235" cy="165" rx="11" ry="14" fill="#0F172A"/>
      <circle cx="238" cy="160" r="5" fill="#FFFFFF"/>
      <circle cx="232" cy="170" r="2.5" fill="#FFFFFF"/>
    </g>

    <!-- Cute Anime Sweatdrop -->
    <path d="M 265 135 C 265 135, 275 150, 275 155 C 275 160, 270 164, 265 164 C 260 164, 255 160, 255 155 C 255 150, 265 135, 265 135 Z" fill="#38BDF8" opacity="0.9"/>

    <!-- Nose -->
    <path d="M 197 180 Q 200 188 205 188" stroke="#EBB692" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Open "O" Shocked Mouth -->
    <ellipse cx="200" cy="215" rx="16" ry="22" fill="#7F1D1D"/>
    <ellipse cx="200" cy="222" rx="10" ry="8" fill="#F87171"/>
    <!-- Upper Teeth -->
    <path d="M 188 204 Q 200 208 212 204" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// 2. Pointing / Presenting Character (Scene 2: Children playing with money bricks)
const charPointing = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#022C22"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
  </defs>

  <!-- Body -->
  <g id="body">
    <path d="M 150 300 L 250 300 L 260 490 L 140 490 Z" fill="#F8FAFC"/>
    <path d="M 110 325 C 110 275, 155 265, 200 265 C 245 265, 290 275, 290 325 L 300 490 L 240 490 L 225 330 L 175 330 L 160 490 L 100 490 Z" fill="url(#jacketGrad)"/>
    <path d="M 175 285 L 195 345 L 175 350 Z" fill="url(#goldGrad)"/>
    <circle cx="140" cy="330" r="7" fill="url(#goldGrad)"/>
  </g>

  <!-- Neck -->
  <rect x="180" y="235" width="40" height="45" rx="10" fill="#EBB692"/>

  <!-- Left Arm: Hand in pocket/resting -->
  <path d="M 120 310 Q 90 380 115 420 Q 125 430 135 410 Q 135 370 145 320 Z" fill="url(#jacketGrad)"/>

  <!-- Right Arm: Pointing Up-Right towards the archival photo -->
  <g id="pointing-arm">
    <path d="M 275 310 Q 320 250 350 180 Q 365 170 375 185 Q 355 260 295 340 Z" fill="url(#jacketGrad)"/>
    <!-- Pointing Hand -->
    <circle cx="360" cy="170" r="14" fill="#FCD5B5"/>
    <!-- Extended Index Finger -->
    <path d="M 360 170 L 385 130" stroke="#FCD5B5" stroke-width="12" stroke-linecap="round"/>
    <circle cx="385" cy="130" r="6" fill="#FCD5B5"/>
  </g>

  <!-- Head -->
  <g id="head">
    <ellipse cx="200" cy="175" rx="72" ry="76" fill="#FCD5B5"/>
    <ellipse cx="126" cy="180" rx="12" ry="16" fill="#EBB692"/>
    <ellipse cx="274" cy="180" rx="12" ry="16" fill="#EBB692"/>

    <!-- Hair -->
    <path d="M 125 165 C 115 85, 160 65, 200 65 C 240 65, 285 85, 275 165 C 290 135, 285 85, 255 65 C 220 45, 180 45, 145 65 C 115 85, 110 135, 125 165 Z" fill="#1E293B"/>
    <path d="M 125 140 C 140 95, 180 85, 220 90 C 260 95, 275 120, 275 140 C 265 115, 235 105, 205 107 C 175 109, 145 125, 125 140 Z" fill="#0F172A"/>

    <!-- Eyebrows (Curious & energetic) -->
    <path d="M 150 135 Q 168 126 182 133" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 218 130 Q 235 122 250 128" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Lively Smiling Eyes -->
    <g id="eyes">
      <ellipse cx="165" cy="162" rx="14" ry="16" fill="#0F172A"/>
      <circle cx="168" cy="157" r="4.5" fill="#FFFFFF"/>
      <ellipse cx="235" cy="162" rx="14" ry="16" fill="#0F172A"/>
      <circle cx="238" cy="157" r="4.5" fill="#FFFFFF"/>
    </g>

    <!-- Nose -->
    <path d="M 197 175 Q 200 183 205 183" stroke="#EBB692" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Energetic Open Smile -->
    <path d="M 180 205 Q 200 230 220 205 Q 200 215 180 205 Z" fill="#B91C1C"/>
    <path d="M 184 207 Q 200 212 216 207" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// 3. Disbelief / Cold Character (Scene 3: Wallpapering and burning money)
const charDisbelief = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#022C22"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
  </defs>

  <!-- Body -->
  <g id="body">
    <path d="M 150 300 L 250 300 L 260 490 L 140 490 Z" fill="#F8FAFC"/>
    <path d="M 110 325 C 110 275, 155 265, 200 265 C 245 265, 290 275, 290 325 L 300 490 L 240 490 L 225 330 L 175 330 L 160 490 L 100 490 Z" fill="url(#jacketGrad)"/>
    <circle cx="140" cy="330" r="7" fill="url(#goldGrad)"/>
  </g>

  <!-- Neck -->
  <rect x="180" y="235" width="40" height="45" rx="10" fill="#EBB692"/>

  <!-- Arms Crossed Shivering / Disbelief -->
  <g id="arms-crossed">
    <path d="M 115 320 Q 150 390 260 360 Q 285 350 275 325 Q 220 340 145 315 Z" fill="url(#jacketGrad)"/>
    <path d="M 285 320 Q 250 390 140 360 Q 115 350 125 325 Q 180 340 255 315 Z" fill="url(#jacketGrad)"/>
    <!-- Hands tucked -->
    <ellipse cx="265" cy="350" rx="14" ry="10" fill="#FCD5B5"/>
    <ellipse cx="135" cy="350" rx="14" ry="10" fill="#FCD5B5"/>
  </g>

  <!-- Head -->
  <g id="head">
    <ellipse cx="200" cy="175" rx="72" ry="76" fill="#FCD5B5"/>
    <ellipse cx="126" cy="180" rx="12" ry="16" fill="#EBB692"/>
    <ellipse cx="274" cy="180" rx="12" ry="16" fill="#EBB692"/>

    <!-- Hair -->
    <path d="M 125 165 C 115 85, 160 65, 200 65 C 240 65, 285 85, 275 165 C 290 135, 285 85, 255 65 C 220 45, 180 45, 145 65 C 115 85, 110 135, 125 165 Z" fill="#1E293B"/>
    <path d="M 125 140 C 140 95, 180 85, 220 90 C 260 95, 275 120, 275 140 C 265 115, 235 105, 205 107 C 175 109, 145 125, 125 140 Z" fill="#0F172A"/>

    <!-- Eyebrows (One high, one low in total disbelief) -->
    <path d="M 150 125 Q 165 115 180 122" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 220 138 Q 235 140 250 135" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Eyes (Looking sideways in disbelief) -->
    <g id="eyes">
      <ellipse cx="165" cy="162" rx="14" ry="16" fill="#FFFFFF"/>
      <ellipse cx="160" cy="162" rx="9" ry="12" fill="#0F172A"/>
      <circle cx="162" cy="158" r="3.5" fill="#FFFFFF"/>

      <ellipse cx="235" cy="162" rx="14" ry="16" fill="#FFFFFF"/>
      <ellipse cx="230" cy="162" rx="9" ry="12" fill="#0F172A"/>
      <circle cx="232" cy="158" r="3.5" fill="#FFFFFF"/>
    </g>

    <!-- Nose -->
    <path d="M 197 175 Q 200 183 205 183" stroke="#EBB692" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Wavy / Disbelief Shivering Mouth -->
    <path d="M 180 215 Q 190 208 200 215 Q 210 222 220 215" stroke="#7F1D1D" stroke-width="5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

// 4. Explaining / Money printing lesson (Scene 4)
const charExplaining = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#022C22"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
  </defs>

  <!-- Body -->
  <g id="body">
    <path d="M 150 300 L 250 300 L 260 490 L 140 490 Z" fill="#F8FAFC"/>
    <path d="M 110 325 C 110 275, 155 265, 200 265 C 245 265, 290 275, 290 325 L 300 490 L 240 490 L 225 330 L 175 330 L 160 490 L 100 490 Z" fill="url(#jacketGrad)"/>
    <circle cx="140" cy="330" r="7" fill="url(#goldGrad)"/>
  </g>

  <!-- Neck -->
  <rect x="180" y="235" width="40" height="45" rx="10" fill="#EBB692"/>

  <!-- Hands Open Explaining Gestures -->
  <g id="arms-explaining">
    <!-- Left Hand Palm Up -->
    <path d="M 120 315 Q 80 360 70 380 Q 60 400 80 405 Q 110 400 135 340 Z" fill="url(#jacketGrad)"/>
    <ellipse cx="65" cy="390" rx="16" ry="12" fill="#FCD5B5"/>

    <!-- Right Hand Palm Up -->
    <path d="M 280 315 Q 320 360 330 380 Q 340 400 320 405 Q 290 400 265 340 Z" fill="url(#jacketGrad)"/>
    <ellipse cx="335" cy="390" rx="16" ry="12" fill="#FCD5B5"/>
  </g>

  <!-- Head -->
  <g id="head">
    <ellipse cx="200" cy="175" rx="72" ry="76" fill="#FCD5B5"/>
    <ellipse cx="126" cy="180" rx="12" ry="16" fill="#EBB692"/>
    <ellipse cx="274" cy="180" rx="12" ry="16" fill="#EBB692"/>

    <!-- Hair -->
    <path d="M 125 165 C 115 85, 160 65, 200 65 C 240 65, 285 85, 275 165 C 290 135, 285 85, 255 65 C 220 45, 180 45, 145 65 C 115 85, 110 135, 125 165 Z" fill="#1E293B"/>
    <path d="M 125 140 C 140 95, 180 85, 220 90 C 260 95, 275 120, 275 140 C 265 115, 235 105, 205 107 C 175 109, 145 125, 125 140 Z" fill="#0F172A"/>

    <!-- Eyebrows (Serious / Informative) -->
    <path d="M 152 135 Q 168 128 182 132" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 218 132 Q 232 128 248 135" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Direct Eyes -->
    <g id="eyes">
      <ellipse cx="165" cy="162" rx="14" ry="16" fill="#0F172A"/>
      <circle cx="168" cy="157" r="4" fill="#FFFFFF"/>
      <ellipse cx="235" cy="162" rx="14" ry="16" fill="#0F172A"/>
      <circle cx="238" cy="157" r="4" fill="#FFFFFF"/>
    </g>

    <!-- Nose -->
    <path d="M 197 175 Q 200 183 205 183" stroke="#EBB692" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Talking Mouth -->
    <ellipse cx="200" cy="210" rx="14" ry="10" fill="#991B1B"/>
    <path d="M 190 205 Q 200 208 210 205" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;

// 5. Confident Thumbs Up / Tempus Advisor (Scene 5)
const charThumbsUp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065F46"/>
      <stop offset="100%" stop-color="#022C22"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Body -->
  <g id="body">
    <path d="M 150 300 L 250 300 L 260 490 L 140 490 Z" fill="#F8FAFC"/>
    <path d="M 110 325 C 110 275, 155 265, 200 265 C 245 265, 290 275, 290 325 L 300 490 L 240 490 L 225 330 L 175 330 L 160 490 L 100 490 Z" fill="url(#jacketGrad)"/>
    <path d="M 175 285 L 195 345 L 175 350 Z" fill="url(#goldGrad)"/>
    <circle cx="140" cy="330" r="7" fill="url(#goldGrad)"/>
  </g>

  <!-- Neck -->
  <rect x="180" y="235" width="40" height="45" rx="10" fill="#EBB692"/>

  <!-- Left Arm: Holding Gold Card -->
  <g id="card-hand">
    <path d="M 120 310 Q 80 360 100 400 Q 115 410 135 390 Q 135 350 145 320 Z" fill="url(#jacketGrad)"/>
    <rect x="85" y="380" width="55" height="35" rx="6" fill="url(#goldGrad)" transform="rotate(-15 110 395)" filter="url(#goldGlow)"/>
    <text x="96" y="398" font-family="'Inter', sans-serif" font-weight="900" font-size="10" fill="#022C22" transform="rotate(-15 110 395)">TEMPUS</text>
  </g>

  <!-- Right Arm: Thumbs Up 👍 -->
  <g id="thumbs-up">
    <path d="M 280 310 Q 320 350 340 330 Q 350 310 330 290 Q 300 280 270 310 Z" fill="url(#jacketGrad)"/>
    <!-- Thumbs up hand -->
    <ellipse cx="345" cy="315" rx="16" ry="14" fill="#FCD5B5"/>
    <!-- Thumb sticking up -->
    <path d="M 345 315 L 345 285" stroke="#FCD5B5" stroke-width="14" stroke-linecap="round"/>
    <circle cx="345" cy="285" r="7" fill="#FCD5B5"/>
  </g>

  <!-- Head -->
  <g id="head">
    <ellipse cx="200" cy="175" rx="72" ry="76" fill="#FCD5B5"/>
    <ellipse cx="126" cy="180" rx="12" ry="16" fill="#EBB692"/>
    <ellipse cx="274" cy="180" rx="12" ry="16" fill="#EBB692"/>

    <!-- Hair -->
    <path d="M 125 165 C 115 85, 160 65, 200 65 C 240 65, 285 85, 275 165 C 290 135, 285 85, 255 65 C 220 45, 180 45, 145 65 C 115 85, 110 135, 125 165 Z" fill="#1E293B"/>
    <path d="M 125 140 C 140 95, 180 85, 220 90 C 260 95, 275 120, 275 140 C 265 115, 235 105, 205 107 C 175 109, 145 125, 125 140 Z" fill="#0F172A"/>

    <!-- Eyebrows (Warm, Friendly) -->
    <path d="M 150 130 Q 165 120 180 126" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 220 126 Q 235 120 250 130" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Happy Eyes (Winking or Bright Warm) -->
    <g id="eyes">
      <ellipse cx="165" cy="160" rx="14" ry="16" fill="#0F172A"/>
      <circle cx="168" cy="155" r="4.5" fill="#FFFFFF"/>
      <ellipse cx="235" cy="160" rx="14" ry="16" fill="#0F172A"/>
      <circle cx="238" cy="155" r="4.5" fill="#FFFFFF"/>
    </g>

    <!-- Nose -->
    <path d="M 197 175 Q 200 183 205 183" stroke="#EBB692" stroke-width="3" stroke-linecap="round" fill="none"/>

    <!-- Big Warm Smile -->
    <path d="M 175 200 Q 200 230 225 200 Q 200 215 175 200 Z" fill="#991B1B"/>
    <path d="M 180 202 Q 200 210 220 202" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(charDir, 'char_shocked.svg'), charShocked.trim());
fs.writeFileSync(path.join(charDir, 'char_pointing.svg'), charPointing.trim());
fs.writeFileSync(path.join(charDir, 'char_disbelief.svg'), charDisbelief.trim());
fs.writeFileSync(path.join(charDir, 'char_explaining.svg'), charExplaining.trim());
fs.writeFileSync(path.join(charDir, 'char_thumbsup.svg'), charThumbsUp.trim());

console.log('✅ All 5 2D animated character SVGs generated successfully in assets/characters/!');
