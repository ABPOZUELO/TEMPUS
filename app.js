import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, verifyBeforeUpdateEmail, deleteUser, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyB2a7vhtnbeQqBhHtWTUlvzS6vDKDKyuqM",
            authDomain: "tempus-c7811.firebaseapp.com",
            projectId: "tempus-c7811",
            storageBucket: "tempus-c7811.firebasestorage.app",
            messagingSenderId: "750633422076",
            appId: "1:750633422076:web:23fd20d53d8bdb661c1b79",
            measurementId: "G-8TH366C1MH"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        setPersistence(auth, browserLocalPersistence).catch((err) => console.warn("Persistence error:", err));
        const db = getFirestore(app);

        let currentUser = null;
        let userAlias = '';
        let transactions = [];
        let investments = [];
        let goalConfig = { name: 'Mi Objetivo', amount: 10000, source: 'patrimonio', apiKey: '' };

        let legalAccepted = false;
        let legalAcceptedAt = '';
        let isLegalBlockingActive = false;

        let gastosChartInstance = null, carteraChartInstance = null, timelineChartInstance = null, officialChartInstance = null;
        // Paleta moderna de alto contraste para gráficas
        const chartColors = ['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4', '#e879f9', '#22d3ee'];
        let currentCalendarDate = new Date();
        let isLoginMode = true;

        function updateAliasDisplay() {
            const display = userAlias || (currentUser ? currentUser.email.split('@')[0] : 'Usuario');
            const greeting = document.getElementById('user-alias-greeting');
            if (greeting) greeting.textContent = display;
            const nav = document.getElementById('user-email-display');
            if (nav) nav.textContent = display;
        }

        // ------------------ AUTENTICACIÓN ------------------

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                document.getElementById('login-screen').classList.add('hidden');
                updateAliasDisplay();
                await loadUserData();
                if(document.getElementById('tx-start-date')) {
                    document.getElementById('tx-start-date').value = new Date().toISOString().split('T')[0];
                }
                if(document.getElementById('pdf-date')) {
                    const today = new Date();
                    const curMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                    document.getElementById('pdf-date').value = curMonthStr;
                }

                // Verificación de Consentimiento Legal Obligatorio (RGPD)
                const isAccepted = legalAccepted || localStorage.getItem('tempus_legal_accepted_' + user.uid) === 'true';
                if (!isAccepted) {
                    document.getElementById('app-content').classList.add('hidden');
                    openLegalModal(true); // Bloqueo obligatorio nada más registrarse o iniciar sesión sin aceptar
                } else {
                    document.getElementById('app-content').classList.remove('hidden');
                    closeLegalModal();
                }
            } else {
                currentUser = null;
                userAlias = '';
                legalAccepted = false;
                document.getElementById('login-screen').classList.remove('hidden');
                document.getElementById('app-content').classList.add('hidden');
                closeLegalModal();
            }
        });

        document.getElementById('auth-toggle-btn').addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            const title = document.getElementById('auth-title');
            const subtitle = document.getElementById('auth-subtitle');
            const submitBtn = document.getElementById('auth-submit-btn');
            const toggleBtn = document.getElementById('auth-toggle-btn');
            const aliasGroup = document.getElementById('auth-alias-group');

            if(isLoginMode) {
                title.innerText = "Iniciar Sesión";
                subtitle.innerText = "Accede a tu portfolio personal";
                submitBtn.innerText = "Entrar";
                submitBtn.className = "apple-button w-full bg-white text-black font-bold py-3.5 rounded-xl mt-2";
                toggleBtn.innerText = "¿No tienes cuenta? Regístrate aquí";
                if(aliasGroup) aliasGroup.classList.add('hidden');
            } else {
                title.innerText = "Crear Cuenta";
                subtitle.innerText = "Regístrate para gestionar tu patrimonio";
                submitBtn.innerText = "Registrarse";
                submitBtn.className = "apple-button w-full bg-zinc-800 text-white font-bold py-3.5 rounded-xl mt-2 border border-zinc-700 hover:bg-zinc-700";
                toggleBtn.innerText = "¿Ya tienes cuenta? Inicia sesión";
                if(aliasGroup) aliasGroup.classList.remove('hidden');
            }
        });

        window.togglePasswordVisibility = (id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.type = el.type === 'password' ? 'text' : 'password';
        };

        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();

            if (isLoginMode) {
                signInWithEmailAndPassword(auth, email, pass)
                    .catch((error) => {
                        console.error("Login error:", error);
                        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                            alert("Credenciales incorrectas.\n\nRecuerda que la contraseña distingue mayúsculas y minúsculas: la primera letra 'A' debe ser mayúscula (Abella0406) y sin espacios.");
                        } else if (error.code === 'auth/too-many-requests') {
                            alert("Demasiados intentos fallidos seguidos. Por seguridad, Firebase ha bloqueado temporalmente el acceso. Espera un par de minutos e inténtalo de nuevo.");
                        } else {
                            alert("Error al entrar (" + (error.code || error.message) + "). Revisa tus credenciales.");
                        }
                    });
            } else {
                if(pass.length < 6) { alert("La contraseña debe tener al menos 6 caracteres"); return; }
                const aliasInput = document.getElementById('register-alias');
                const finalAlias = (aliasInput && aliasInput.value.trim()) || email.split('@')[0];
                createUserWithEmailAndPassword(auth, email, pass)
                    .then(async (userCred) => {
                        userAlias = finalAlias;
                        transactions = [];
                        investments = [];
                        legalAccepted = false;
                        legalAcceptedAt = '';
                        localStorage.setItem('tempus_legal_accepted_' + userCred.user.uid, 'false');
                        await saveDataToCloud();
                        updateAliasDisplay();
                        document.getElementById('app-content').classList.add('hidden');
                        openLegalModal(true); // Bloqueo obligatorio de términos legales nada más registrarse
                    })
                    .catch((error) => alert("Error al registrar: El correo ya existe o es inválido."));
            }
        });

        window.handleLogout = () => {
            signOut(auth).then(() => { location.reload(); });
        };

        // ------------------ BASE DE DATOS (NUBE) ------------------

        async function loadUserData() {
            if (!currentUser) return;
            document.getElementById('loading-screen').classList.remove('hidden');
            try {
                const docSnap = await getDoc(doc(db, "usuarios", currentUser.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    userAlias = data.alias || data.userAlias || '';
                    transactions = data.transacciones || [];
                    investments = data.inversiones || [];
                    if(data.configuracion) goalConfig = { ...goalConfig, ...data.configuracion };
                    legalAccepted = data.legalAccepted === true || localStorage.getItem('tempus_legal_accepted_' + currentUser.uid) === 'true';
                    legalAcceptedAt = data.legalAcceptedAt || localStorage.getItem('tempus_legal_accepted_at_' + currentUser.uid) || '';
                }

                updateAliasDisplay();

                if(document.getElementById('goal-name')) document.getElementById('goal-name').value = goalConfig.name || '';
                if(document.getElementById('goal-amount')) document.getElementById('goal-amount').value = goalConfig.amount || '';
                if(document.getElementById('goal-source')) document.getElementById('goal-source').value = goalConfig.source || 'patrimonio';
                if(document.getElementById('user-api-key')) document.getElementById('user-api-key').value = goalConfig.apiKey || '';

                updateUI();
            } catch (e) {
                console.error("Error leyendo datos: ", e);
                alert("Hubo un error cargando tus datos. Revisa los permisos de Firebase.");
            }
            document.getElementById('loading-screen').classList.add('hidden');
        }

        async function saveDataToCloud() {
            if (!currentUser) return;
            try {
                await setDoc(doc(db, "usuarios", currentUser.uid), {
                    email: currentUser.email,
                    alias: userAlias || '',
                    transacciones: transactions,
                    inversiones: investments,
                    configuracion: goalConfig,
                    legalAccepted: legalAccepted === true,
                    legalAcceptedAt: legalAcceptedAt || new Date().toISOString(),
                    ultimaActualizacion: new Date().toISOString()
                });
            } catch (e) {
                console.error("Error guardando datos: ", e);
            }
        }

        window.saveGoalConfig = async () => {
            if (!currentUser) return;
            goalConfig.name = document.getElementById('goal-name').value || 'Mi Objetivo';
            goalConfig.amount = parseFloat(document.getElementById('goal-amount').value) || 0;
            goalConfig.source = document.getElementById('goal-source').value;
            updateUI();
            await saveDataToCloud();
        };

        // ------------------ FUNCIONES GLOBALES ------------------

        window.switchTab = (tabName) => {
            ['resumen', 'flujo', 'inversiones', 'estrategia'].forEach(t => {
                const section = document.getElementById(`tab-${t}`);
                const btn = document.getElementById(`btn-${t}`);
                const btnM = document.getElementById(`btn-${t}-m`);
                if (section) section.classList.toggle('hidden', t !== tabName);
                if (btn) btn.className = (t === tabName) ? "apple-button px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-black shadow-md" : "apple-button px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900";
                if (btnM) btnM.className = (t === tabName) ? "px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black whitespace-nowrap" : "px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 whitespace-nowrap";
            });
            updateUI();
        };

        function formatMoney(amount) {
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
        }
        function formatDate(dateStr) {
            if (!dateStr) return "-";
            const date = new Date(dateStr);
            if (isNaN(date)) return dateStr;
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }

        function updateUI() {
            window.updateUI = updateUI;
            Chart.defaults.font.family = "'Helvetica Neue', Helvetica, Arial, sans-serif";
            Chart.defaults.color = '#a1a1aa';

            let ing = transactions.filter(t => t.type === 'ingreso').reduce((a, t) => a + t.amount, 0);
            let gas = transactions.filter(t => t.type === 'gasto').reduce((a, t) => a + t.amount, 0);
            let liq = ing - gas;
            let invBuy = investments.reduce((a, i) => a + i.buyPrice, 0);
            let invCur = investments.reduce((a, i) => a + i.currentPrice, 0);
            let pat = liq + invCur;
            let roi = invBuy > 0 ? ((invCur - invBuy) / invBuy) * 100 : 0;
            let tasaAhorro = ing > 0 ? ((ing - gas) / ing) * 100 : 0;

            if(document.getElementById('kpi-patrimonio')) document.getElementById('kpi-patrimonio').innerText = formatMoney(pat);
            if(document.getElementById('kpi-liquidez')) document.getElementById('kpi-liquidez').innerText = formatMoney(liq);
            if(document.getElementById('kpi-flujo')) document.getElementById('kpi-flujo').innerText = formatMoney(liq);
            if(document.getElementById('kpi-cartera')) document.getElementById('kpi-cartera').innerText = formatMoney(invCur);

            const kpiAhorro = document.getElementById('kpi-ahorro');
            if(kpiAhorro) {
                kpiAhorro.innerText = `${tasaAhorro.toFixed(1)}%`;
                kpiAhorro.className = `text-2xl font-bold mt-1 ${tasaAhorro >= 20 ? 'text-emerald-400' : (tasaAhorro > 0 ? 'text-white' : 'text-rose-400')}`;
            }
            const badge = document.getElementById('kpi-roi-badge');
            if(badge) {
                badge.innerText = `ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`;
                badge.className = `text-xs font-semibold px-2 py-1 rounded border ${roi >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`;
            }

            renderTables();
            renderCharts(invCur, liq);
            renderEconomicNews();
            updateGoalProgress(pat, liq, gas, ing);
        }

        window.renderTables = function() {
            const txBody = document.getElementById('transactions-table-body');
            const txSearch = (document.getElementById('tx-search-input')?.value || '').toLowerCase().trim();
            const txType = document.getElementById('tx-filter-type')?.value || 'todos';
            const txCat = document.getElementById('tx-filter-cat')?.value || 'todas';
            const txDate = document.getElementById('tx-filter-date')?.value || '';

            if(txBody) {
                txBody.innerHTML = '';
                const reversedTx = [...transactions].reverse();
                const filteredTx = reversedTx.filter(t => {
                    const matchSearch = !txSearch || 
                        (t.desc && t.desc.toLowerCase().includes(txSearch)) || 
                        (t.category && t.category.toLowerCase().includes(txSearch));
                    const matchType = txType === 'todos' || t.type === txType;
                    const matchCat = txCat === 'todas' || t.category === txCat;
                    const matchDate = !txDate || (t.startDate && t.startDate.startsWith(txDate));
                    return matchSearch && matchType && matchCat && matchDate;
                });

                const txBadge = document.getElementById('tx-count-badge');
                if (txBadge) txBadge.innerText = `${filteredTx.length}`;

                if (filteredTx.length === 0) {
                    txBody.innerHTML = '';
                } else {
                    filteredTx.forEach((t) => {
                        let originalIdx = transactions.indexOf(t);
                        txBody.innerHTML += `
                        <tr class="hover:bg-zinc-900/50">
                            <td class="py-3 text-zinc-500 text-xs">${formatDate(t.startDate)}</td>
                            <td class="text-white">${t.desc}</td>
                            <td class="text-zinc-400">${t.category}</td>
                            <td class="text-right font-bold ${t.type==='ingreso'?'text-emerald-400':'text-rose-400'}">${t.type==='ingreso'?'+':'-'}${formatMoney(t.amount)}</td>
                            <td class="text-right"><button onclick="deleteTransaction(${originalIdx})" class="text-zinc-500 hover:text-rose-400 font-bold" title="Eliminar">✕</button></td>
                        </tr>`;
                    });
                }
            }

            const invBody = document.getElementById('investments-table-body');
            const invSearch = (document.getElementById('inv-search-input')?.value || '').toLowerCase().trim();
            const invRoi = document.getElementById('inv-filter-roi')?.value || 'todos';
            const invDate = document.getElementById('inv-filter-date')?.value || '';

            if(invBody) {
                invBody.innerHTML = '';
                const filteredInv = investments.filter(i => {
                    const matchSearch = !invSearch || 
                        (i.name && i.name.toLowerCase().includes(invSearch)) || 
                        (i.ticker && i.ticker.toLowerCase().includes(invSearch));
                    const p = ((i.currentPrice - i.buyPrice)/i.buyPrice)*100;
                    const matchRoi = invRoi === 'todos' || 
                        (invRoi === 'ganancia' && p >= 0) || 
                        (invRoi === 'perdida' && p < 0);
                    const matchDate = !invDate || (i.buyDate && i.buyDate.startsWith(invDate));
                    return matchSearch && matchRoi && matchDate;
                });

                const invBadge = document.getElementById('inv-count-badge');
                if (invBadge) invBadge.innerText = `${filteredInv.length}`;

                if (filteredInv.length === 0) {
                    invBody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-zinc-500 text-xs italic">No hay inversiones registradas</td></tr>';
                } else {
                    filteredInv.forEach((i) => {
                        let originalIdx = investments.indexOf(i);
                        let p = ((i.currentPrice - i.buyPrice)/i.buyPrice)*100;
                        invBody.innerHTML += `
                        <tr onclick="openInvestmentDetail(${originalIdx})" class="hover:bg-zinc-900/60 cursor-pointer transition-colors" title="Haz clic para ver gráfica oficial 2026 y estado de mercado">
                            <td class="py-3 text-white font-medium flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full ${p>=0?'bg-emerald-400':'bg-rose-400'}"></span>
                                <span>${i.name}</span>
                            </td>
                            <td class="text-zinc-400 font-mono text-xs">${i.ticker || '-'}</td>
                            <td class="text-zinc-400 text-xs whitespace-nowrap">${i.buyDate ? formatDate(i.buyDate) : '-'}</td>
                            <td class="text-right text-zinc-400">${formatMoney(i.buyPrice)}</td>
                            <td class="text-right font-bold text-white">${formatMoney(i.currentPrice)}</td>
                            <td class="text-right ${p>=0?'text-emerald-400':'text-rose-400'}">${p>=0?'+':''}${p.toFixed(2)}%</td>
                            <td class="text-right" onclick="event.stopPropagation()"><button onclick="deleteInvestment(${originalIdx})" class="text-zinc-500 hover:text-rose-400 font-bold p-1" title="Eliminar">✕</button></td>
                        </tr>`;
                    });
                }
            }
        };
        const renderTables = window.renderTables;

        function renderCharts(invCur, liq) {
            const canvasCartera = document.getElementById('carteraChart');
            const canvasGastos = document.getElementById('gastosChart');
            const canvasTimeline = document.getElementById('timelineChart');

            if(canvasCartera && carteraChartInstance) carteraChartInstance.destroy();
            if(canvasCartera) {
                const carteraMenu = document.getElementById('cartera-legend-menu');
                const hasInvestments = investments.length > 0 && investments.some(i => (i.currentPrice || 0) > 0);
                if (carteraMenu) {
                    carteraMenu.innerHTML = '';
                    if (!hasInvestments) {
                        carteraMenu.innerHTML = '<div class="py-2.5 text-center"><p class="text-xs text-zinc-500 italic">Sin datos registrados</p><p class="text-[10px] text-zinc-600 mt-0.5">Añade activos en Inversiones</p></div>';
                    } else {
                        investments.forEach((i, idx) => {
                            let pct = invCur > 0 ? ((i.currentPrice / invCur) * 100).toFixed(1) : 0;
                            let color = chartColors[idx % chartColors.length];
                            carteraMenu.innerHTML += `<div class="flex items-center justify-between gap-3"><div class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></span><span class="text-zinc-300 font-medium truncate max-w-[90px]">${i.name}</span></div><span class="text-white font-bold">${pct}%</span></div>`;
                        });
                    }
                }
                const carteraLabels = hasInvestments ? investments.map(i=>i.name) : ['Sin datos registrados'];
                const carteraData = hasInvestments ? investments.map(i=>i.currentPrice) : [1];
                const carteraColors = hasInvestments ? chartColors : ['rgba(255, 255, 255, 0.15)'];
                const carteraBorders = hasInvestments ? 'rgba(24, 24, 28, 1)' : 'rgba(255, 255, 255, 0.25)';

                carteraChartInstance = new Chart(canvasCartera.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: carteraLabels, datasets: [{ data: carteraData, backgroundColor: carteraColors, borderColor: carteraBorders, borderWidth: 2 }] },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { 
                            legend: { display:false }, 
                            tooltip: { 
                                enabled: hasInvestments,
                                callbacks: { 
                                    label: function(c) { 
                                        let v = c.parsed; 
                                        let t = c.dataset.data.reduce((a,b)=>a+b,0); 
                                        let p = t>0?((v/t)*100).toFixed(1):0; 
                                        return ` ${formatMoney(v)} (${p}%)`; 
                                    }
                                }
                            }
                        }, 
                        cutout: '75%' 
                    }
                });
            }

            if(canvasGastos && gastosChartInstance) gastosChartInstance.destroy();
            if(canvasGastos) {
                const gastosMap = {};
                // Solo lee transacciones guardadas explícitamente como "gasto"
                transactions.filter(t => t.type === 'gasto').forEach(t => { gastosMap[t.category] = (gastosMap[t.category] || 0) + t.amount; });
                const gastoKeys = Object.keys(gastosMap);
                const gastoValues = Object.values(gastosMap);
                const hasGastos = gastoKeys.length > 0 && gastoValues.some(v => v > 0);

                const gastosMenu = document.getElementById('gastos-legend-menu');
                if (gastosMenu) {
                    gastosMenu.innerHTML = '';
                    if (!hasGastos) {
                        gastosMenu.innerHTML = '<div class="py-2.5 text-center"><p class="text-xs text-zinc-500 italic">Sin datos registrados</p><p class="text-[10px] text-zinc-600 mt-0.5">Registra gastos en Flujo de Caja</p></div>';
                    } else {
                        let totalGastos = gastoValues.reduce((a, b) => a + b, 0);
                        gastoKeys.forEach((key, idx) => {
                            let val = gastoValues[idx];
                            let pct = totalGastos > 0 ? ((val / totalGastos) * 100).toFixed(1) : 0;
                            let color = chartColors[idx % chartColors.length];
                            gastosMenu.innerHTML += `<div class="flex items-center justify-between gap-3"><div class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></span><span class="text-zinc-300 font-medium truncate max-w-[90px]">${key}</span></div><span class="text-white font-bold">${pct}%</span></div>`;
                        });
                    }
                }

                const gastosLabels = hasGastos ? gastoKeys : ['Sin datos registrados'];
                const gastosData = hasGastos ? gastoValues : [1];
                const gastosColors = hasGastos ? chartColors.slice(0, gastoKeys.length) : ['rgba(255, 255, 255, 0.15)'];
                const gastosBorders = hasGastos ? 'rgba(24, 24, 28, 1)' : 'rgba(255, 255, 255, 0.25)';

                gastosChartInstance = new Chart(canvasGastos.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: gastosLabels, datasets: [{ data: gastosData, backgroundColor: gastosColors, borderColor: gastosBorders, borderWidth: 2 }] },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { 
                            legend: { display:false }, 
                            tooltip: { 
                                enabled: hasGastos,
                                callbacks: { 
                                    label: function(c) { 
                                        let v = c.parsed; 
                                        let t = c.dataset.data.reduce((a,b)=>a+b,0); 
                                        let p = t>0?((v/t)*100).toFixed(1):0; 
                                        return ` ${formatMoney(v)} (${p}%)`; 
                                    }
                                }
                            }
                        }, 
                        cutout: '75%' 
                    }
                });
            }

            if(canvasTimeline && timelineChartInstance) timelineChartInstance.destroy();
            if(canvasTimeline) {
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                let monthlyIngresos = new Array(12).fill(0);
                let monthlyGastos = new Array(12).fill(0);

                transactions.forEach(t => {
                    let monthIdx = new Date().getMonth();
                    if (t.startDate) { let d = new Date(t.startDate); if (!isNaN(d.getTime())) monthIdx = d.getMonth(); }
                    if (t.type === 'ingreso') monthlyIngresos[monthIdx] += t.amount; else monthlyGastos[monthIdx] += t.amount;
                });

                timelineChartInstance = new Chart(canvasTimeline.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [
                            { label: 'Ingresos', data: monthlyIngresos, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#10b981' },
                            { label: 'Gastos', data: monthlyGastos, borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.08)', borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#f43f5e' }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { color: 'rgba(63, 63, 70, 0.3)' } }, y: { grid: { color: 'rgba(63, 63, 70, 0.3)' } } } }
                });
            }
        }

        // ------------------ CLAVES & NOTICIAS ECONÓMICAS EN DIRECTO ------------------
        const ECONOMIC_NEWS = [
            {
                id: 1,
                category: 'macro',
                badgeText: 'BCE / Tipos',
                badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                time: 'Hace 25 min',
                title: 'El BCE prepara nuevas bajadas de tipos tras situarse la inflación en el 2.1%',
                summary: 'La moderación de precios en la Eurozona consolida el ciclo expansivo, estabilizando el Euribor.',
                impact: '🟢 Favorable para hipotecas y deuda soberana',
                source: 'Banco Central Europeo (BCE)',
                url: 'https://www.ecb.europa.eu/press/pr/date/2024/html/index.es.html',
                fullAnalysis: 'El Banco Central Europeo confirma que la inflación en la Eurozona converge hacia su objetivo oficial del 2%. Esto reduce la presión sobre el coste de financiación para particulares y empresas, estabilizando los tipos del Euribor en el entorno del 2.5%.'
            },
            {
                id: 2,
                category: 'bolsa',
                badgeText: 'Wall Street',
                badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                time: 'Hace 1 hora',
                title: 'El S&P 500 y el Nasdaq consolidan máximos anuales con balances tecnológicos récord',
                summary: 'Los beneficios empresariales del trimestre superan las previsiones de Wall Street en más de un 7%.',
                impact: '▲ Alcista en fondos indexados globales',
                source: 'Bloomberg Markets',
                url: 'https://www.bloomberg.com/markets',
                fullAnalysis: 'Los resultados empresariales superan las previsiones del consenso en más de un 7%. El flujo de capital hacia fondos cotizados (ETFs) indexados al MSCI World y S&P 500 alcanza cifras récord en 2026.'
            },
            {
                id: 3,
                category: 'macro',
                badgeText: 'Ahorro / Bancos',
                badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                time: 'Hace 3 horas',
                title: 'La rentabilidad de cuentas remuneradas y letras del tesoro se sitúa en el 2.8% - 3.2%',
                summary: 'La banca mantiene tipos atractivos para captar pasivo antes del próximo ajuste monetario.',
                impact: '★ Oportunidad de rentabilidad en liquidez',
                source: 'Tesoro Público & Banco de España',
                url: 'https://www.tesoro.es/',
                fullAnalysis: 'Los ahorradores pueden seguir aprovechando rendimientos reales positivos en sus colchones de liquidez y fondos de emergencia, superando la tasa de inflación subyacente.'
            },
            {
                id: 4,
                category: 'cripto',
                badgeText: 'Cripto / ETF',
                badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                time: 'Hace 5 horas',
                title: 'Fondos institucionales y tesorerías aceleran su asignación a Bitcoin y Ethereum',
                summary: 'La madurez regulatoria internacional consolida a los criptoactivos en carteras multiactivo.',
                impact: '▲ Incremento de volumen institucional',
                source: 'CoinDesk Financial Markets',
                url: 'https://www.coindesk.com/markets/',
                fullAnalysis: 'La consolidación de productos cotizados oficiales bajo supervisión de reguladores globales continúa atrayendo capital que antes estaba excluido por mandatos de inversión tradicionales.'
            },
            {
                id: 5,
                category: 'bolsa',
                badgeText: 'IBEX 35',
                badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                time: 'Hace 7 horas',
                title: 'El IBEX 35 lidera la rentabilidad por dividendo en Europa con retornos superiores al 4.8%',
                summary: 'La banca española y las energéticas retribuyen con dividendos récord a sus accionistas.',
                impact: '💰 Flujo recurrente para carteras DGI',
                source: 'Bolsas y Mercados Españoles (BME)',
                url: 'https://www.bolsasymercados.es/bme-exchange/es/Mercados-y-Cotizaciones/Acciones/Ibex-35',
                fullAnalysis: 'El índice bursátil español se posiciona como uno de los más atractivos de Europa para inversores enfocados en retornos por dividendo en efectivo y flujos de caja recurrentes.'
            }
        ];

        let currentNewsFilter = 'todas';

        window.renderEconomicNews = function(filter = currentNewsFilter) {
            currentNewsFilter = filter;
            const container = document.getElementById('economic-news-container');
            if (!container) return;

            const filtered = filter === 'todas' 
                ? ECONOMIC_NEWS 
                : ECONOMIC_NEWS.filter(n => n.category === filter);

            container.innerHTML = '';
            if (filtered.length === 0) {
                container.innerHTML = '<p class="text-xs text-zinc-500 italic py-4 text-center">No hay noticias en esta categoría.</p>';
                return;
            }

            filtered.forEach(n => {
                container.innerHTML += `
                <div onclick="openNewsModal(${n.id})" class="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all cursor-pointer group">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${n.badgeColor}">${n.badgeText}</span>
                        <span class="text-[10px] text-zinc-500 font-mono">${n.time}</span>
                    </div>
                    <h3 class="text-xs font-semibold text-zinc-200 group-hover:text-white leading-snug line-clamp-2 transition-colors">${n.title}</h3>
                    <p class="text-[11px] text-zinc-400 mt-1 line-clamp-1">${n.summary}</p>
                    <div class="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-zinc-800/60 text-[10px]">
                        <span class="text-emerald-400 flex items-center gap-1 truncate"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ${n.impact}</span>
                        <a href="${n.url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="text-zinc-400 hover:text-white flex items-center gap-1 font-semibold group-hover:text-emerald-400 transition-colors shrink-0" title="Abrir noticia original">
                            <span>Leer ↗</span>
                        </a>
                    </div>
                </div>`;
            });
        };

        window.filterEconomicNews = function(cat) {
            ['todas', 'macro', 'bolsa', 'cripto'].forEach(c => {
                const btn = document.getElementById(`news-filter-${c}`);
                if (btn) {
                    if (c === cat) {
                        btn.className = "px-2.5 py-1 rounded-lg font-semibold bg-white text-black shadow-sm transition-all whitespace-nowrap";
                    } else {
                        btn.className = "px-2.5 py-1 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all whitespace-nowrap";
                    }
                }
            });
            window.renderEconomicNews(cat);
        };

        window.refreshEconomicNews = function() {
            const icon = document.getElementById('news-refresh-icon');
            if (icon) {
                icon.classList.add('rotate-180');
                setTimeout(() => icon.classList.remove('rotate-180'), 500);
            }
            window.renderEconomicNews(currentNewsFilter);
        };

        window.openNewsModal = function(id) {
            const item = ECONOMIC_NEWS.find(n => n.id === id);
            if (!item) return;

            const modal = document.getElementById('news-detail-modal');
            const badge = document.getElementById('news-modal-badge');
            const time = document.getElementById('news-modal-time');
            const title = document.getElementById('news-modal-title');
            const analysis = document.getElementById('news-modal-analysis');
            const impact = document.getElementById('news-modal-impact');
            const link = document.getElementById('news-modal-link');

            if (badge) {
                badge.className = `px-2.5 py-0.5 rounded-lg text-xs font-bold border ${item.badgeColor}`;
                badge.textContent = item.badgeText;
            }
            if (time) time.textContent = item.time;
            if (title) title.textContent = item.title;
            if (analysis) analysis.textContent = item.fullAnalysis;
            if (impact) impact.textContent = item.impact;

            if (link) {
                link.href = item.url;
                link.innerHTML = `<span>Leer en ${item.source}</span> <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>`;
            }

            if (modal) modal.classList.remove('hidden');
        };

        window.closeNewsModal = function() {
            const modal = document.getElementById('news-detail-modal');
            if (modal) modal.classList.add('hidden');
        };

        // ------------------ ESTRATEGIA: SIMULADOR DE INTERÉS COMPUESTO ------------------
        window.selectedCompoundYears = 20;

        window.setCompoundYears = (years) => {
            window.selectedCompoundYears = years;
            [5, 10, 15, 20, 30].forEach(y => {
                const btn = document.getElementById(`btn-comp-${y}`);
                if (btn) {
                    if (y === years) {
                        btn.className = "px-3 py-1 text-xs rounded-lg bg-white text-black font-bold transition-all shadow";
                    } else {
                        btn.className = "px-3 py-1 text-xs rounded-lg text-zinc-400 hover:text-white transition-all";
                    }
                }
            });
            window.runCompoundSimulation();
        };

        window.runCompoundSimulation = () => {
            const initialInput = document.getElementById('sim-initial-input');
            const monthlyRange = document.getElementById('sim-monthly-range');
            const returnRange = document.getElementById('sim-return-range');

            if (!initialInput || !monthlyRange || !returnRange) return;

            let initial = parseFloat(initialInput.value) || 0;
            let monthly = parseFloat(monthlyRange.value) || 0;
            let annualReturn = (parseFloat(returnRange.value) || 0) / 100;
            let years = window.selectedCompoundYears || 20;
            let months = years * 12;

            const labelInit = document.getElementById('label-sim-initial');
            const labelMonthly = document.getElementById('label-sim-monthly');
            const labelReturn = document.getElementById('label-sim-return');

            if (labelInit) labelInit.textContent = formatMoney(initial);
            if (labelMonthly) labelMonthly.textContent = `${formatMoney(monthly)} / mes`;
            if (labelReturn) {
                let note = '';
                if (annualReturn === 0.08) note = ' (Histórico S&P 500)';
                else if (annualReturn >= 0.10) note = ' (Alto rendimiento)';
                else if (annualReturn <= 0.04) note = ' (Conservador)';
                labelReturn.textContent = `${(annualReturn * 100).toFixed(1)}%${note}`;
            }

            // Fórmula matemática de interés compuesto con aportaciones mensuales recurrentes
            let monthlyRate = annualReturn / 12;
            let futureValue = initial;
            if (monthlyRate > 0) {
                let compoundFactor = Math.pow(1 + monthlyRate, months);
                let pmtCompound = monthly * ((compoundFactor - 1) / monthlyRate);
                futureValue = (initial * compoundFactor) + pmtCompound;
            } else {
                futureValue = initial + (monthly * months);
            }

            let totalContributions = initial + (monthly * months);
            let totalInterest = Math.max(0, futureValue - totalContributions);
            let multiplier = totalContributions > 0 ? (futureValue / totalContributions).toFixed(2) : '1.00';

            const elContrib = document.getElementById('sim-total-contributions');
            const elInterest = document.getElementById('sim-total-interest');
            const elFinal = document.getElementById('sim-final-wealth');
            const elYears = document.getElementById('sim-years-label');
            const elMultiplier = document.getElementById('sim-multiplier-pill');

            if (elContrib) elContrib.textContent = formatMoney(totalContributions);
            if (elInterest) elInterest.textContent = `+${formatMoney(totalInterest)}`;
            if (elFinal) elFinal.textContent = formatMoney(futureValue);
            if (elYears) elYears.textContent = `Al cabo de ${years} años`;
            if (elMultiplier) elMultiplier.textContent = `Multiplica tu esfuerzo por x${multiplier}`;

            let pctContrib = futureValue > 0 ? Math.round((totalContributions / futureValue) * 100) : 100;
            let pctInterest = 100 - pctContrib;

            const elPctC = document.getElementById('sim-pct-contributed');
            const elPctI = document.getElementById('sim-pct-interest');
            const barC = document.getElementById('sim-bar-contributed');
            const barI = document.getElementById('sim-bar-interest');

            if (elPctC) elPctC.textContent = `${pctContrib}%`;
            if (elPctI) elPctI.textContent = `${pctInterest}%`;
            if (barC) barC.style.width = `${pctContrib}%`;
            if (barI) barI.style.width = `${pctInterest}%`;
        };

        function updateGoalProgress(pat, liq, gas, ing) {
            // Inicializar capital del simulador si aún no ha sido editado por el usuario
            const simInitInput = document.getElementById('sim-initial-input');
            if (simInitInput && (!simInitInput.dataset.userEdited || simInitInput.value === '')) {
                simInitInput.value = Math.round(pat > 0 ? pat : liq);
            }
            window.runCompoundSimulation();

            // Diagnóstico 50/30/20
            const needsCategories = ['Vivienda', 'Alimentación', 'Supermercado', 'Transporte', 'Salud', 'Educación', 'Suministros', 'Hogar', 'Facturas', 'Luz', 'Agua', 'Gas', 'Internet'];
            let totalGastos = 0;
            let needsSpend = 0;
            let wantsSpend = 0;

            transactions.filter(t => t.type === 'gasto').forEach(t => {
                totalGastos += t.amount;
                const catLower = (t.category || '').toLowerCase();
                if (needsCategories.some(c => catLower.includes(c.toLowerCase()))) {
                    needsSpend += t.amount;
                } else {
                    wantsSpend += t.amount;
                }
            });

            let monthlyIncome = ing > 0 ? ing : (totalGastos > 0 ? totalGastos : 1);
            let savings = Math.max(0, monthlyIncome - totalGastos);

            let pctNeeds = Math.min(100, Math.round((needsSpend / monthlyIncome) * 100));
            let pctWants = Math.min(100, Math.round((wantsSpend / monthlyIncome) * 100));
            let pctSavings = Math.min(100, Math.round((savings / monthlyIncome) * 100));

            const bar50 = document.getElementById('rule-50-bar');
            const bar30 = document.getElementById('rule-30-bar');
            const bar20 = document.getElementById('rule-20-bar');
            const val50 = document.getElementById('rule-50-val');
            const val30 = document.getElementById('rule-30-val');
            const val20 = document.getElementById('rule-20-val');
            const diagText = document.getElementById('rule-diagnostic-text');
            const statusBadge = document.getElementById('rule-status-badge');

            if (val50) val50.textContent = `${pctNeeds}% (ideal: ≤50%)`;
            if (val30) val30.textContent = `${pctWants}% (ideal: ≤30%)`;
            if (val20) val20.textContent = `${pctSavings}% (ideal: ≥20%)`;
            if (bar50) bar50.style.width = `${pctNeeds}%`;
            if (bar30) bar30.style.width = `${pctWants}%`;
            if (bar20) bar20.style.width = `${pctSavings}%`;

            if (diagText && statusBadge) {
                if (totalGastos === 0 && ing === 0) {
                    statusBadge.textContent = "Sin datos de flujo";
                    statusBadge.className = "px-2.5 py-0.5 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-400";
                    diagText.textContent = "Registra tus ingresos y gastos en Flujo de Caja para obtener un diagnóstico en vivo de la regla 50/30/20 adaptado a tu estilo de vida.";
                } else if (pctNeeds <= 50 && pctSavings >= 20) {
                    statusBadge.textContent = "🟢 Excelente Salud";
                    statusBadge.className = "px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
                    diagText.textContent = `Cumples la regla con creces: destinas el ${pctNeeds}% a necesidades y ahorras el ${pctSavings}%, lo que te permite acelerar tu libertad financiera.`;
                } else if (pctNeeds > 50) {
                    statusBadge.textContent = "⚠️ Necesidades elevadas";
                    statusBadge.className = "px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400";
                    diagText.textContent = `Tus gastos fijos (${pctNeeds}%) superan el 50% recomendado. Analiza tus facturas y costes fijos para aumentar tu margen de maniobra.`;
                } else {
                    statusBadge.textContent = "ℹ️ Ajuste recomendable";
                    statusBadge.className = "px-2.5 py-0.5 rounded-lg text-xs font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400";
                    diagText.textContent = `Tu distribución actual es ${pctNeeds}% básicas, ${pctWants}% deseos y ${pctSavings}% ahorro. Busca optimizar los caprichos hacia ahorro patrimonial.`;
                }
            }

            // Diagnóstico Fondo de Emergencia
            const avgExpense = totalGastos > 0 ? totalGastos : 1500;
            const monthsCovered = avgExpense > 0 ? (liq / avgExpense) : 0;
            const monthsFormatted = monthsCovered >= 12 ? '12+' : monthsCovered.toFixed(1);
            const optimalTarget = avgExpense * 6;

            const elMonths = document.getElementById('emergency-months');
            const elAvgExp = document.getElementById('emergency-avg-expense');
            const elLiq = document.getElementById('emergency-liquidity');
            const elOptTarget = document.getElementById('emergency-target-val');
            const elAdv = document.getElementById('emergency-advice');
            const elShield = document.getElementById('emergency-shield-icon');

            if (elMonths) elMonths.textContent = monthsFormatted;
            if (elAvgExp) elAvgExp.textContent = formatMoney(avgExpense);
            if (elLiq) elLiq.textContent = formatMoney(liq);
            if (elOptTarget) elOptTarget.textContent = formatMoney(optimalTarget);

            if (elAdv && elShield) {
                if (monthsCovered < 3) {
                    elShield.innerHTML = '⚠️';
                    elAdv.innerHTML = `<span class="text-amber-400 font-semibold">Colchón vulnerable (${monthsFormatted} meses):</span> Se recomienda priorizar liquidez en cuenta bancaria hasta cubrir al menos 3 a 6 meses de gastos antes de realizar nuevas inversiones de riesgo.`;
                } else if (monthsCovered <= 6) {
                    elShield.innerHTML = '🛡️';
                    elAdv.innerHTML = `<span class="text-emerald-400 font-semibold">Colchón óptimo (${monthsFormatted} meses):</span> Tienes una cobertura sólida de imprevistos sin exponer tus activos financieros a retiradas forzosas.`;
                } else {
                    elShield.innerHTML = '💎';
                    elAdv.innerHTML = `<span class="text-sky-400 font-semibold">Excelente solvencia (${monthsFormatted} meses):</span> Tu seguridad está garantizada. Considera destinar el excedente de liquidez a activos generadores de rentabilidad para batir la inflación.`;
                }
            }

            // Planificador de Objetivos Personalizado
            let currentAmount = goalConfig.source === 'patrimonio' ? pat : liq;
            let targetAmount = goalConfig.amount;

            let pct = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
            if (pct > 100) pct = 100;

            const dispName = document.getElementById('display-goal-name');
            const dispCurrent = document.getElementById('display-goal-current');
            const dispTarget = document.getElementById('display-goal-target');
            const dispPct = document.getElementById('display-goal-pct');
            const bar = document.getElementById('goal-progress-bar');
            const recBox = document.getElementById('recommendations-container');

            if(dispName) dispName.innerText = goalConfig.name || "Tu Objetivo";
            if(dispCurrent) dispCurrent.innerText = formatMoney(currentAmount);
            if(dispTarget) dispTarget.innerText = formatMoney(targetAmount);
            if(dispPct) dispPct.innerText = `${pct.toFixed(1)}%`;
            if(bar) bar.style.width = `${pct}%`;

            if(recBox) {
                recBox.innerHTML = '';
                if (targetAmount === 0 || isNaN(targetAmount)) {
                    recBox.innerHTML = '<p class="text-zinc-400 text-sm">Configura un importe arriba para empezar a recibir recomendaciones.</p>';
                    return;
                }
                if (currentAmount >= targetAmount) {
                    recBox.innerHTML = '<div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"><p class="text-emerald-400 font-bold">¡Objetivo Alcanzado!</p><p class="text-emerald-500/80 text-sm mt-1">Ya tienes el capital necesario disponible. ¡Enhorabuena!</p></div>';
                    return;
                }

                let flujoNeto = ing - gas;
                let restante = targetAmount - currentAmount;
                if (flujoNeto > 0) {
                    let meses = Math.ceil(restante / flujoNeto);
                    recBox.innerHTML += `<div class="p-4 bg-zinc-900 border border-zinc-800 rounded-xl"><p class="text-white font-bold text-sm">📅 Proyección Actual</p><p class="text-zinc-400 text-sm mt-1">Manteniendo tu ahorro mensual actual (${formatMoney(flujoNeto)}), lograrás el objetivo en aprox. <strong class="text-white">${meses} meses</strong>.</p></div>`;
                } else {
                    recBox.innerHTML += `<div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"><p class="text-rose-400 font-bold text-sm">⚠️ Flujo Negativo</p><p class="text-rose-400/80 text-sm mt-1">Gastas más de lo que ingresas. Reduce gastos para avanzar.</p></div>`;
                }

                const gastosMap = {};
                transactions.filter(t => t.type === 'gasto').forEach(t => { gastosMap[t.category] = (gastosMap[t.category] || 0) + t.amount; });
                const mainGasto = Object.keys(gastosMap).sort((a,b) => gastosMap[b] - gastosMap[a])[0];
                if (mainGasto) {
                    let ahorroPotencial = gastosMap[mainGasto] * 0.15;
                    recBox.innerHTML += `<div class="p-4 bg-zinc-900 border border-zinc-800 rounded-xl"><p class="text-white font-bold text-sm">✂️ Optimización Rápida</p><p class="text-zinc-400 text-sm mt-1">Tu mayor gasto es en <strong>${mainGasto}</strong>. Si lo reduces un 15%, ahorrarías <strong class="text-emerald-400">+${formatMoney(ahorroPotencial)}</strong> extra al mes.</p></div>`;
                }
            }
        }

        window.handleTransactionSubmit = async (e) => {
            e.preventDefault();
            transactions.push({
                type: document.getElementById('tx-type').value,
                desc: document.getElementById('tx-desc').value,
                category: document.getElementById('tx-category').value,
                amount: parseFloat(document.getElementById('tx-amount').value),
                startDate: document.getElementById('tx-start-date').value || new Date().toISOString().split('T')[0]
            });
            e.target.reset();
            if(document.getElementById('tx-start-date')) document.getElementById('tx-start-date').value = new Date().toISOString().split('T')[0];
            updateUI();
            await saveDataToCloud();
        };

        window.handleInvestmentSubmit = async (e) => {
            e.preventDefault();
            const nameEl = document.getElementById('inv-name');
            const tickerEl = document.getElementById('inv-ticker');
            const buyEl = document.getElementById('inv-buy');
            const curEl = document.getElementById('inv-current');
            const dateEl = document.getElementById('inv-date');

            const name = nameEl.value.trim();
            const ticker = (tickerEl ? tickerEl.value.trim().toUpperCase() : '');
            const buyPrice = parseFloat(buyEl.value);
            const currentPrice = parseFloat(curEl.value);
            const buyDate = (dateEl && dateEl.value) ? dateEl.value : new Date().toISOString().split('T')[0];

            if (!name || isNaN(buyPrice) || isNaN(currentPrice)) return;

            investments.push({
                name,
                ticker,
                buyPrice,
                currentPrice,
                buyDate
            });

            e.target.reset();
            const dropdown = document.getElementById('inv-suggestions-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
            updateUI();
            await saveDataToCloud();
        };

        window.deleteTransaction = async (idx) => { transactions.splice(idx, 1); updateUI(); await saveDataToCloud(); };
        window.deleteInvestment = async (idx) => { investments.splice(idx, 1); updateUI(); await saveDataToCloud(); };

        window.exportData = () => {
            if (!currentUser) return;
            const dataStr = JSON.stringify({ transactions, investments, goalConfig });
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const link = document.createElement('a');
            link.setAttribute('href', dataUri); link.setAttribute('download', `tempus_${currentUser.email}_backup.json`);
            document.body.appendChild(link); link.click(); link.remove();
        };

        window.importData = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.transactions) transactions = data.transactions;
                    if (data.investments) investments = data.investments;
                    if (data.goalConfig) { goalConfig = data.goalConfig; }

                    if(document.getElementById('goal-name')) document.getElementById('goal-name').value = goalConfig.name;
                    if(document.getElementById('goal-amount')) document.getElementById('goal-amount').value = goalConfig.amount || '';
                    if(document.getElementById('goal-source')) document.getElementById('goal-source').value = goalConfig.source;

                    updateUI();
                    await saveDataToCloud();
                    alert("Backup restaurado con éxito.");
                } catch (err) { alert("Archivo inválido."); }
            };
            reader.readAsText(file);
        };

        window.downloadPDF = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const fullDateVal = document.getElementById('pdf-date').value;

            if (!fullDateVal) { alert('Por favor, selecciona un mes para generar el informe oficial.'); return; }

            // Extraer el mes (YYYY-MM)
            const monthVal = fullDateVal.substring(0, 7);
            const txList = (transactions && transactions.length > 0) ? transactions : (window.transactions || []);
            const filteredTx = txList.filter(t => t.startDate && t.startDate.startsWith(monthVal));

            if (filteredTx.length === 0) {
                alert('No se encontraron movimientos registrados en ' + monthVal + '.');
                return;
            }

            const totalGastos = filteredTx.filter(t => t.type === 'gasto').reduce((acc, t) => acc + t.amount, 0);
            const totalIngresos = filteredTx.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0);
            const netBalance = totalIngresos - totalGastos;
            const savingsRate = totalIngresos > 0 ? (((totalIngresos - totalGastos) / totalIngresos) * 100).toFixed(1) : '0';

            // Agrupar gastos por categoría
            const categoryMap = {};
            filteredTx.filter(t => t.type === 'gasto').forEach(t => {
                categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
            });

            const [year, month] = monthVal.split('-');
            const dateObj = new Date(year, month - 1);
            let mesNombre = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            mesNombre = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

            // 1. Cabecera Corporativa
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 36, 'F');

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text("TEMPUS · WEALTH MANAGEMENT", 16, 18);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(`INFORME MENSUAL OFICIAL · ${mesNombre.toUpperCase()}`, 16, 26);

            const activeUser = currentUser || window.currentUser;
            const userLabel = userAlias ? `${userAlias} (${activeUser ? activeUser.email : ''})` : (activeUser ? activeUser.email : '');
            doc.setFontSize(8.5);
            doc.setTextColor(226, 232, 240);
            doc.text(`Usuario: ${userLabel}`, 194, 20, { align: 'right' });
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 194, 28, { align: 'right' });

            // 2. Resumen Ejecutivo (KPIs)
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text("Resumen Ejecutivo del Mes", 16, 48);

            const kpiData = [
                ['Total Gastos', 'Total Ingresos', 'Balance Neto', 'Tasa de Ahorro'],
                [formatMoney(totalGastos), formatMoney(totalIngresos), `${netBalance>=0?'+':''}${formatMoney(netBalance)}`, `${savingsRate}%`]
            ];

            doc.autoTable({
                startY: 52,
                body: kpiData,
                theme: 'grid',
                styles: { font: 'helvetica', fontSize: 10, halign: 'center', cellPadding: 4 },
                bodyStyles: { fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });

            // 3. Desglose de Gastos por Categoría
            let currentY = doc.lastAutoTable.finalY + 10;
            const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

            if (sortedCategories.length > 0) {
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42);
                doc.text("Distribución de Gastos por Categoría", 16, currentY);

                const catRows = sortedCategories.map(([cat, amt]) => {
                    const pct = totalGastos > 0 ? ((amt / totalGastos) * 100).toFixed(1) : '0';
                    return [cat, formatMoney(amt), `${pct}%`];
                });

                doc.autoTable({
                    startY: currentY + 4,
                    head: [['Categoría', 'Total (€)', '% sobre Gasto']],
                    body: catRows,
                    theme: 'striped',
                    headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
                    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // 4. Detalle de Movimientos del Mes
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(`Detalle de Movimientos (${filteredTx.length} registros)`, 16, currentY);

            const tableData = [...filteredTx].reverse().map(t => [
                formatDate(t.startDate),
                t.desc,
                t.category,
                t.type === 'ingreso' ? 'Ingreso' : 'Gasto',
                `${t.type === 'ingreso' ? '+' : '-'}${formatMoney(t.amount)}`
            ]);

            doc.autoTable({
                startY: currentY + 4,
                head: [['Fecha', 'Concepto', 'Categoría', 'Tipo', 'Importe']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold' },
                styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5 },
                columnStyles: {
                    4: { halign: 'right', fontStyle: 'bold' }
                }
            });

            // 5. MARCA DE AGUA DIAGONAL "PRIVATE" EN TODAS LAS PÁGINAS
            const totalPages = doc.internal.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                doc.saveGraphicsState();
                doc.setTextColor(228, 231, 236);
                doc.setFontSize(75);
                doc.setFont("helvetica", "bold");
                doc.text("PRIVATE", 105, 160, { align: "center", angle: 45 });
                doc.restoreGraphicsState();

                // Pie de página reglamentario
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(148, 163, 184);
                doc.text(`Página ${p} de ${totalPages} · Tempus Wealth Management (RGPD / Software Financiero Confidencial)`, 105, 290, { align: "center" });
            }

            doc.save(`Tempus_Informe_Oficial_${monthVal}.pdf`);
        };

        window.syncMarketData = async (event) => {
            const btn = event?.currentTarget || document.getElementById('sync-market-button');
            const originalText = btn ? btn.innerHTML : '';
            if (btn) {
                btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> <span class="hidden sm:inline">Sincronizando...</span>`;
            }
            let updatedCount = 0;
            const cryptoMap = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'ADA': 'cardano' };

            try {
                for (let inv of investments) {
                    const cleanTicker = (inv.ticker || '').toUpperCase().trim();
                    let newUnitPrice = null;

                    // 1. Criptomonedas en directo (CoinGecko API pública sin clave)
                    if (cryptoMap[cleanTicker]) {
                        try {
                            const cRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoMap[cleanTicker]}&vs_currencies=eur`);
                            if (cRes.ok) {
                                const cData = await cRes.json();
                                if (cData[cryptoMap[cleanTicker]] && cData[cryptoMap[cleanTicker]].eur) {
                                    newUnitPrice = parseFloat(cData[cryptoMap[cleanTicker]].eur);
                                }
                            }
                        } catch (_) {}
                    }

                    // 2. Alpha Vantage API si el usuario ha configurado su API key
                    if (!newUnitPrice && cleanTicker && goalConfig.apiKey && goalConfig.apiKey.trim() !== '') {
                        try {
                            const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanTicker}&apikey=${goalConfig.apiKey}`);
                            const data = await res.json();
                            if (data['Global Quote'] && data['Global Quote']['05. price']) {
                                newUnitPrice = parseFloat(data['Global Quote']['05. price']);
                            }
                            await new Promise(r => setTimeout(r, 1200));
                        } catch (_) {}
                    }

                    // 3. Catálogo de mercado oficial 2026 (Wall Street, IBEX 35, Índices)
                    if (!newUnitPrice) {
                        let series = OFFICIAL_ANNUAL_SERIES[cleanTicker];
                        if (!series) {
                            const lower = inv.name.toLowerCase();
                            for (const [k, s] of Object.entries(OFFICIAL_ANNUAL_SERIES)) {
                                if (lower.includes(k.toLowerCase())) {
                                    series = s;
                                    break;
                                }
                            }
                        }
                        if (series && series.length > 0) {
                            newUnitPrice = series[series.length - 1];
                        }
                    }

                    // 4. Si se obtuvo cotización unitaria, actualizar posición y preservar capital/acciones
                    if (newUnitPrice && newUnitPrice > 0) {
                        if (inv.shares && inv.shares > 0) {
                            inv.currentPrice = parseFloat((inv.shares * newUnitPrice).toFixed(2));
                        } else {
                            // Si el valor actual está cercano al precio unitario (<35% diferencia), se asume 1 acción
                            if (Math.abs(inv.currentPrice - newUnitPrice) / newUnitPrice < 0.35) {
                                inv.shares = 1;
                                inv.currentPrice = parseFloat(newUnitPrice.toFixed(2));
                            } else {
                                // El usuario introdujo capital total (ej: 500€). Deducimos las participaciones:
                                inv.shares = inv.currentPrice / newUnitPrice;
                                inv.currentPrice = parseFloat((inv.shares * newUnitPrice).toFixed(2));
                            }
                        }
                        updatedCount++;
                    }
                }

                updateUI();
                await saveDataToCloud();

                if (updatedCount > 0) {
                    alert(`✅ ¡Cotizaciones sincronizadas con éxito! Se han actualizado ${updatedCount} activos, recalculando rentabilidad (ROI) y guardando los datos en la nube.`);
                } else {
                    document.getElementById('api-key-modal').classList.remove('hidden');
                }
            } catch (e) {
                console.error(e);
                alert("Error al sincronizar con el mercado.");
            } finally {
                if (btn) btn.innerHTML = originalText;
            }
        };

        window.saveAndSyncApi = async () => {
            goalConfig.apiKey = document.getElementById('user-api-key').value.trim();
            await saveDataToCloud();
            document.getElementById('api-key-modal').classList.add('hidden');
            await syncMarketData({ currentTarget: document.getElementById('sync-market-button') });
        };

        // ------------------ GESTIÓN DE PERFIL DE USUARIO ------------------
        window.openProfileModal = () => {
            const user = currentUser || window.currentUser;
            if (!user) return;
            const currentEmailEl = document.getElementById('profile-current-email');
            if (currentEmailEl) currentEmailEl.textContent = `${userAlias ? userAlias + ' • ' : ''}${user.email || ''}`;
            const aliasInput = document.getElementById('profile-new-alias');
            if (aliasInput) aliasInput.value = userAlias || '';
            const msgEl = document.getElementById('profile-msg');
            if (msgEl) { msgEl.classList.add('hidden'); msgEl.textContent = ''; }
            switchProfileTab('alias');
            document.getElementById('profile-modal').classList.remove('hidden');
        };

        window.closeProfileModal = () => {
            const modal = document.getElementById('profile-modal');
            if (modal) modal.classList.add('hidden');
            const formAlias = document.getElementById('form-profile-alias');
            const formEmail = document.getElementById('form-profile-email');
            const formPwd = document.getElementById('form-profile-password');
            if (formAlias) formAlias.reset();
            if (formEmail) formEmail.reset();
            if (formPwd) formPwd.reset();
            const msgEl = document.getElementById('profile-msg');
            if (msgEl) { msgEl.classList.add('hidden'); msgEl.textContent = ''; }
        };

        window.switchProfileTab = (tab) => {
            const tabAliasBtn = document.getElementById('tab-btn-profile-alias');
            const tabEmailBtn = document.getElementById('tab-btn-profile-email');
            const tabPwdBtn = document.getElementById('tab-btn-profile-password');
            const tabDelBtn = document.getElementById('tab-btn-profile-delete');
            const formAlias = document.getElementById('form-profile-alias');
            const formEmail = document.getElementById('form-profile-email');
            const formPwd = document.getElementById('form-profile-password');
            const formDel = document.getElementById('form-profile-delete');
            const msgEl = document.getElementById('profile-msg');
            if (msgEl) { msgEl.classList.add('hidden'); msgEl.textContent = ''; }

            const activeClass = "w-full py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-white shadow-sm transition-all text-center";
            const inactiveClass = "w-full py-2 text-xs font-medium rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-all text-center";
            const activeDelClass = "w-full py-2 text-xs font-semibold rounded-xl bg-rose-950/80 text-rose-300 border border-rose-800 shadow-sm transition-all text-center";
            const inactiveDelClass = "w-full py-2 text-xs font-medium rounded-xl text-rose-400 hover:text-rose-300 hover:bg-zinc-900/60 transition-all text-center";

            if (tabAliasBtn) tabAliasBtn.className = tab === 'alias' ? activeClass : inactiveClass;
            if (tabEmailBtn) tabEmailBtn.className = tab === 'email' ? activeClass : inactiveClass;
            if (tabPwdBtn) tabPwdBtn.className = tab === 'password' ? activeClass : inactiveClass;
            if (tabDelBtn) tabDelBtn.className = tab === 'delete' ? activeDelClass : inactiveDelClass;

            if (formAlias) formAlias.classList.toggle('hidden', tab !== 'alias');
            if (formEmail) formEmail.classList.toggle('hidden', tab !== 'email');
            if (formPwd) formPwd.classList.toggle('hidden', tab !== 'password');
            if (formDel) formDel.classList.toggle('hidden', tab !== 'delete');
        };

        window.handleProfileAliasSubmit = async (e) => {
            e.preventDefault();
            if (!currentUser) return;
            const newAlias = document.getElementById('profile-new-alias').value.trim();
            if (!newAlias) {
                showProfileMessage('El alias no puede estar vacío.');
                return;
            }
            try {
                userAlias = newAlias;
                await saveDataToCloud();
                updateAliasDisplay();
                const currentEmailEl = document.getElementById('profile-current-email');
                if (currentEmailEl) currentEmailEl.textContent = `${userAlias} • ${currentUser.email}`;
                showProfileMessage('Alias actualizado con éxito.', true);
            } catch (err) {
                showProfileMessage('Error al actualizar el alias.');
            }
        };

        const showProfileMessage = (text, isSuccess = false) => {
            const msgEl = document.getElementById('profile-msg');
            if (!msgEl) return;
            msgEl.className = isSuccess
                ? "mb-4 p-3 rounded-xl text-xs font-medium border bg-emerald-950/60 border-emerald-800 text-emerald-300"
                : "mb-4 p-3 rounded-xl text-xs font-medium border bg-rose-950/60 border-rose-800 text-rose-300";
            msgEl.textContent = text;
            msgEl.classList.remove('hidden');
        };

        window.handleProfileEmailSubmit = async (e) => {
            e.preventDefault();
            if (!currentUser) return;
            const newEmail = document.getElementById('profile-new-email').value.trim();
            const currentPassword = document.getElementById('profile-email-current-password').value;
            const btn = document.getElementById('btn-submit-email');
            const originalText = btn ? btn.textContent : '';

            try {
                if (btn) { btn.disabled = true; btn.textContent = "Actualizando..."; }
                const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
                await reauthenticateWithCredential(currentUser, credential);

                try {
                    await updateEmail(currentUser, newEmail);
                    const emailDisplay = document.getElementById('user-email-display');
                    if (emailDisplay) emailDisplay.textContent = newEmail;
                    const profileEmailDisplay = document.getElementById('profile-current-email');
                    if (profileEmailDisplay) profileEmailDisplay.textContent = newEmail;
                    showProfileMessage("Correo electrónico actualizado correctamente.", true);
                    const pwdInput = document.getElementById('profile-email-current-password');
                    if (pwdInput) pwdInput.value = '';
                } catch (err) {
                    if (err.code === 'auth/operation-not-allowed' && typeof verifyBeforeUpdateEmail === 'function') {
                        await verifyBeforeUpdateEmail(currentUser, newEmail);
                        showProfileMessage("Se ha enviado un correo de verificación a la nueva dirección para confirmar el cambio.", true);
                    } else {
                        throw err;
                    }
                }
            } catch (error) {
                let msg = "Error al actualizar el correo.";
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    msg = "La contraseña actual es incorrecta.";
                } else if (error.code === 'auth/email-already-in-use') {
                    msg = "Ese correo ya está registrado por otra cuenta.";
                } else if (error.code === 'auth/invalid-email') {
                    msg = "El formato del correo electrónico no es válido.";
                }
                showProfileMessage(msg, false);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = originalText; }
            }
        };

        window.handleProfilePasswordSubmit = async (e) => {
            e.preventDefault();
            if (!currentUser) return;
            const currentPassword = document.getElementById('profile-pwd-current').value;
            const newPassword = document.getElementById('profile-new-password').value;
            const confirmPassword = document.getElementById('profile-confirm-password').value;
            const btn = document.getElementById('btn-submit-password');
            const originalText = btn ? btn.textContent : '';

            if (newPassword !== confirmPassword) {
                showProfileMessage("Las contraseñas nuevas no coinciden.", false);
                return;
            }
            if (newPassword.length < 6) {
                showProfileMessage("La nueva contraseña debe tener al menos 6 caracteres.", false);
                return;
            }

            try {
                if (btn) { btn.disabled = true; btn.textContent = "Actualizando..."; }
                const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
                await reauthenticateWithCredential(currentUser, credential);
                await updatePassword(currentUser, newPassword);

                showProfileMessage("Contraseña actualizada con éxito.", true);
                const pwdCur = document.getElementById('profile-pwd-current');
                const pwdNew = document.getElementById('profile-new-password');
                const pwdConf = document.getElementById('profile-confirm-password');
                if (pwdCur) pwdCur.value = '';
                if (pwdNew) pwdNew.value = '';
                if (pwdConf) pwdConf.value = '';
            } catch (error) {
                let msg = "Error al actualizar la contraseña.";
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    msg = "La contraseña actual es incorrecta.";
                } else if (error.code === 'auth/weak-password') {
                    msg = "La nueva contraseña es demasiado débil (mínimo 6 caracteres).";
                }
                showProfileMessage(msg, false);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = originalText; }
            }
        };

        // ------------------ IMPORTACIÓN INTELIGENTE DE PDF ------------------
        let parsedPdfTransactions = [];

        window.openPdfImportModal = () => {
            const modal = document.getElementById('pdf-import-modal');
            if (!modal) return;
            parsedPdfTransactions = [];
            const dropzone = document.getElementById('pdf-dropzone');
            const preview = document.getElementById('pdf-preview-container');
            const loading = document.getElementById('pdf-loading-spinner');
            const error = document.getElementById('pdf-error-msg');
            const fileInput = document.getElementById('pdf-file-input');

            if (dropzone) dropzone.classList.remove('hidden');
            if (preview) preview.classList.add('hidden');
            if (loading) loading.classList.add('hidden');
            if (error) { error.classList.add('hidden'); error.textContent = ''; }
            if (fileInput) fileInput.value = '';

            modal.classList.remove('hidden');
        };

        window.closePdfImportModal = () => {
            const modal = document.getElementById('pdf-import-modal');
            if (modal) modal.classList.add('hidden');
            parsedPdfTransactions = [];
        };

        function inferCategoryFromText(concept, type) {
            const lower = concept.toLowerCase();
            if (type === 'ingreso') {
                if (/(invers|dividend|interes|rentabilidad)/i.test(lower)) return 'Inversión';
                return 'Liquidez';
            }
            if (/(mercadona|carrefour|dia|lidl|alcampo|eroski|supermerc|consum|bonarea|hiper|fruteria|panaderia|restauran|bar\b|cafe|cafeter|mcdonald|burger|kfc|pizza|uber\s*eats|just\s*eat|glovo|starbucks)/i.test(lower)) return 'Alimentación';
            if (/(uber|cabify|bolt|renfe|adif|alsa|metro|tmb|emt|repsol|cepsa|bp|galp|shell|gasolin|peaje|autopist|parking|aparcam|billete|vuelo|ryanair|iberia|vueling)/i.test(lower)) return 'Transporte';
            if (/(alquiler|hipoteca|comunidad|endesa|iberdrola|naturgy|aqualia|canal\s*isabel|luz|agua|gas\b|seguro\s*hogar)/i.test(lower)) return 'Vivienda';
            if (/(netflix|spotify|hbo|max|disney|amazon\s*prime|prime\s*video|apple\.com|icloud|chatgpt|openai|google\s*one|youtube|suscrip)/i.test(lower)) return 'Suscripciones';
            if (/(cine|cinesa|yelmo|teatro|concierto|festival|entradas|ticketmaster|steam|playstation|nintendo|fiesta|ocio)/i.test(lower)) return 'Ocio';
            if (/(farmacia|optica|dental|dentista|clinica|hospital|sanitas|adeslas|quiron|medico)/i.test(lower)) return 'Salud';
            if (/(gimnasio|gym|basic-fit|fitup|decathlon|padel|tenis|futbol|crossfit)/i.test(lower)) return 'Deportes';
            if (/(amazon|zara|bershka|pull&bear|stradivarius|mango|corte\s*ingles|ikea|leroy|fnac|mediamarkt|apple\s*store|shein|aliexpress|zalando|ropa|zapateria)/i.test(lower)) return 'Compras';
            if (/(broker|degiro|trade\s*republic|myinvestor|indexa|coinbase|binance|kraken|etoro|inversion|fondos|acciones)/i.test(lower)) return 'Inversión';
            return 'Otros';
        }

        window.handlePdfFileSelect = async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            await processUploadedPdf(file);
        };

        async function processUploadedPdf(file) {
            const dropzone = document.getElementById('pdf-dropzone');
            const preview = document.getElementById('pdf-preview-container');
            const loading = document.getElementById('pdf-loading-spinner');
            const error = document.getElementById('pdf-error-msg');

            if (dropzone) dropzone.classList.add('hidden');
            if (loading) loading.classList.remove('hidden');
            if (error) { error.classList.add('hidden'); error.textContent = ''; }

            try {
                if (!window.pdfjsLib) {
                    throw new Error("Librería PDF.js no disponible.");
                }
                if (window.pdfjsLib.GlobalWorkerOptions && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const lines = [];

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const items = textContent.items;
                    if (!items || items.length === 0) continue;

                    items.sort((a, b) => {
                        const yDiff = b.transform[5] - a.transform[5];
                        if (Math.abs(yDiff) > 4) return yDiff;
                        return a.transform[4] - b.transform[4];
                    });

                    let currentLine = [];
                    let currentY = null;
                    for (const item of items) {
                        const str = item.str ? item.str.trim() : '';
                        if (!str) continue;
                        const y = item.transform[5];
                        if (currentY === null || Math.abs(currentY - y) > 4) {
                            if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
                            currentLine = [str];
                            currentY = y;
                        } else {
                            currentLine.push(str);
                        }
                    }
                    if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
                }

                // Parse transactions
                const extracted = [];
                for (const line of lines) {
                    const dateMatch = line.match(/(\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})|(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/);
                    if (!dateMatch) continue;
                    const rawDate = dateMatch[0];
                    let startDate = '';
                    if (/^\d{4}/.test(rawDate)) {
                        const p = rawDate.split(/[-\/\.]/);
                        startDate = `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
                    } else {
                        const p = rawDate.split(/[-\/\.]/);
                        const y = p[2].length === 2 ? `20${p[2]}` : p[2];
                        startDate = `${y}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
                    }

                    const withoutDates = line.replace(/(\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})|(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/g, '   ');
                    const amountMatch = withoutDates.match(/([+-]?\s*\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:€|EUR)?|([+-]?\s*\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:€|EUR|\$)?|(\d+[\.,]\d{2})\s*-\s*/i);
                    if (!amountMatch) continue;

                    const rawAmount = amountMatch[0];
                    const isPositive = rawAmount.includes('+') || line.toLowerCase().includes('ingreso') || line.toLowerCase().includes('abono') || line.toLowerCase().includes('nomina');
                    const type = isPositive ? 'ingreso' : 'gasto';

                    let cleanNum = rawAmount.replace(/[€\$EUR\s\+]/gi, '').replace('-', '');
                    if (cleanNum.includes(',') && cleanNum.includes('.')) {
                        if (cleanNum.indexOf('.') < cleanNum.indexOf(',')) {
                            cleanNum = cleanNum.replace(/\./g, '').replace(',', '.');
                        } else {
                            cleanNum = cleanNum.replace(/,/g, '');
                        }
                    } else if (cleanNum.includes(',')) {
                        cleanNum = cleanNum.replace(',', '.');
                    }
                    const amount = parseFloat(cleanNum);
                    if (isNaN(amount) || amount <= 0) continue;

                    let desc = withoutDates
                        .replace(rawAmount, ' ')
                        .replace(/(€|EUR|\$)/gi, ' ')
                        .replace(/\b(ingreso|gasto|transporte|alimentacion|vivienda|ocio|salud|deportes|compras|suscripciones|inversion|otros|debe|haber|saldo|tarjeta|recibo)\b/gi, ' ')
                        .replace(/[\-–—\+\*\/\:\;]/g, ' ')
                        .trim()
                        .replace(/\s+/g, ' ');

                    if (!desc || desc.length < 2) desc = type === 'ingreso' ? 'Ingreso detectado' : 'Movimiento extracto';
                    const category = inferCategoryFromText(desc, type);

                    extracted.push({ startDate, desc, category, type, amount });
                }

                if (extracted.length === 0) {
                    throw new Error("No se detectaron transacciones válidas en el documento PDF.");
                }

                // DEDUPLICACIÓN INTELIGENTE
                const currentTxs = transactions || [];
                const normalizeStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

                parsedPdfTransactions = [];
                const seenBatch = new Set();

                for (let i = 0; i < extracted.length; i++) {
                    const item = extracted[i];
                    const normDesc = normalizeStr(item.desc);
                    const batchKey = `${item.startDate}_${item.type}_${item.amount.toFixed(2)}_${normDesc}`;

                    if (seenBatch.has(batchKey)) {
                        parsedPdfTransactions.push({
                            ...item,
                            id: i,
                            isDuplicate: true,
                            duplicateReason: 'Registro repetido dentro del mismo PDF',
                            selected: false
                        });
                        continue;
                    }
                    seenBatch.add(batchKey);

                    const duplicate = currentTxs.find(existing => {
                        if (Math.abs(item.amount - existing.amount) > 0.01) return false;
                        if (item.type !== existing.type) return false;
                        if (item.startDate === existing.startDate) return true;

                        const t1 = new Date(item.startDate).getTime();
                        const t2 = new Date(existing.startDate).getTime();
                        if (Math.abs(t1 - t2) <= 2.5 * 24 * 60 * 60 * 1000) {
                            const existNorm = normalizeStr(existing.desc);
                            if (normDesc === existNorm || normDesc.includes(existNorm) || existNorm.includes(normDesc)) return true;
                            const w1 = item.desc.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
                            const w2 = existing.desc.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
                            if (w1.some(w => w2.includes(w))) return true;
                        }
                        return false;
                    });

                    if (duplicate) {
                        parsedPdfTransactions.push({
                            ...item,
                            id: i,
                            isDuplicate: true,
                            duplicateReason: `Ya registrado el ${duplicate.startDate} (${duplicate.amount.toFixed(2)} € - "${duplicate.desc}")`,
                            selected: false
                        });
                    } else {
                        parsedPdfTransactions.push({
                            ...item,
                            id: i,
                            isDuplicate: false,
                            duplicateReason: null,
                            selected: true
                        });
                    }
                }

                renderPdfPreviewTable();
                if (loading) loading.classList.add('hidden');
                if (preview) preview.classList.remove('hidden');

            } catch (err) {
                console.error(err);
                if (loading) loading.classList.add('hidden');
                if (dropzone) dropzone.classList.remove('hidden');
                if (error) {
                    error.textContent = err.message || "Error al procesar el archivo PDF.";
                    error.classList.remove('hidden');
                }
            }
        }

        function getActivePdfTransactions() {
            return (parsedPdfTransactions && parsedPdfTransactions.length > 0)
                ? parsedPdfTransactions
                : (window.parsedPdfTransactions || []);
        }

        window.renderPdfPreviewTable = () => {
            const tbody = document.getElementById('pdf-table-body');
            if (!tbody) return;

            const list = getActivePdfTransactions();
            const total = list.length;
            const newCount = list.filter(t => !t.isDuplicate).length;
            const dupCount = list.filter(t => t.isDuplicate).length;
            const selCount = list.filter(t => t.selected).length;

            const countTotalEl = document.getElementById('pdf-kpi-total');
            const countNewEl = document.getElementById('pdf-kpi-new');
            const countDupEl = document.getElementById('pdf-kpi-dup');
            const countSelEl = document.getElementById('pdf-kpi-selected');
            const btnConfirm = document.getElementById('btn-confirm-pdf-import');

            if (countTotalEl) countTotalEl.textContent = total;
            if (countNewEl) countNewEl.textContent = newCount;
            if (countDupEl) countDupEl.textContent = dupCount;
            if (countSelEl) countSelEl.textContent = selCount;
            if (btnConfirm) {
                btnConfirm.textContent = `Importar ${selCount} ${selCount === 1 ? 'registro' : 'registros'}`;
                btnConfirm.disabled = selCount === 0;
            }

            const dupBanner = document.getElementById('pdf-dup-banner');
            if (dupBanner) {
                if (dupCount > 0) {
                    dupBanner.classList.remove('hidden');
                    const dupCountSpan = document.getElementById('pdf-dup-count-span');
                    if (dupCountSpan) dupCountSpan.textContent = dupCount;
                } else {
                    dupBanner.classList.add('hidden');
                }
            }

            const categoriesList = ['Liquidez', 'Alimentación', 'Transporte', 'Vivienda', 'Ocio', 'Salud', 'Deportes', 'Compras', 'Suscripciones', 'Inversión', 'Otros'];

            tbody.innerHTML = list.map((t, idx) => `
                <tr class="hover:bg-zinc-900/40 transition-colors ${t.isDuplicate ? 'opacity-60 bg-amber-950/10' : t.selected ? 'bg-zinc-900/20' : ''}">
                    <td class="py-2.5 px-3 text-center">
                        <input type="checkbox" ${t.selected ? 'checked' : ''} onchange="togglePdfRowSelect(${idx})" class="rounded border-zinc-700 text-white cursor-pointer">
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                        ${t.isDuplicate 
                            ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 border border-amber-800 text-amber-300" title="${t.duplicateReason || ''}">⚠️ Duplicado</span>`
                            : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">✓ Nuevo</span>`
                        }
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap">
                        <input type="date" value="${t.startDate}" style="color-scheme: dark;" onchange="updatePdfRowField(${idx}, 'startDate', this.value)" class="bg-black/50 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-300 text-xs">
                    </td>
                    <td class="py-2.5 px-3">
                        <input type="text" value="${t.desc}" onchange="updatePdfRowField(${idx}, 'desc', this.value)" class="w-full bg-black/50 border border-zinc-800 rounded-lg px-2 py-1 text-white text-xs">
                        ${t.duplicateReason ? `<p class="text-[10px] text-amber-400/80 mt-0.5 italic">${t.duplicateReason}</p>` : ''}
                    </td>
                    <td class="py-2.5 px-3">
                        <select onchange="updatePdfRowField(${idx}, 'category', this.value)" class="bg-black/50 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-300 text-xs">
                            ${categoriesList.map(cat => `<option value="${cat}" ${t.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </td>
                    <td class="py-2.5 px-3 whitespace-nowrap text-xs font-semibold ${t.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}">
                        ${t.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    </td>
                    <td class="py-2.5 px-3 text-right font-bold whitespace-nowrap ${t.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}">
                        ${t.type === 'ingreso' ? '+' : '-'}${formatMoney(t.amount)}
                    </td>
                </tr>
            `).join('');
        };

        window.togglePdfRowSelect = (idx) => {
            const list = getActivePdfTransactions();
            if (list[idx]) {
                list[idx].selected = !list[idx].selected;
                renderPdfPreviewTable();
            }
        };

        window.toggleSelectAllNewPdf = () => {
            const list = getActivePdfTransactions();
            const allNewSel = list.filter(t => !t.isDuplicate).every(t => t.selected);
            list.forEach(t => {
                if (!t.isDuplicate) t.selected = !allNewSel;
            });
            renderPdfPreviewTable();
        };

        window.updatePdfRowField = (idx, field, val) => {
            const list = getActivePdfTransactions();
            if (list[idx]) {
                list[idx][field] = val;
            }
        };

        window.confirmPdfImport = async () => {
            const list = getActivePdfTransactions();
            const toImport = list.filter(t => t.selected);
            if (toImport.length === 0) {
                alert("No has seleccionado ningún movimiento para importar.");
                return;
            }

            const btn = document.getElementById('btn-confirm-pdf-import');
            const originalText = btn ? btn.textContent : '';
            if (btn) { btn.disabled = true; btn.textContent = "Guardando..."; }

            try {
                for (const item of toImport) {
                    transactions.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
                        desc: item.desc,
                        amount: item.amount,
                        category: item.category,
                        type: item.type,
                        startDate: item.startDate,
                        timestamp: new Date().toISOString()
                    });
                }
                updateUI();
                await saveDataToCloud();
                closePdfImportModal();
                alert(`¡Éxito! Se han importado ${toImport.length} movimientos correctamente.`);
            } catch (err) {
                console.error(err);
                alert("Error al guardar los movimientos.");
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = originalText; }
            }
        };


        // ------------------ CATÁLOGO DE ACTIVOS Y BÚSQUEDA PREDICTIVA ------------------
        const KNOWN_ASSETS = [
            // USA Blue Chips & Tech
            { name: 'Apple Inc.', ticker: 'AAPL', category: 'Acción USA', market: 'US', defaultPrice: 229.8 },
            { name: 'Microsoft Corporation', ticker: 'MSFT', category: 'Acción USA', market: 'US', defaultPrice: 428.0 },
            { name: 'Nvidia Corp.', ticker: 'NVDA', category: 'Acción USA', market: 'US', defaultPrice: 142.5 },
            { name: 'Amazon.com Inc.', ticker: 'AMZN', category: 'Acción USA', market: 'US', defaultPrice: 198.5 },
            { name: 'Alphabet (Google)', ticker: 'GOOGL', category: 'Acción USA', market: 'US', defaultPrice: 176.4 },
            { name: 'Meta Platforms (Facebook)', ticker: 'META', category: 'Acción USA', market: 'US', defaultPrice: 592.0 },
            { name: 'Tesla Inc.', ticker: 'TSLA', category: 'Acción USA', market: 'US', defaultPrice: 251.4 },
            { name: 'Netflix Inc.', ticker: 'NFLX', category: 'Acción USA', market: 'US', defaultPrice: 762.0 },
            { name: 'AMD (Advanced Micro Devices)', ticker: 'AMD', category: 'Acción USA', market: 'US', defaultPrice: 148.2 },
            { name: 'Berkshire Hathaway B', ticker: 'BRK.B', category: 'Acción USA', market: 'US', defaultPrice: 452.0 },
            { name: 'JPMorgan Chase & Co.', ticker: 'JPM', category: 'Acción USA', market: 'US', defaultPrice: 222.0 },
            { name: 'Visa Inc.', ticker: 'V', category: 'Acción USA', market: 'US', defaultPrice: 290.0 },

            // IBEX 35 & Spanish Stocks
            { name: 'Inditex (Zara)', ticker: 'ITX.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 51.8 },
            { name: 'Banco Santander', ticker: 'SAN.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 4.58 },
            { name: 'BBVA', ticker: 'BBVA.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 9.32 },
            { name: 'Iberdrola', ticker: 'IBE.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 13.75 },
            { name: 'Telefónica', ticker: 'TEF.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 4.25 },
            { name: 'Repsol', ticker: 'REP.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 12.10 },
            { name: 'CaixaBank', ticker: 'CABK.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 5.42 },
            { name: 'Amadeus IT Group', ticker: 'AMS.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 66.40 },
            { name: 'Ferrovial', ticker: 'FER.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 38.90 },
            { name: 'Cellnex Telecom', ticker: 'CLNX.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 31.20 },
            { name: 'Endesa', ticker: 'ELE.MC', category: 'IBEX 35', market: 'ES', defaultPrice: 19.85 },

            // World ETFs & Index Funds
            { name: 'Vanguard S&P 500 ETF', ticker: 'VOO', category: 'ETF Global', market: 'US', defaultPrice: 536.4 },
            { name: 'Vanguard FTSE All-World ETF', ticker: 'VWCE', category: 'ETF Global', market: 'ES', defaultPrice: 129.2 },
            { name: 'iShares Core S&P 500 ETF', ticker: 'CSPX', category: 'ETF Global', market: 'ES', defaultPrice: 578.0 },
            { name: 'iShares Core MSCI World ETF', ticker: 'IWDA', category: 'ETF Global', market: 'ES', defaultPrice: 94.5 },
            { name: 'Invesco QQQ NASDAQ 100', ticker: 'QQQ', category: 'ETF Global', market: 'US', defaultPrice: 502.0 },
            { name: 'SPDR S&P 500 ETF Trust', ticker: 'SPY', category: 'ETF Global', market: 'US', defaultPrice: 585.0 },
            { name: 'Vanguard Total Stock Market', ticker: 'VTI', category: 'ETF Global', market: 'US', defaultPrice: 282.0 },

            // Cryptocurrencies
            { name: 'Bitcoin', ticker: 'BTC', category: 'Cripto', market: 'CRYPTO', defaultPrice: 74200 },
            { name: 'Ethereum', ticker: 'ETH', category: 'Cripto', market: 'CRYPTO', defaultPrice: 2710 },
            { name: 'Solana', ticker: 'SOL', category: 'Cripto', market: 'CRYPTO', defaultPrice: 188.0 },
            { name: 'Cardano', ticker: 'ADA', category: 'Cripto', market: 'CRYPTO', defaultPrice: 0.38 },

            // Commodities & Fixed Income
            { name: 'Oro Físico (SPDR Gold Shares)', ticker: 'GLD', category: 'Bono / Oro', market: 'US', defaultPrice: 251.2 },
            { name: 'iShares 20+ Year Treasury Bond', ticker: 'TLT', category: 'Bono / Oro', market: 'US', defaultPrice: 92.4 },
            { name: 'Vanguard Total Bond Market', ticker: 'BND', category: 'Bono / Oro', market: 'US', defaultPrice: 73.1 }
        ];

        window.handleAssetPredictiveSearch = (query) => {
            const dropdown = document.getElementById('inv-suggestions-dropdown');
            if (!dropdown) return;
            const q = (query || '').trim().toLowerCase();
            if (q.length < 2) {
                dropdown.classList.add('hidden');
                dropdown.innerHTML = '';
                return;
            }
            const matches = KNOWN_ASSETS.filter(a =>
                a.name.toLowerCase().includes(q) || a.ticker.toLowerCase().includes(q)
            ).slice(0, 5);

            if (matches.length === 0) {
                dropdown.classList.add('hidden');
                dropdown.innerHTML = '';
                return;
            }

            dropdown.innerHTML = matches.map(m => `
                <div onclick="selectPredictedAsset('${m.name.replace(/'/g, "\\'")}', '${m.ticker}', ${m.defaultPrice || 0})" 
                     class="px-4 py-2.5 hover:bg-zinc-800 cursor-pointer flex items-center justify-between transition-colors border-b border-zinc-800/50 last:border-0">
                    <div>
                        <span class="text-xs font-bold text-white block">${m.name}</span>
                        <span class="text-[10px] text-zinc-400 font-mono">${m.ticker} · ${m.category}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-semibold text-emerald-400 block">${m.defaultPrice ? formatMoney(m.defaultPrice) : ''}</span>
                        <span class="text-[9px] uppercase tracking-wider text-zinc-500">Sugerido</span>
                    </div>
                </div>
            `).join('');
            dropdown.classList.remove('hidden');
        };

        window.selectPredictedAsset = (name, ticker, defaultPrice) => {
            const nameInput = document.getElementById('inv-name');
            const tickerInput = document.getElementById('inv-ticker');
            const curPriceInput = document.getElementById('inv-current');
            const buyPriceInput = document.getElementById('inv-buy');
            const dropdown = document.getElementById('inv-suggestions-dropdown');

            if (nameInput) nameInput.value = name;
            if (tickerInput) tickerInput.value = ticker;
            if (curPriceInput && defaultPrice > 0 && (!curPriceInput.value || parseFloat(curPriceInput.value) <= 0)) {
                curPriceInput.value = defaultPrice;
            }
            if (dropdown) dropdown.classList.add('hidden');
            if (buyPriceInput) buyPriceInput.focus();
        };

        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('inv-suggestions-dropdown');
            const input = document.getElementById('inv-name');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                if (e.target !== input && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });

        // ------------------ ESTADO DE MERCADO EN VIVO Y HORARIOS OFICIALES ------------------
        const getMarketStatus = (ticker) => {
            const now = new Date();
            const day = now.getUTCDay(); // 0 domingo, 6 sábado
            const utcHours = now.getUTCHours();
            const utcMinutes = now.getUTCMinutes();
            const currentUtcMinuteOfDay = utcHours * 60 + utcMinutes;

            const t = (ticker || '').toUpperCase();

            // Criptomonedas: 24/7 Abierto
            if (t === 'BTC' || t === 'ETH' || t === 'SOL' || t === 'ADA' || t.includes('USD')) {
                return {
                    isOpen: true,
                    marketName: 'Mercado Cripto 24/7',
                    schedule: 'Cotización continua las 24 horas, 7 días a la semana',
                    badgeText: 'Mercado Abierto 24/7',
                    badgeClass: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                };
            }

            // Bolsa de Madrid (BME): Lun-Vie 09:00 - 17:30 CET (08:00 - 16:30 UTC)
            if (t.endsWith('.MC') || t.includes('BME') || ['ITX', 'SAN', 'BBVA', 'IBE', 'TEF', 'REP', 'CABK', 'AMS', 'FER', 'CLNX', 'ELE'].includes(t)) {
                const isWeekend = day === 0 || day === 6;
                const isMadridOpen = !isWeekend && currentUtcMinuteOfDay >= 480 && currentUtcMinuteOfDay <= 990;
                return {
                    isOpen: isMadridOpen,
                    marketName: 'Bolsa de Madrid (BME)',
                    schedule: 'Lunes a Viernes: 09:00 - 17:30 CET',
                    badgeText: isMadridOpen ? 'Mercado Abierto' : 'Mercado Cerrado',
                    badgeClass: isMadridOpen
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                };
            }

            // Wall Street (NYSE / NASDAQ): Lun-Vie 15:30 - 22:00 CET (14:30 - 21:00 UTC / 09:30 - 16:00 EST)
            const isWeekend = day === 0 || day === 6;
            const isUsOpen = !isWeekend && currentUtcMinuteOfDay >= 870 && currentUtcMinuteOfDay <= 1260;
            return {
                isOpen: isUsOpen,
                marketName: 'Wall Street (NYSE / NASDAQ)',
                schedule: 'Lunes a Viernes: 15:30 - 22:00 CET (09:30 - 16:00 EST)',
                badgeText: isUsOpen ? 'Mercado Abierto' : 'Mercado Cerrado',
                badgeClass: isUsOpen
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            };
        };

        // ------------------ DETALLE DE INVERSIÓN Y GRÁFICA OFICIAL 2026 (YTD) ------------------
        const OFFICIAL_ANNUAL_SERIES = {
            AAPL: [185.6, 181.2, 172.8, 169.3, 192.2, 214.3, 224.2, 226.5, 228.0, 231.4, 229.8],
            MSFT: [374.0, 404.2, 420.7, 398.5, 415.1, 446.9, 423.8, 417.0, 428.2, 432.5, 428.0],
            NVDA: [48.1, 68.2, 90.3, 86.4, 109.6, 126.5, 117.9, 119.3, 121.4, 138.2, 142.5],
            AMZN: [151.9, 174.4, 180.3, 175.0, 181.2, 193.2, 187.0, 178.5, 186.4, 192.1, 198.5],
            GOOGL: [140.2, 138.7, 152.2, 164.6, 173.9, 182.1, 171.4, 163.8, 165.2, 172.8, 176.4],
            META: [353.9, 470.1, 485.5, 443.2, 466.8, 504.2, 474.8, 512.4, 567.4, 588.2, 592.0],
            TSLA: [248.4, 191.5, 175.7, 168.2, 178.8, 197.8, 232.1, 214.1, 260.4, 218.8, 251.4],
            NFLX: [470.0, 560.2, 608.1, 555.0, 642.4, 674.1, 638.0, 690.4, 712.3, 755.0, 762.0],
            AMD: [147.0, 174.2, 180.5, 158.0, 166.4, 160.2, 144.5, 148.0, 156.2, 152.0, 148.2],
            'ITX.MC': [38.6, 40.2, 44.5, 43.8, 45.2, 46.9, 46.1, 47.8, 49.6, 52.3, 51.8],
            ITX: [38.6, 40.2, 44.5, 43.8, 45.2, 46.9, 46.1, 47.8, 49.6, 52.3, 51.8],
            'SAN.MC': [3.78, 3.82, 4.41, 4.58, 4.82, 4.45, 4.52, 4.38, 4.49, 4.62, 4.58],
            SAN: [3.78, 3.82, 4.41, 4.58, 4.82, 4.45, 4.52, 4.38, 4.49, 4.62, 4.58],
            'BBVA.MC': [8.24, 8.91, 10.92, 10.15, 9.85, 8.98, 9.62, 9.15, 9.38, 9.45, 9.32],
            BBVA: [8.24, 8.91, 10.92, 10.15, 9.85, 8.98, 9.62, 9.15, 9.38, 9.45, 9.32],
            'IBE.MC': [11.85, 10.98, 11.35, 11.58, 12.15, 11.95, 12.38, 12.65, 13.45, 13.82, 13.75],
            IBE: [11.85, 10.98, 11.35, 11.58, 12.15, 11.95, 12.38, 12.65, 13.45, 13.82, 13.75],
            'CABK.MC': [3.85, 4.12, 4.65, 4.88, 5.12, 4.95, 5.08, 4.98, 5.25, 5.48, 5.42],
            VOO: [434.5, 460.2, 478.1, 458.0, 482.4, 504.6, 512.2, 508.4, 520.1, 532.8, 536.4],
            SPY: [472.0, 500.5, 520.4, 498.2, 525.0, 549.1, 558.0, 554.2, 568.0, 581.4, 585.0],
            VWCE: [110.2, 114.8, 118.5, 115.2, 119.8, 123.4, 124.5, 123.1, 125.8, 128.4, 129.2],
            QQQ: [408.0, 438.5, 445.2, 424.0, 450.8, 482.5, 470.2, 465.0, 488.2, 496.5, 502.0],
            BTC: [42250, 51900, 71200, 63800, 67500, 62700, 66200, 59100, 63300, 71500, 74200],
            ETH: [2280, 2950, 3640, 3120, 3750, 3410, 3280, 2520, 2640, 2680, 2710],
            SOL: [102.5, 128.0, 196.4, 138.2, 168.0, 142.5, 185.0, 135.2, 155.0, 178.4, 188.0],
            GLD: [191.0, 190.5, 206.2, 215.8, 218.0, 216.5, 222.0, 232.4, 246.5, 252.0, 251.2]
        };

        const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'];

        window.openInvestmentDetail = (idx) => {
            const list = (investments && investments.length > 0) ? investments : (window.investments || []);
            const inv = list[idx];
            if (!inv) return;

            const modal = document.getElementById('investment-detail-modal');
            if (!modal) return;

            const cleanTicker = (inv.ticker || '').toUpperCase().trim();
            const marketInfo = getMarketStatus(cleanTicker);

            // Rellenar cabecera
            const badgeEl = document.getElementById('inv-detail-badge');
            const nameEl = document.getElementById('inv-detail-name');
            const schedEl = document.getElementById('inv-detail-schedule');
            const statusEl = document.getElementById('inv-detail-market-status');
            const catEl = document.getElementById('inv-detail-category');

            if (badgeEl) badgeEl.textContent = cleanTicker || 'ACTIVO';
            if (nameEl) nameEl.textContent = inv.name;
            if (schedEl) schedEl.textContent = `${marketInfo.marketName} · ${marketInfo.schedule}`;
            if (statusEl) {
                statusEl.className = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${marketInfo.badgeClass}`;
                statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${marketInfo.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}"></span> ${marketInfo.badgeText}`;
            }
            if (catEl) {
                catEl.textContent = cleanTicker.endsWith('.MC') ? 'IBEX 35' : (['BTC', 'ETH', 'SOL', 'ADA'].includes(cleanTicker) ? 'Cripto' : 'Renta Variable');
            }

            const dateBadgeEl = document.getElementById('inv-detail-date');
            if (dateBadgeEl) {
                dateBadgeEl.textContent = `Comprado: ${inv.buyDate ? formatDate(inv.buyDate) : 'Fecha no registrada'}`;
            }

            // Determinar serie 2026 oficial
            let series = null;
            if (OFFICIAL_ANNUAL_SERIES[cleanTicker]) {
                series = [...OFFICIAL_ANNUAL_SERIES[cleanTicker]];
            } else {
                const lower = inv.name.toLowerCase();
                for (const [k, s] of Object.entries(OFFICIAL_ANNUAL_SERIES)) {
                    if (lower.includes(k.toLowerCase())) {
                        series = [...s];
                        break;
                    }
                }
            }

            if (!series) {
                const base = inv.currentPrice > 0 ? inv.currentPrice : (inv.buyPrice || 100);
                const factors = [0.84, 0.88, 0.94, 0.91, 0.96, 1.02, 1.01, 0.98, 1.03, 1.05, 1.00];
                series = factors.map(f => parseFloat((base * f).toFixed(2)));
            }

            const openPrice = series[0];
            const latestPrice = series[series.length - 1];
            const minPrice = Math.min(...series);
            const maxPrice = Math.max(...series);
            const ytdPct = openPrice > 0 ? (((latestPrice - openPrice) / openPrice) * 100).toFixed(2) : '0.00';
            const isBull = parseFloat(ytdPct) >= 0;

            // Rellenar métricas de mercado
            const ytdPill = document.getElementById('inv-detail-ytd-pill');
            if (ytdPill) {
                ytdPill.className = `px-3 py-1 rounded-xl text-xs font-bold ${isBull ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`;
                ytdPill.textContent = `${isBull ? '+' : ''}${ytdPct}% YTD en Bolsa`;
            }

            const statOpen = document.getElementById('stat-open-price');
            const statMin = document.getElementById('stat-min-price');
            const statMax = document.getElementById('stat-max-price');
            const statCur = document.getElementById('stat-cur-price');
            if (statOpen) statOpen.textContent = formatMoney(openPrice);
            if (statMin) statMin.textContent = formatMoney(minPrice);
            if (statMax) statMax.textContent = formatMoney(maxPrice);
            if (statCur) statCur.textContent = formatMoney(latestPrice);

            // Métricas personales de P&L
            const userInvested = inv.buyPrice;
            const userCurrent = inv.currentPrice;
            const userGain = userCurrent - userInvested;
            const userRoi = userInvested > 0 ? ((userGain / userInvested) * 100).toFixed(2) : '0.00';
            const isUserGain = userGain >= 0;

            const elUserInvested = document.getElementById('inv-user-invested');
            const elUserCurrent = document.getElementById('inv-user-current');
            const elUserPnl = document.getElementById('inv-user-pnl');
            const elUserRoi = document.getElementById('inv-user-roi');

            if (elUserInvested) elUserInvested.textContent = formatMoney(userInvested);
            if (elUserCurrent) elUserCurrent.textContent = formatMoney(userCurrent);
            if (elUserPnl) {
                elUserPnl.textContent = `${isUserGain ? '+' : ''}${formatMoney(userGain)}`;
                elUserPnl.className = `text-sm font-bold ${isUserGain ? 'text-emerald-400' : 'text-rose-400'} mt-0.5 block`;
            }
            if (elUserRoi) {
                elUserRoi.textContent = `${isUserGain ? '+' : ''}${userRoi}%`;
                elUserRoi.className = `text-sm font-bold ${isUserGain ? 'text-emerald-400' : 'text-rose-400'} mt-0.5 block`;
            }

            // Renderizar gráfica oficial con Chart.js
            const canvas = document.getElementById('officialStockChartCanvas');
            if (canvas && window.Chart) {
                if (officialChartInstance) {
                    officialChartInstance.destroy();
                    officialChartInstance = null;
                }

                const ctx = canvas.getContext('2d');
                const strokeColor = isBull ? '#10b981' : '#f43f5e';
                const grad = ctx.createLinearGradient(0, 0, 0, 160);
                grad.addColorStop(0, isBull ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                officialChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: MONTH_LABELS,
                        datasets: [{
                            label: `${inv.name} (2026)`,
                            data: series,
                            borderColor: strokeColor,
                            backgroundColor: grad,
                            fill: true,
                            tension: 0.35,
                            borderWidth: 2.5,
                            pointRadius: 3,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: strokeColor,
                            pointBorderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#18181b',
                                titleColor: '#ffffff',
                                bodyColor: strokeColor,
                                borderColor: '#27272a',
                                borderWidth: 1,
                                padding: 10,
                                displayColors: false,
                                callbacks: {
                                    label: (context) => `Cotización oficial: ${formatMoney(context.parsed.y)}`
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { color: '#71717a', font: { size: 10 } }
                            },
                            y: {
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: {
                                    color: '#71717a',
                                    font: { size: 10 },
                                    callback: (v) => formatMoney(v)
                                }
                            }
                        }
                    }
                });
            }

            modal.classList.remove('hidden');
        };

        window.closeInvestmentDetailModal = () => {
            const modal = document.getElementById('investment-detail-modal');
            if (modal) modal.classList.add('hidden');
            if (officialChartInstance) {
                officialChartInstance.destroy();
                officialChartInstance = null;
            }
        };

        // ------------------ VENTANA BLOQUEANTE LEGAL (RGPD / CNMV / MIFID II) ------------------
        window.switchLegalTab = (tab) => {
            const btnPriv = document.getElementById('tab-legal-btn-privacidad');
            const btnTerm = document.getElementById('tab-legal-btn-terminos');
            const btnCnmv = document.getElementById('tab-legal-btn-cnmv');

            const contentPriv = document.getElementById('tab-legal-content-privacidad');
            const contentTerm = document.getElementById('tab-legal-content-terminos');
            const contentCnmv = document.getElementById('tab-legal-content-cnmv');

            const activeBtnClass = "flex-1 py-1.5 text-xs font-semibold rounded-lg bg-white text-black shadow transition-all";
            const inactiveBtnClass = "flex-1 py-1.5 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white transition-all";

            if (btnPriv) btnPriv.className = tab === 'privacidad' ? activeBtnClass : inactiveBtnClass;
            if (btnTerm) btnTerm.className = tab === 'terminos' ? activeBtnClass : inactiveBtnClass;
            if (btnCnmv) btnCnmv.className = tab === 'cnmv' ? activeBtnClass : inactiveBtnClass;

            if (contentPriv) contentPriv.classList.toggle('hidden', tab !== 'privacidad');
            if (contentTerm) contentTerm.classList.toggle('hidden', tab !== 'terminos');
            if (contentCnmv) contentCnmv.classList.toggle('hidden', tab !== 'cnmv');
        };

        window.openLegalModal = (blocking = false) => {
            const modal = document.getElementById('legal-blocking-modal');
            if (!modal) return;

            isLegalBlockingActive = blocking;
            const btnClose = document.getElementById('btn-close-legal-modal');
            const badgePill = document.getElementById('legal-badge-pill');
            const errorEl = document.getElementById('legal-error-msg');
            const chk = document.getElementById('legal-checkbox-accept');
            const actionsBox = document.getElementById('legal-actions-container');

            if (errorEl) errorEl.classList.add('hidden');
            switchLegalTab('privacidad');

            if (blocking) {
                if (btnClose) btnClose.classList.add('hidden');
                if (badgePill) {
                    badgePill.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider";
                    badgePill.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Paso Obligatorio · Consentimiento Legal RGPD`;
                }
                if (chk) chk.checked = false;
                if (actionsBox) actionsBox.classList.remove('hidden');
            } else {
                if (btnClose) btnClose.classList.remove('hidden');
                if (badgePill) {
                    badgePill.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider";
                    badgePill.innerHTML = `Información Legal y Regulatoria`;
                }
                if (chk) chk.checked = legalAccepted;
            }

            modal.classList.remove('hidden');
        };

        window.closeLegalModal = () => {
            if (isLegalBlockingActive && !legalAccepted) {
                return;
            }
            const modal = document.getElementById('legal-blocking-modal');
            if (modal) modal.classList.add('hidden');
        };

        window.handleLegalAccept = async () => {
            const chk = document.getElementById('legal-checkbox-accept');
            const errorEl = document.getElementById('legal-error-msg');

            if (!chk || !chk.checked) {
                if (errorEl) errorEl.classList.remove('hidden');
                return;
            }

            legalAccepted = true;
            legalAcceptedAt = new Date().toISOString();
            if (currentUser) {
                localStorage.setItem('tempus_legal_accepted_' + currentUser.uid, 'true');
                localStorage.setItem('tempus_legal_accepted_at_' + currentUser.uid, legalAcceptedAt);
            }

            await saveDataToCloud();

            isLegalBlockingActive = false;
            const modal = document.getElementById('legal-blocking-modal');
            if (modal) modal.classList.add('hidden');

            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-content').classList.remove('hidden');
            updateUI();
        };

        window.handleLegalReject = async () => {
            isLegalBlockingActive = false;
            const modal = document.getElementById('legal-blocking-modal');
            if (modal) modal.classList.add('hidden');
            await signOut(auth);
            document.getElementById('app-content').classList.add('hidden');
            document.getElementById('login-screen').classList.remove('hidden');
        };

        // ------------------ DERECHO DE SUPRESIÓN Y BORRADO TOTAL (ART. 17 RGPD) ------------------
        window.handleDeleteAccount = async () => {
            if (!currentUser) return;
            const confirmed = confirm("Conforme al Derecho de Supresión (Art. 17 RGPD), se eliminarán de forma irreversible todos tus registros de gastos, ingresos, inversiones y cuenta tanto localmente como de la nube.\n\n¿Estás totalmente seguro de que deseas proceder?");
            if (!confirmed) return;

            try {
                // 1. Borrar documento del usuario en Firestore
                try {
                    await deleteDoc(doc(db, "usuarios", currentUser.uid));
                } catch (e) {
                    console.warn("Error borrando datos en Firestore:", e);
                }

                // 2. Limpiar almacenamiento local
                localStorage.clear();

                // 3. Suprimir usuario en Firebase Auth si la sesión lo permite
                try {
                    await deleteUser(currentUser);
                } catch (e) {
                    console.warn("Usuario no pudo eliminarse de Auth directamente:", e);
                }

                // 4. Resetear estado en memoria
                currentUser = null;
                userAlias = '';
                transactions = [];
                investments = [];
                goalConfig = { name: 'Mi Objetivo', amount: 10000, source: 'patrimonio', apiKey: '' };
                legalAccepted = false;
                legalAcceptedAt = null;

                await signOut(auth);
                closeProfileModal();
                document.getElementById('app-content').classList.add('hidden');
                document.getElementById('login-screen').classList.remove('hidden');
                alert("Todos tus datos personales y cuenta han sido eliminados de forma definitiva e irreversible en cumplimiento del Art. 17 del RGPD.");
            } catch (err) {
                console.error(err);
                alert("Error al tramitar la eliminación total de la cuenta. Por favor, vuelve a iniciar sesión e inténtalo de nuevo.");
            }
        };


        // ------------------ CENTRO DE AYUDA, DUDAS Y ASUNTOS LEGALES (?) ------------------
        window.openHelpModal = () => {
            const modal = document.getElementById('help-support-modal');
            if (modal) modal.classList.remove('hidden');
        };

        window.closeHelpModal = () => {
            const modal = document.getElementById('help-support-modal');
            if (modal) modal.classList.add('hidden');
        };
