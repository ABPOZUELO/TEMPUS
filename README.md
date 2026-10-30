# Tempus by Abella ⏳📊

**Tempus** es una aplicación web de gestión patrimonial (*Wealth Management*) construida bajo una filosofía de arquitectura **Local-First & Zero-Knowledge**, diseñada para ofrecer un control financiero exhaustivo, privado, ágil y visual.

Desarrollada con un enfoque multidispositivo, la herramienta permite auditar el flujo de caja, monitorear la distribución de una cartera de inversiones en tiempo real y, a través de un motor analítico interno, calcular proyecciones matemáticas para la consecución de objetivos financieros.

---

## 🚀 Módulos y Funcionalidades

El sistema se estructura en cuatro módulos independientes y altamente reactivos:

### 1. Panel de Control (Dashboard Analítico)
Centro de mando que procesa el historial de transacciones y el estado de la cartera para extraer métricas financieras clave en tiempo real:
*   **Cálculo de Patrimonio Neto:** Suma dinámica de la liquidez disponible y el valor de mercado de los activos.
*   **Tasa de Ahorro y Flujo Neto:** Evaluación de la salud financiera mensual cruzando ingresos contra gastos consolidados.
*   **Visualización de Datos con Donut Charts:** Desglose interactivo de gastos por categorías y distribución visual de la cartera de inversiones (acciones, ETFs y liquidez).
*   **Evolución Temporal:** Proyección y seguimiento continuo de ingresos y gastos mensualizados.

### 2. Motor de Flujo de Caja (Cash Flow)
Libro mayor (*ledger*) ágil para el registro y auditoría de movimientos de capital:
*   **Filtros de Búsqueda Multicriterio:** Localización instantánea de registros por rango de fechas, categorías, tipo (ingreso/gasto) y buscador de texto por concepto.
*   **Importador Inteligente de Extractos en PDF:** Motor de extracción en cliente mediante `pdf.js` que procesa extractos bancarios e incorpora un **algoritmo de detección de duplicados** para prevenir dobles registros.
*   **Categorización Financiera:** Organización sistemática de ingresos y gastos para auditar el coste de vida.

### 3. Planificador de Estrategia y Objetivos
Simulador algorítmico que cruza la meta financiera del usuario con su balance patrimonial:
*   **Proyección Temporal:** Estima los meses necesarios para alcanzar un objetivo según el flujo de caja neto mensual.
*   **Optimización de Gasto:** Identifica el centro de coste más elevado y proyecta el impacto de aplicar reducciones marginales.
*   **Análisis de Coste de Oportunidad:** Monitoriza el colchón de seguridad frente a gastos recurrentes y genera recomendaciones para combatir la inflación asignando excesos de liquidez hacia activos de inversión.

### 4. Gestión de Cartera de Inversión
Módulo de *tracking* de activos (Acciones, ETFs, Fondos Indexados, Criptoactivos):
*   **Sincronización de Mercado:** Conexión con datos de cotización bursátil para calcular retornos y plusvalías latentes.
*   **Cálculo de ROI:** Monitorización del Retorno de Inversión individual por posición y consolidado a nivel de cartera.

---

## 🔒 Privacidad por Diseño (Zero-Knowledge)

A diferencia de las aplicaciones bancarias tradicionales o servicios centralizados:
*   **Tus datos nunca salen de tu dispositivo:** Los registros numéricos, extractos y anotaciones financieras se almacenan exclusivamente en el almacenamiento local seguro (`LocalStorage`) de tu navegador web.
*   **Cero Riesgo de Filtración Centralizada:** No existe un servidor central recopilando información personal ni acceso a datos bancarios mediante *scrapping*.
*   **Privacidad Total:** Quien prueba o utiliza la aplicación opera en un entorno hermético y aislado, con la posibilidad de reiniciar sus datos o exportar copias de seguridad en formato `.json` en cualquier instante.

---

## 🛠️ Stack Tecnológico

*   **Frontend Core:** HTML5 semántico, JavaScript moderno (ES6+), `Chart.js`, `jspdf`, `jspdf-autotable` y `pdf.js`.
*   **UI/UX:** Tailwind CSS con estética Apple Dark Mode Glassmorphism (`backdrop-filter: blur`, tarjetas translúcidas, tipografía Helvetica Neue).
*   **Persistencia:** Arquitectura *Local-First* orientada a cliente.

---

## 📱 Acceso y Despliegue

La aplicación se encuentra desplegada como **Progressive Web App (PWA)** a través de **GitHub Pages**:
1. Accede desde tu navegador web habitual (Safari en iOS o Chrome en Android / Desktop).
2. En dispositivos móviles, puedes pulsar en **"Añadir a la pantalla de inicio"** para usarla como una aplicación nativa a pantalla completa.

---
*Diseñado y desarrollado por Jorge Abella Pozuelo.*
