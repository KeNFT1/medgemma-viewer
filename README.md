# Lulo's NOT a Health Copilot

<p align="center">
  <img src="logo.png" alt="Lulo's NOT a Health Copilot" width="200">
</p>

<p align="center"><em>Don't take medical advice from a monkey.</em></p>

A fully local medical image analysis application powered by [MedGemma 1.5](https://huggingface.co/google/medgemma-4b-it) and [Ollama](https://ollama.com). Upload X-rays, CT scans, MRI slices, or clinical photos and get AI-powered analysis through a conversational chat interface — all running on your machine with no data leaving your computer.

---

> **WARNING — NOT A MEDICAL DEVICE**
>
> This software is **NOT** a medical device, is **NOT** FDA-cleared or approved, and is **NOT** intended to diagnose, treat, cure, or prevent any disease or medical condition. It has not been validated for clinical use and must **NEVER** be used as a substitute for professional medical judgment.
>
> **Do not** make any medical decisions based on the output of this software. The AI model may produce inaccurate, incomplete, misleading, or entirely fabricated results. All outputs are for **research and educational purposes only**.
>
> **Always consult a qualified healthcare professional** for any medical questions, concerns, or decisions regarding diagnosis, treatment, or care. If you are experiencing a medical emergency, call your local emergency number immediately.
>
> The developers, contributors, and maintainers of this project accept **no liability** whatsoever for any harm, injury, loss, or damage — direct or indirect — arising from the use or misuse of this software or its outputs. By using this software, you acknowledge and agree that you do so **entirely at your own risk**.

---

## What It Does

- **Analyze medical images** — Upload an X-ray, CT slice, MRI, dermatology photo, or any medical image and get a structured analysis describing findings, observations, and differential assessments
- **DICOM support** — Load `.dcm` files or entire DICOM folders directly. The app applies 3-channel MedGemma windowing (bone/lung, soft tissue, brain) to convert raw Hounsfield units into optimized RGB images for the model
- **Multi-slice series** — Upload a full CT or MRI series and browse slices in a thumbnail gallery. Auto-select representative slices or manually pick which ones to send for analysis
- **Clinical notes context** — Upload after-visit summaries, lab results, or clinical notes (PDF or text) to give the model additional context when answering questions
- **Conversational chat** — Ask follow-up questions about the image, request focus on specific regions, or discuss findings in a streaming chat interface with full conversation history
- **Bilingual Support** — Instantly toggle the entire interface and AI prompts between English and Spanish
- **Window Controls** — Draggable and resizable frameless window on macOS for better usability
- **Completely local** — Everything runs on your hardware via Ollama. No cloud APIs, no data uploads, no internet required after initial setup

---
## Installation (For Users)

**The easy way.** No coding required.

1.  **Download the App**
    Go to the [Releases page](https://github.com/KeNFT1/medgemma-viewer/releases) and download the latest installer for your system:
    -   **macOS:** `Lulos-Health-Copilot-mac-arm64.dmg` (for M1/M2/M3 chips)
    -   **Windows:** `Lulos-Health-Copilot-Setup.exe`

2.  **Install & Run**
    -   **macOS:** Open the `.dmg` and drag the app to your Applications folder.
        -   *Note:* If you see "App is damaged" or "Unidentified Developer", you may need to right-click the app and select **Open**, or go to System Settings > Privacy & Security to allow it.
    -   **Windows:** Run the `.exe` installer.

3.  **First Launch (Important!)**
    -   When you first open the app, it will automatically download the **MedGemma AI model** (~5 GB).
    -   **Please be patient.** Does not close the app. You will see progress in the status bar.
    -   Once finished, you can start analyzing images immediately!

---

## Installation (For Developers)

If you want to modify the code or build it yourself:

### Prerequisites

- **[Ollama](https://ollama.com/download)** installed and available in your PATH
- ~5 GB disk space for the MedGemma model
- A machine with at least 8 GB RAM (16 GB recommended)
- **Node.js** and **npm**

### Option 1: Browser (Quickest)

```bash
# Clone the repo
git clone https://github.com/KeNFT1/medgemma-viewer.git
cd medgemma-viewer

# Run the launcher (handles Ollama, model download, and web server)
chmod +x launch.sh
./launch.sh
```
The launcher will:
1. Start Ollama with CORS enabled
2. Pull the MedGemma model if not already installed
3. Start a local web server on port 8090
4. Open your browser to `http://localhost:8090`

### Option 2: Electron Desktop App

```bash
cd electron-app
npm install
npm start        # Run in development mode
```

To build a standalone `.app` / `.exe`:
-   **Windows:** `npm run build:win`
-   **macOS (ARM64):** `npm run build:mac:arm64`
-   **macOS (x64):** `npm run build:mac:x64`
-   **Linux:** `npm run build:linux`

The built app is in `electron-app/dist/`.

### Manual Model Setup

If you prefer to set up the model yourself:
```bash
# Pull the model from HuggingFace
ollama pull hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0

# Create a shorter alias
ollama cp hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0 medgemma-vision
```

---

## How It Was Built

This project was built entirely through a conversational coding session with **Claude** (Anthropic's AI assistant) and **Gemini** (Google's AI model) using **Claude Code** and **Antigravity**. The full development process — from initial concept to working desktop app — was done iteratively through natural language prompts.

### Architecture

The app is a **single HTML file** (`index.html`) with inline CSS and JavaScript, plus two CDN dependencies:
- **[dicomParser.js](https://github.com/cornerstonejs/dicomParser)** — Parses DICOM files in the browser.
- **[PDF.js](https://mozilla.github.io/pdf.js/)** — Extracts text from PDF clinical notes.

The backend is **Ollama** running locally, serving the MedGemma 1.5 4B vision model.

### Desktop App

The Electron wrapper (`electron-app/`) adds:
- Auto-detection and bundling of the Ollama binary for the target platform.
- Automatic Ollama server startup.
- One-click model download on first launch (~5 GB).
- Cross-platform builds (macOS, Windows, Linux).

---
## Project Structure

```
medgemma-viewer/
├── index.html           # Main webapp (single-file, runs in any browser)
├── launch.sh            # Shell launcher (starts Ollama + web server)
├── model/
│   └── Modelfile        # Ollama model config (reference)
└── electron-app/
    ├── main.js          # Electron main process (Ollama management)
    ├── preload.js       # Electron IPC bridge
    ├── index.html       # Electron version of the webapp
    └── package.json     # Dependencies and build config
```

---
<details>
<summary><strong>Leer en Español</strong></summary>

# Lulo's NOT a Health Copilot

<p align="center">
  <img src="logo.png" alt="Lulo's NOT a Health Copilot" width="200">
</p>

<p align="center"><em>No aceptes consejos médicos de un mono.</em></p>

Una aplicación de análisis de imágenes médicas completamente local, impulsada por [MedGemma 1.5](https://huggingface.co/google/medgemma-4b-it) y [Ollama](https://ollama.com). Sube radiografías, tomografías (CT), resonancias magnéticas (MRI) o fotos clínicas y obtén análisis con inteligencia artificial a través de una interfaz de chat conversacional — todo ejecutándose en tu máquina sin que ningún dato salga de tu computadora.

---

> **ADVERTENCIA — NO ES UN DISPOSITIVO MÉDICO**
>
> Este software **NO** es un dispositivo médico, **NO** cuenta con aprobación de la FDA ni de ningún organismo regulador, y **NO** está destinado a diagnosticar, tratar, curar o prevenir ninguna enfermedad o condición médica. No ha sido validado para uso clínico y **NUNCA** debe usarse como sustituto del criterio médico profesional.
>
> **No tomes** ninguna decisión médica basada en los resultados de este software. El modelo de IA puede producir resultados inexactos, incompletos, engañosos o completamente fabricados. Todos los resultados son únicamente para **fines de investigación y educación**.
>
> **Siempre consulta a un profesional de salud calificado** para cualquier pregunta, inquietud o decisión médica relacionada con diagnóstico, tratamiento o atención. Si estás experimentando una emergencia médica, llama a tu número de emergencias local inmediatamente.
>
> Los desarrolladores, colaboradores y mantenedores de este proyecto **no aceptan ninguna responsabilidad** por cualquier daño, lesión, pérdida o perjuicio — directo o indirecto — derivado del uso o mal uso de este software o sus resultados. Al usar este software, reconoces y aceptas que lo haces **completamente bajo tu propio riesgo**.

---

## Qué Hace

- **Analizar imágenes médicas** — Sube una radiografía, corte de CT, MRI, foto dermatológica o cualquier imagen médica y obtén un análisis estructurado con hallazgos y observaciones.
- **Soporte DICOM** — Carga archivos `.dcm` o carpetas DICOM completas.
- **Series multi-corte** — Sube una serie completa de CT o MRI y navega los cortes en una galería de miniaturas.
- **Contexto de notas clínicas** — Sube resúmenes de consulta o notas clínicas (PDF o texto) para dar contexto al modelo.
- **Chat conversacional** — Haz preguntas de seguimiento sobre la imagen en una interfaz de chat con historial completo.
- **Soporte Bilingüe** — Alterna instantáneamente toda la interfaz y los prompts de IA entre inglés y español.
- **Controles de Ventana** — Ventana sin bordes arrastrable y redimensionable en macOS para mayor usabilidad.
- **Completamente local** — Todo se ejecuta en tu hardware. No se envían datos a la nube.

---
## Instalación (Usuarios No Técnicos)

Esta guía proporciona instrucciones paso a paso para instalar y ejecutar la aplicación en tu computadora personal.

### Requisitos Previos

Antes de comenzar, necesitas instalar dos programas gratuitos: **Git** y **Node.js**.

- **Para Windows:**
    1.  **Instalar Git:**
        -   Descarga el instalador de Git desde [git-scm.com/download/win](https://git-scm.com/download/win).
        -   Ejecuta el instalador. Usa la configuración predeterminada en todos los pasos.
    2.  **Instalar Node.js:**
        -   Descarga el instalador de Node.js "LTS" (Soporte a Largo Plazo) desde [nodejs.org](https://nodejs.org/).
        -   Ejecuta el instalador. Usa la configuración predeterminada.

- **Para macOS:**
    1.  **Instalar Git (vía Homebrew):**
        -   Abre la aplicación **Terminal** (la encuentras en `Aplicaciones/Utilidades`).
        -   Instala Homebrew pegando este comando y presionando Enter:
            ```bash
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            ```
        -   Una vez instalado Homebrew, instala Git ejecutando:
            ```bash
            brew install git
            ```
    2.  **Instalar Node.js (vía Homebrew):**
        -   En la misma ventana de Terminal, ejecuta:
            ```bash
            brew install node
            ```

### Paso 1: Descargar la Aplicación

1.  Abre tu aplicación de terminal:
    -   **Windows:** Abre el **Menú Inicio**, escribe `cmd`, y presiona Enter.
    -   **macOS:** Abre la aplicación **Terminal** (desde `Aplicaciones/Utilidades`).

2.  Navega a tu Escritorio (o cualquier carpeta que prefieras) escribiendo este comando y presionando Enter:
    ```bash
    cd Desktop
    ```

3.  Clona el repositorio del proyecto desde GitHub. Este comando descarga el código fuente de la aplicación:
    ```bash
    git clone https://github.com/KeNFT1/medgemma-viewer.git
    ```

4.  Navega al nuevo directorio `electron-app`:
    ```bash
    cd medgemma-viewer/electron-app
    ```

### Paso 2: Compilar la Aplicación

Este paso compila el código fuente en una aplicación de escritorio ejecutable (`.exe` para Windows, `.app` para macOS).

1.  En la misma ventana de terminal (dentro de la carpeta `electron-app`), instala las dependencias necesarias ejecutando:
    ```bash
    npm install
    ```

2.  Ahora, compila la aplicación. Este comando puede tardar unos minutos.
    -   **Para Windows:**
        ```bash
        npm run build:win
        ```
    -   **Para macOS (Apple Silicon: M1, M2, M3):**
        ```bash
        npm run build:mac:arm64
        ```
    -   **Para macOS (basado en Intel):**
        ```bash
        npm run build:mac:x64
        ```

### Paso 3: Iniciar la Aplicación

1.  La aplicación final se encuentra ahora en la carpeta `electron-app/dist`. Puedes encontrarla usando tu explorador de archivos.
2.  Haz doble clic en la aplicación para ejecutarla:
    -   **Windows:** `Lulos NOT a Health Copilot.exe`
    -   **macOS:** `Lulos NOT a Health Copilot.app`

3.  En el primer inicio, la aplicación descargará automáticamente el modelo de IA necesario (~5 GB). Este es un proceso único y puede tardar un poco dependiendo de tu conexión a internet.

¡Ya estás listo para usar la aplicación!

## Guía Rápida para Desarrolladores

### Requisitos Previos

- **[Ollama](https://ollama.com/download)** instalado y disponible en tu PATH.
- ~5 GB de espacio en disco para el modelo MedGemma.
- Una máquina con al menos 8 GB de RAM (16 GB recomendado).
- **Node.js** y **npm**.

### Opción 1: Navegador (Más Rápido)

```bash
# Clona el repositorio
git clone https://github.com/KeNFT1/medgemma-viewer.git
cd medgemma-viewer

# Ejecuta el lanzador
chmod +x launch.sh
./launch.sh
```
El lanzador iniciará Ollama, descargará el modelo y abrirá la aplicación en tu navegador.

### Opción 2: Aplicación de Escritorio Electron

```bash
cd electron-app
npm install
npm start        # Ejecutar en modo de desarrollo
```

Para compilar un `.app` / `.exe` independiente:
-   **Windows:** `npm run build:win`
-   **macOS (ARM64):** `npm run build:mac:arm64`
-   **macOS (x64):** `npm run build:mac:x64`
-   **Linux:** `npm run build:linux`

La aplicación compilada estará en `electron-app/dist/`.

---
 
 ## Cómo Fue Construido
 
 Este proyecto fue construido completamente a través de una sesión de codificación conversacional con **Claude** (asistente de IA de Anthropic) y **Gemini** (modelo de IA de Google) usando **Claude Code** y **Antigravity**. El proceso completo de desarrollo — desde el concepto inicial hasta la aplicación de escritorio funcional — se realizó de forma iterativa a través de prompts de lenguaje natural.
 
 ### Arquitectura
 
 La aplicación es un **único archivo HTML** (`index.html`) con CSS y JavaScript en línea, más dos dependencias CDN:
 - **[dicomParser.js](https://github.com/cornerstonejs/dicomParser)** — Analiza archivos DICOM en el navegador.
 - **[PDF.js](https://mozilla.github.io/pdf.js/)** — Extrae texto de notas clínicas en PDF.
 
 El backend es **Ollama** ejecutándose localmente, sirviendo el modelo de visión MedGemma 1.5 4B.
 
 ### Aplicación de Escritorio
 
 El envoltorio Electron (`electron-app/`) añade:
 - Detección automática y empaquetado del binario de Ollama para la plataforma de destino.
 - Inicio automático del servidor de Ollama.
 - Descarga del modelo con un clic en el primer inicio (~5 GB).
 - Compilaciones multiplataforma (macOS, Windows, Linux).
 
 ---
 ## Estructura del Proyecto
```
medgemma-viewer/
├── index.html           # Webapp principal (archivo único)
├── launch.sh            # Lanzador de shell
├── model/
│   └── Modelfile        # Configuración del modelo Ollama
└── electron-app/
    ├── main.js          # Proceso principal de Electron
    ├── ...
    └── package.json     # Dependencias y configuración
```

</details>
