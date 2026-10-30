        // ------------------ ESTADO Y AUTENTICACIÓN LOCAL (ZERO-KNOWLEDGE) ------------------
        let currentUser = null;
        let userAlias = '';
        let transactions = [];
        let investments = [];
        let goalConfig = { name: 'Mi Objetivo', amount: 10000, source: 'patrimonio', apiKey: '' };
        let isLoginMode = true;

        let gastosChartInstance = null, carteraChartInstance = null, timelineChartInstance = null;
        const chartColors = ['#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];
        let currentCalendarDate = new Date();

        function updateAliasDisplay() {
            const display = userAlias || (currentUser ? currentUser.alias || currentUser.email.split('@')[0] : 'Usuario');
            const greeting = document.getElementById('user-alias-greeting');
            if (greeting) greeting.textContent = display;
            const nav = document.getElementById('user-email-display');
            if (nav) nav.textContent = display;
        }

        // Base de datos local particionada por usuario
        function getUsersDb() {
            try {
                return JSON.parse(localStorage.getItem('tempus_users_db') || '{}');
            } catch (e) {
                return {};
            }
        }

        function saveUsersDb(db) {
            localStorage.setItem('tempus_users_db', JSON.stringify(db));
        }

        function loadCurrentUserData() {
            if (!currentUser) return;
            const db = getUsersDb();
            const userData = db[currentUser.email] || {};
            userAlias = userData.alias || currentUser.alias || currentUser.email.split('@')[0];
            transactions = userData.transacciones || [];
            investments = userData.inversiones || [];
            goalConfig = userData.configuracion || { name: 'Mi Objetivo', amount: 10000, source: 'patrimonio', apiKey: '' };

            updateAliasDisplay();

            if (document.getElementById('goal-name')) document.getElementById('goal-name').value = goalConfig.name || '';
            if (document.getElementById('goal-amount')) document.getElementById('goal-amount').value = goalConfig.amount || '';
            if (document.getElementById('goal-source')) document.getElementById('goal-source').value = goalConfig.source || 'patrimonio';
            if (document.getElementById('user-api-key')) document.getElementById('user-api-key').value = goalConfig.apiKey || '';
            if (document.getElementById('tx-start-date')) {
                document.getElementById('tx-start-date').value = new Date().toISOString().split('T')[0];
            }
            updateUI();
        }

        function saveDataToCloud() {
            if (!currentUser) return;
            const db = getUsersDb();
            if (!db[currentUser.email]) {
                db[currentUser.email] = { password: '', alias: userAlias };
            }
            db[currentUser.email].alias = userAlias;
            db[currentUser.email].transacciones = transactions;
            db[currentUser.email].inversiones = investments;
            db[currentUser.email].configuracion = goalConfig;
            saveUsersDb(db);
        }

        window.saveGoalConfig = () => {
            if (!currentUser) return;
            goalConfig.name = document.getElementById('goal-name').value || 'Mi Objetivo';
            goalConfig.amount = parseFloat(document.getElementById('goal-amount').value) || 0;
            goalConfig.source = document.getElementById('goal-source').value;
            updateUI();
            saveDataToCloud();
        };

        window.handleLogout = () => {
            if (confirm("¿Quieres cerrar sesión?")) {
                localStorage.removeItem('tempus_auth_user');
                location.reload();
            }
        };

        function setupAuthEvents() {
            const toggleBtn = document.getElementById('auth-toggle-btn');
            const authForm = document.getElementById('auth-form');
            const title = document.getElementById('auth-title');
            const subtitle = document.getElementById('auth-subtitle');
            const submitBtn = document.getElementById('auth-submit-btn');
            const aliasGroup = document.getElementById('auth-alias-group');

            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    isLoginMode = !isLoginMode;
                    if (isLoginMode) {
                        if (title) title.innerText = "Iniciar Sesión";
                        if (subtitle) subtitle.innerText = "Accede a tu portfolio personal";
                        if (submitBtn) {
                            submitBtn.innerText = "Entrar";
                            submitBtn.className = "apple-button w-full bg-white text-black font-bold py-3.5 rounded-xl mt-2";
                        }
                        if (toggleBtn) toggleBtn.innerText = "¿No tienes cuenta? Regístrate aquí";
                        if (aliasGroup) aliasGroup.classList.add('hidden');
                    } else {
                        if (title) title.innerText = "Crear Cuenta";
                        if (subtitle) subtitle.innerText = "Regístrate para gestionar tu patrimonio";
                        if (submitBtn) {
                            submitBtn.innerText = "Registrarse";
                            submitBtn.className = "apple-button w-full bg-zinc-800 text-white font-bold py-3.5 rounded-xl mt-2 border border-zinc-700 hover:bg-zinc-700";
                        }
                        if (toggleBtn) toggleBtn.innerText = "¿Ya tienes cuenta? Inicia sesión";
                        if (aliasGroup) aliasGroup.classList.remove('hidden');
                    }
                });
            }

            if (authForm) {
                authForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const emailInput = document.getElementById('login-email');
                    const passInput = document.getElementById('login-password');
                    const aliasInput = document.getElementById('register-alias');

                    const email = (emailInput?.value || '').trim().toLowerCase();
                    const pass = passInput?.value || '';
                    const alias = (aliasInput?.value || '').trim();

                    if (!email || !pass) {
                        alert("Por favor, introduce correo y contraseña.");
                        return;
                    }

                    const db = getUsersDb();

                    if (isLoginMode) {
                        const user = db[email];
                        if (!user || user.password !== pass) {
                            alert("Credenciales incorrectas o usuario no registrado. Si eres nuevo, pulsa en '¿No tienes cuenta? Regístrate aquí'.");
                            return;
                        }
                        currentUser = { email, alias: user.alias || email.split('@')[0] };
                        localStorage.setItem('tempus_auth_user', JSON.stringify(currentUser));
                        document.getElementById('login-screen')?.classList.add('hidden');
                        document.getElementById('app-content')?.classList.remove('hidden');
                        loadCurrentUserData();
                    } else {
                        if (pass.length < 6) {
                            alert("La contraseña debe tener al menos 6 caracteres.");
                            return;
                        }
                        if (db[email]) {
                            alert("Este correo electrónico ya está registrado en este navegador. Inicia sesión con él.");
                            return;
                        }
                        const finalAlias = alias || email.split('@')[0];
                        db[email] = {
                            password: pass,
                            alias: finalAlias,
                            transacciones: [],
                            inversiones: [],
                            configuracion: { name: 'Mi Objetivo', amount: 10000, source: 'patrimonio', apiKey: '' }
                        };
                        saveUsersDb(db);
                        currentUser = { email, alias: finalAlias };
                        localStorage.setItem('tempus_auth_user', JSON.stringify(currentUser));
                        document.getElementById('login-screen')?.classList.add('hidden');
                        document.getElementById('app-content')?.classList.remove('hidden');
                        loadCurrentUserData();
                        alert("¡Cuenta creada con éxito! Bienvenido a Tempus.");
                    }
                });
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            setupAuthEvents();
            let savedAuth = null;
            try {
                savedAuth = JSON.parse(localStorage.getItem('tempus_auth_user') || 'null');
            } catch (e) {
                savedAuth = null;
            }

            if (savedAuth && savedAuth.email) {
                const db = getUsersDb();
                if (db[savedAuth.email]) {
                    currentUser = savedAuth;
                    document.getElementById('login-screen')?.classList.add('hidden');
                    document.getElementById('app-content')?.classList.remove('hidden');
                    loadCurrentUserData();
                    return;
                }
            }

            // Si no hay sesión válida, mostrar login obligatoriamente
            currentUser = null;
            document.getElementById('login-screen')?.classList.remove('hidden');
            document.getElementById('app-content')?.classList.add('hidden');
        });

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
            renderCalendar();
            updateGoalProgress(pat, liq, gas, ing);
        }

        window.renderTables = function() {
            const txBody = document.getElementById('transactions-table-body');
            const txSearch = (document.getElementById('tx-search-input')?.value || '').toLowerCase().trim();
            const txType = document.getElementById('tx-filter-type')?.value || 'todos';
            const txCat = document.getElementById('tx-filter-cat')?.value || 'todas';

            if(txBody) {
                txBody.innerHTML = '';
                const reversedTx = [...transactions].reverse();
                const filteredTx = reversedTx.filter(t => {
                    const matchSearch = !txSearch || 
                        (t.desc && t.desc.toLowerCase().includes(txSearch)) || 
                        (t.category && t.category.toLowerCase().includes(txSearch));
                    const matchType = txType === 'todos' || t.type === txType;
                    const matchCat = txCat === 'todas' || t.category === txCat;
                    return matchSearch && matchType && matchCat;
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
                    return matchSearch && matchRoi;
                });

                const invBadge = document.getElementById('inv-count-badge');
                if (invBadge) invBadge.innerText = `${filteredInv.length}`;

                if (filteredInv.length === 0) {
                    invBody.innerHTML = '';
                } else {
                    filteredInv.forEach((i) => {
                        let originalIdx = investments.indexOf(i);
                        let p = ((i.currentPrice - i.buyPrice)/i.buyPrice)*100;
                        invBody.innerHTML += `
                        <tr class="hover:bg-zinc-900/50">
                            <td class="py-3 text-white">${i.name}</td>
                            <td class="text-zinc-400 font-mono text-xs">${i.ticker || '-'}</td>
                            <td class="text-right text-zinc-400">${formatMoney(i.buyPrice)}</td>
                            <td class="text-right font-bold text-white">${formatMoney(i.currentPrice)}</td>
                            <td class="text-right ${p>=0?'text-emerald-400':'text-rose-400'}">${p.toFixed(2)}%</td>
                            <td class="text-right"><button onclick="deleteInvestment(${originalIdx})" class="text-zinc-500 hover:text-rose-400 font-bold" title="Eliminar">✕</button></td>
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
                if (carteraMenu) {
                    carteraMenu.innerHTML = '';
                    investments.forEach((i, idx) => {
                        let pct = invCur > 0 ? ((i.currentPrice / invCur) * 100).toFixed(1) : 0;
                        let color = chartColors[idx % chartColors.length];
                        carteraMenu.innerHTML += `<div class="flex items-center justify-between gap-3"><div class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></span><span class="text-zinc-300 font-medium truncate max-w-[90px]">${i.name}</span></div><span class="text-white font-bold">${pct}%</span></div>`;
                    });
                }
                carteraChartInstance = new Chart(canvasCartera.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: investments.map(i=>i.name), datasets: [{ data: investments.map(i=>i.currentPrice), backgroundColor: chartColors, borderColor: 'rgba(24, 24, 28, 1)', borderWidth: 3 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display:false }, tooltip: { callbacks: { label: function(c) { let v = c.parsed; let t = c.dataset.data.reduce((a,b)=>a+b,0); let p = t>0?((v/t)*100).toFixed(1):0; return ` ${formatMoney(v)} (${p}%)`; }}}}, cutout: '75%' }
                });
            }

            if(canvasGastos && gastosChartInstance) gastosChartInstance.destroy();
            if(canvasGastos) {
                const gastosMap = {};
                // Solo lee transacciones guardadas explícitamente como "gasto"
                transactions.filter(t => t.type === 'gasto').forEach(t => { gastosMap[t.category] = (gastosMap[t.category] || 0) + t.amount; });
                const gastoKeys = Object.keys(gastosMap);
                const gastoValues = Object.values(gastosMap);

                const gastosMenu = document.getElementById('gastos-legend-menu');
                if (gastosMenu) {
                    gastosMenu.innerHTML = '';
                    let totalGastos = gastoValues.reduce((a, b) => a + b, 0);
                    gastoKeys.forEach((key, idx) => {
                        let val = gastoValues[idx];
                        let pct = totalGastos > 0 ? ((val / totalGastos) * 100).toFixed(1) : 0;
                        let color = chartColors[idx % chartColors.length];
                        gastosMenu.innerHTML += `<div class="flex items-center justify-between gap-3"><div class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></span><span class="text-zinc-300 font-medium truncate max-w-[90px]">${key}</span></div><span class="text-white font-bold">${pct}%</span></div>`;
                    });
                }

                gastosChartInstance = new Chart(canvasGastos.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: gastoKeys.length > 0 ? gastoKeys : ['Sin gastos'], datasets: [{ data: gastoKeys.length > 0 ? gastoValues : [1], backgroundColor: chartColors.slice(0, gastoKeys.length > 0 ? gastoKeys.length : 1), borderColor: 'rgba(24, 24, 28, 1)', borderWidth: 3 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display:false }, tooltip: { callbacks: { label: function(c) { let v = c.parsed; let t = c.dataset.data.reduce((a,b)=>a+b,0); let p = t>0?((v/t)*100).toFixed(1):0; return ` ${formatMoney(v)} (${p}%)`; }}}}, cutout: '75%' }
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

        function renderCalendar() {
            const grid = document.getElementById('calendar-grid');
            const monthYearText = document.getElementById('calendar-month-year');
            if(!grid || !monthYearText) return;

            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();
            const monthNames = ["Enero", "Feb", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            monthYearText.innerText = `${monthNames[month]} ${year}`;

            const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
            const totalDays = new Date(year, month + 1, 0).getDate();

            grid.innerHTML = '';
            for (let i = 0; i < firstDayIndex; i++) { grid.innerHTML += `<div></div>`; }

            const today = new Date();
            for (let day = 1; day <= totalDays; day++) {
                let isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                grid.innerHTML += `<div class="h-8 flex items-center justify-center rounded-xl font-medium transition-all ${isToday ? 'bg-white text-black font-bold shadow-lg' : 'text-zinc-300 hover:bg-zinc-800'}">${day}</div>`;
            }
        }

        window.changeMonth = (direction) => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
            renderCalendar();
        };

        function updateGoalProgress(pat, liq, gas, ing) {
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
            investments.push({
                name: document.getElementById('inv-name').value,
                ticker: document.getElementById('inv-ticker').value,
                buyPrice: parseFloat(document.getElementById('inv-buy').value),
                currentPrice: parseFloat(document.getElementById('inv-current').value)
            });
            e.target.reset();
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

            if(!fullDateVal) { alert('Selecciona una fecha en el calendario.'); return; }

            // Extraer el mes (YYYY-MM) de la fecha seleccionada para filtrar los gastos
            const monthVal = fullDateVal.substring(0, 7);
            const filteredTx = transactions.filter(t => t.startDate && t.startDate.startsWith(monthVal));

            if(filteredTx.length === 0) { alert('No hay movimientos registrados en este mes.'); return; }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text(`Informe Financiero Tempus`, 14, 20);

            const [year, month] = monthVal.split('-');
            const dateObj = new Date(year, month - 1);
            let mesNombre = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            mesNombre = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Mes reportado: ${mesNombre}`, 14, 28);
            doc.text(`Usuario: ${currentUser ? currentUser.email : ''}`, 14, 34);

            const tableData = filteredTx.reverse().map(t => [
                formatDate(t.startDate), t.desc, t.category, t.type === 'ingreso' ? 'Ingreso' : 'Gasto', formatMoney(t.amount)
            ]);

            doc.autoTable({
                startY: 42, head: [['Fecha', 'Concepto', 'Categoría', 'Tipo', 'Importe']], body: tableData,
                theme: 'striped', headStyles: { fillColor: [20, 20, 20] }, styles: { font: 'helvetica', fontSize: 10 }
            });

            doc.save(`Tempus_Informe_${monthVal}.pdf`);
        };

        window.syncMarketData = async (event) => {
            if (!goalConfig.apiKey || goalConfig.apiKey.trim() === '') {
                document.getElementById('api-key-modal').classList.remove('hidden');
                return;
            }
            const btn = event.currentTarget;
            const originalText = btn.innerHTML;
            btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> <span class="hidden sm:inline">Sincronizando...</span>`;
            let updatedCount = 0;
            try {
                for (let inv of investments) {
                    if (inv.ticker && inv.ticker.length <= 6) {
                        const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${inv.ticker}&apikey=${goalConfig.apiKey}`);
                        const data = await res.json();
                        if (data['Global Quote'] && data['Global Quote']['05. price']) {
                            inv.currentPrice = parseFloat(data['Global Quote']['05. price']);
                            updatedCount++;
                        }
                        await new Promise(r => setTimeout(r, 1800));
                    }
                }
                updateUI();
                await saveDataToCloud();
                alert(updatedCount > 0 ? `Actualizados ${updatedCount} activos.` : "Límite diario de API alcanzado o tickers sin cotización.");
            } catch (e) { alert("Error conectando con el mercado."); } finally { btn.innerHTML = originalText; }
        };

        window.saveAndSyncApi = async () => {
            goalConfig.apiKey = document.getElementById('user-api-key').value.trim();
            await saveDataToCloud();
            document.getElementById('api-key-modal').classList.add('hidden');
            await syncMarketData({ currentTarget: document.getElementById('sync-market-button') });
        };

        // ------------------ GESTIÓN DE PERFIL DE USUARIO ------------------
        // ------------------ GESTIÓN DE PERFIL LOCAL (ZERO-KNOWLEDGE) ------------------
        window.openProfileModal = () => {
            const currentEmailEl = document.getElementById('profile-current-email');
            if (currentEmailEl) currentEmailEl.textContent = `${userAlias || 'Usuario'} • ${currentUser ? currentUser.email : 'Sesión Local'}`;
            const aliasInput = document.getElementById('profile-new-alias');
            if (aliasInput) aliasInput.value = userAlias || '';
            const msgEl = document.getElementById('profile-msg');
            if (msgEl) { msgEl.classList.add('hidden'); msgEl.textContent = ''; }
            document.getElementById('profile-modal').classList.remove('hidden');
        };

        window.closeProfileModal = () => {
            const modal = document.getElementById('profile-modal');
            if (modal) modal.classList.add('hidden');
        };

        window.handleProfileAliasSubmit = (e) => {
            e.preventDefault();
            const newAlias = document.getElementById('profile-new-alias').value.trim();
            if (!newAlias) {
                showProfileMessage('El alias no puede estar vacío.');
                return;
            }
            userAlias = newAlias;
            saveDataToCloud();
            updateAliasDisplay();
            const currentEmailEl = document.getElementById('profile-current-email');
            if (currentEmailEl) currentEmailEl.textContent = `${userAlias} • ${currentUser ? currentUser.email : 'Sesión Local'}`;
            showProfileMessage('Alias actualizado con éxito.', true);
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
