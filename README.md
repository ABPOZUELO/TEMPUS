# Tempus by Abella ⏳📊

**Tempus** es una aplicación web de gestión patrimonial (*Wealth Management*) de arquitectura *Local-First*, diseñada para ofrecer un control financiero exhaustivo, privado y multiplataforma. 

Desarrollada bajo un enfoque *mobile-first*, la herramienta permite registrar el flujo de caja, monitorear la distribución de una cartera de inversiones en tiempo real y, a través de un motor analítico interno, calcular proyecciones matemáticas para la consecución de objetivos financieros.

## 🚀 Lógica de Negocio y Funcionalidades

El sistema se estructura en cuatro módulos independientes que se retroalimentan entre sí:

### 1. Panel de Control (Dashboard Analítico)
Centro de mando que procesa el historial de transacciones y el estado de la cartera para extraer KPIs financieros en tiempo real:
*   **Cálculo de Patrimonio Neto:** Suma dinámica de la liquidez disponible y el valor de mercado de los activos.
*   **Tasa de Ahorro y Flujo Neto:** Evaluación de la salud financiera mensual cruzando ingresos contra gastos consolidados.
*   **Visualización de Datos:** Integración con *Chart.js* para renderizar la distribución del gasto por categorías (Doughnut Chart) y proyectar la evolución temporal de ingresos y gastos mensualizados (Line Chart).

### 2. Motor de Flujo de Caja (Cash Flow)
Libro mayor (*ledger*) para el registro de movimientos de capital.
*   Sistema de categorización para auditar el coste de vida.
*   Impacto automático de cada transacción sobre el cálculo de la liquidez global del usuario.

### 3. Planificador de Estrategia y Objetivos
Un simulador algorítmico que cruza la meta financiera del usuario con su realidad patrimonial para generar recomendaciones accionables:
*   **Proyección Temporal:** Calcula los meses exactos necesarios para alcanzar un objetivo dividiendo el capital restante entre el flujo de caja neto mensual.
*   **Optimización de Gasto:** Identifica el "centro de coste" más alto del usuario y proyecta matemáticamente el impacto de aplicar una reducción marginal (15%) sobre el tiempo de consecución del objetivo.
*   **Análisis de Coste de Oportunidad:** Monitoriza el ratio de liquidez frente a los gastos recurrentes. Si el sistema detecta un exceso de capital inmovilizado (superando los 3 meses de colchón de seguridad), emite alertas para reasignar ese capital hacia la cartera de inversión y combatir la inflación.

### 4. Gestión de Cartera de Inversión
Módulo de *tracking* de activos (Acciones, ETFs, Fondos Indexados, Materias Primas).
*   **Sincronización API Real-Time:** Integración con la API REST de **Alpha Vantage** para obtener el precio de cotización en vivo (*Global Quote*) mediante *tickers* de mercado.
*   Cálculo automático del Retorno de Inversión (ROI) tanto a nivel de posición individual como de cartera consolidada.

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está diseñado para funcionar íntegramente en el lado del cliente (Client-Side), garantizando un **entorno Zero-Knowledge** donde el servidor no tiene acceso a la información del usuario.

*   **Frontend Core:** HTML5 semántico y Vanilla JavaScript (ES6+). La ausencia de *frameworks* pesados garantiza tiempos de carga casi instantáneos.
*   **UI/UX:** Tailwind CSS (v4) configurado mediante variables CSS para soportar *Dark Mode* de forma nativa. Interfaz inspirada en el ecosistema Apple (componentes encapsulados, *glassmorphism* mediante `backdrop-filter`).
*   **Persistencia de Datos (Local-First):** Uso intensivo de la API `LocalStorage` del navegador. Los datos se estructuran y almacenan en arrays JSON.
*   **Portabilidad:** Sistema de backup integrado que serializa el estado completo de la base de datos local y permite al usuario exportar e importar su información financiera en formato `.json`.

## 🔒 Privacidad y Seguridad

A diferencia de las aplicaciones financieras tradicionales, Tempus no requiere creación de cuentas ni sincronización bancaria mediante *scrapping*. 
*   **Garantía de Privacidad:** Todos los registros numéricos y anotaciones personales permanecen enclavados en el almacenamiento del dispositivo físico del usuario. 
*   Las únicas llamadas externas se realizan desde el cliente hacia la API de Alpha Vantage, transmitiendo exclusivamente los *tickers* públicos de los activos, sin vincularlos a cantidades invertidas ni a identidades.

## 📱 Despliegue y Uso como PWA

La aplicación está desplegada en producción a través de **GitHub Pages**. Gracias a su diseño web responsivo, puede instalarse en cualquier dispositivo móvil eludiendo las tiendas de aplicaciones tradicionales:

1. Acceder a la URL de producción mediante **Safari** (iOS) o **Chrome** (Android).
2. Desplegar las opciones del navegador y seleccionar **"Añadir a la pantalla de inicio"**.
3. La aplicación funcionará a pantalla completa como una *Progressive Web App (PWA)* independiente.

---
*Diseñado, programado y desplegado por Jorge Abella Pozuelo.*