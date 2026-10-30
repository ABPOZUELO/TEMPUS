# Tempus ⏳📊

**Tempus** es una aplicación web que he desarrollado para gestionar finanzas personales, gastos e inversiones de forma visual, rápida y con privacidad total.

La razón por la que comencé a crear esta aplicación es porque tenía mis finanzas completamente dispersas: por un lado la nómina, por otro los gastos del día a día en el banco, las inversiones en otra plataforma, los ahorros por otro lado... Quería una herramienta que unificara todo en un único sitio, para tener una visión clara de mi patrimonio sin complicaciones y sin tener que conectar mis cuentas bancarias ni exponer mi información personal.

---

## 💡 ¿Cómo funciona?

Todo funciona directamente en el navegador utilizando `localStorage`. Esto significa que **ningún dato personal se envía a ningún servidor ni se almacena en bases de datos externas**. La información se queda únicamente en tu propio dispositivo.

---

## ✨ Qué puedes hacer con Tempus

- **Panel de Control:** Ves tu patrimonio neto total (liquidez disponible + valor actual de tus inversiones), tu tasa de ahorro mensual y gráficos circulares para ver claramente en qué categorías se concentra tu gasto.
- **Flujo de Caja (Ingresos y Gastos):**
  - Registro de transacciones organizado por categorías.
  - **Importador de extractos bancarios en PDF:** arrastras el documento y la aplicación extrae los movimientos automáticamente en el navegador. Incluye un filtro para detectar movimientos duplicados y evitar que se registren dos veces.
  - **Filtros de búsqueda:** puedes consultar tus movimientos por rango de fechas, por categoría o buscando por nombre/concepto.
- **Cartera de Inversión:** Seguimiento de activos (acciones, fondos indexados, ETFs). Muestra el capital invertido, el valor actual, las ganancias acumuladas y el cálculo del retorno de inversión (ROI).
- **Objetivos de Ahorro:** Te permite fijar una meta financiera y estima los meses necesarios para alcanzarla según tu ritmo mensual de ahorro.
- **Exportación y Respaldo:** Puedes descargar copias de seguridad de tus datos en formato `.json` o exportar informes en PDF.

---

## 🛠️ Tecnologías utilizadas

- **HTML5 y JavaScript (ES6+):** Código ligero en el cliente para que cargue de forma instantánea.
- **Tailwind CSS:** Diseño en modo oscuro inspirado en el estilo visual de Apple (tarjetas con desenfoque *glassmorphism*).
- **Chart.js:** Gráficas interactivas de distribución de gastos y evolución mensual.
- **PDF.js:** Procesamiento y lectura de archivos PDF en local dentro del navegador.

---

## 🚀 Cómo probarla

Puedes verla y probarla directamente en tu navegador:
1. Accede a través de **GitHub Pages**: [https://abpozuelo.github.io/TEMPUS/](https://abpozuelo.github.io/TEMPUS/) (o descargando el repositorio y abriendo el archivo `index.html`).
2. Puedes introducir datos de prueba o cargar un extracto bancario en PDF.
3. Si quieres borrar todas las pruebas locales y dejar la aplicación limpia, solo tienes que pulsar en **"Reiniciar Demo"** en la barra superior.

---

Desarrollado por **Jorge Abella Pozuelo**.
