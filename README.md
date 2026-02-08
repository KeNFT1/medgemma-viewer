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
- **Completely local** — Everything runs on your hardware via Ollama. No cloud APIs, no data uploads, no internet required after initial setup

---

## How It Was Built

This project was built entirely through a conversational coding session with Claude (Anthropic's AI assistant) using Claude Code. The full development process — from initial concept to working desktop app — was done iteratively through natural language prompts.

### Architecture

The app is a **single HTML file** (`index.html`) with inline CSS and JavaScript, plus two CDN dependencies:

- **[dicomParser.js](https://github.com/cornerstonejs/dicomParser)** — Parses DICOM files in the browser, extracting pixel data and metadata
- **[PDF.js](https://mozilla.github.io/pdf.js/)** — Extracts text from PDF clinical notes for context injection

The backend is **Ollama** running locally, serving the MedGemma 1.5 4B vision model. The app communicates with Ollama's REST API (`/api/chat`) with streaming enabled.

### Model

The app uses **MedGemma 1.5 4B-IT** (instruction-tuned) from Google, quantized to Q8_0 via [Unsloth's GGUF conversion](https://huggingface.co/unsloth/medgemma-1.5-4b-it-GGUF). This model is based on Gemma 3 with a SigLIP image encoder and was trained on medical imaging datasets covering:

- Chest X-rays
- CT scans
- MRI images
- Dermatology photos
- Histopathology slides
- Ophthalmology images

### DICOM Processing Pipeline

DICOM files are processed entirely in-browser:

1. Parse the `.dcm` file with `dicomParser.js`
2. Extract pixel data and convert to Hounsfield Units using slope/intercept from DICOM metadata
3. Apply 3-channel windowing optimized for MedGemma:
   - **Red channel:** Bone/Lung window (W:2250, L:-100)
   - **Green channel:** Soft tissue window (W:350, L:40)
   - **Blue channel:** Brain window (W:80, L:40)
4. Render to canvas and export as PNG base64 for the model

### Desktop App

The Electron wrapper (`electron-app/`) adds:

- Auto-detection of the Ollama binary across macOS, Windows, and Linux install paths
- Automatic Ollama server startup with `OLLAMA_ORIGINS=*` for CORS
- One-click model download on first launch (~5 GB)
- Cross-platform builds (macOS `.app`, Windows `.exe`, Linux `AppImage`)

---

## Capabilities

| Feature | Details |
|---|---|
| **Image formats** | JPEG, PNG, BMP, WebP, TIFF, GIF, SVG |
| **Medical formats** | DICOM (`.dcm`), uncompressed transfer syntaxes |
| **Upload methods** | Click to browse, drag & drop, clipboard paste (Ctrl/Cmd+V) |
| **DICOM series** | Folder upload, multi-file select, slice gallery with thumbnail navigation |
| **Slice selection** | Manual pick (click/shift-click), auto-select (evenly-spaced), select all |
| **Clinical notes** | PDF upload (text extraction), plain text upload, paste directly |
| **Chat** | Streaming responses, conversation history, follow-up questions |
| **Windowing** | Automatic 3-channel CT windowing for MedGemma (bone, tissue, brain) |
| **Platforms** | Browser (any OS), macOS `.app`, Windows `.exe`, Linux `AppImage` |
| **Privacy** | 100% local — no data leaves your machine |

---

## Getting Started

### Prerequisites

- **[Ollama](https://ollama.com/download)** installed and available in your PATH
- ~5 GB disk space for the MedGemma model
- A machine with at least 8 GB RAM (16 GB recommended)

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

```bash
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

The built app is in `electron-app/dist/`. On first launch, it will prompt to download the MedGemma model if not already installed.

### Manual Model Setup

If you prefer to set up the model yourself:

```bash
# Pull the model from HuggingFace (includes vision projector)
ollama pull hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0

# Create a shorter alias
ollama cp hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0 medgemma-vision
```

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

## Usage Tips

- **Single image analysis:** Upload any medical image (X-ray, photo, screenshot) and click **Analyze** or type a custom question
- **CT/MRI series:** Click **+ Folder** to upload a DICOM directory, or drag multiple `.dcm` files onto the drop zone. Use the slice gallery to select which slices to include in your query
- **Clinical context:** Switch to the **Notes** tab, upload a PDF or paste clinical notes, then click **Load into Chat**. The notes will be included as context in your next message
- **Custom prompts:** Type your own question in the chat box instead of using the default analyze prompt — useful for asking about specific findings or regions
- **Model switching:** Change the model name in the chat header if you want to use a different Ollama model

---

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework, single file)
- **DICOM parsing:** [dicomParser.js](https://github.com/cornerstonejs/dicomParser) v1.8.21
- **PDF extraction:** [PDF.js](https://mozilla.github.io/pdf.js/) v3.11.174
- **AI model:** [MedGemma 1.5 4B-IT Q8_0](https://huggingface.co/unsloth/medgemma-1.5-4b-it-GGUF) via Ollama
- **Desktop:** [Electron](https://www.electronjs.org/) v35 + [electron-builder](https://www.electron.build/)
- **LLM server:** [Ollama](https://ollama.com/)

---

## License

MIT

---

<details>
<summary><strong>Leer en Espa&ntilde;ol</strong></summary>

# Lulo's NOT a Health Copilot

Una aplicaci&oacute;n completamente local para an&aacute;lisis de im&aacute;genes m&eacute;dicas, impulsada por [MedGemma 1.5](https://huggingface.co/google/medgemma-4b-it) y [Ollama](https://ollama.com). Sube radiograf&iacute;as, tomograf&iacute;as (CT), resonancias magn&eacute;ticas (MRI) o fotos cl&iacute;nicas y obt&eacute;n an&aacute;lisis con inteligencia artificial a trav&eacute;s de una interfaz de chat conversacional &mdash; todo ejecut&aacute;ndose en tu m&aacute;quina sin que ning&uacute;n dato salga de tu computadora.

> **ADVERTENCIA &mdash; NO ES UN DISPOSITIVO M&Eacute;DICO**
>
> Este software **NO** es un dispositivo m&eacute;dico, **NO** cuenta con aprobaci&oacute;n de la FDA ni de ning&uacute;n organismo regulador, y **NO** est&aacute; destinado a diagnosticar, tratar, curar o prevenir ninguna enfermedad o condici&oacute;n m&eacute;dica. No ha sido validado para uso cl&iacute;nico y **NUNCA** debe usarse como sustituto del criterio m&eacute;dico profesional.
>
> **No tomes** ninguna decisi&oacute;n m&eacute;dica basada en los resultados de este software. El modelo de IA puede producir resultados inexactos, incompletos, enga&ntilde;osos o completamente fabricados. Todos los resultados son &uacute;nicamente para **fines de investigaci&oacute;n y educaci&oacute;n**.
>
> **Siempre consulta a un profesional de salud calificado** para cualquier pregunta, inquietud o decisi&oacute;n m&eacute;dica relacionada con diagn&oacute;stico, tratamiento o atenci&oacute;n. Si est&aacute;s experimentando una emergencia m&eacute;dica, llama a tu n&uacute;mero de emergencias local inmediatamente.
>
> Los desarrolladores, colaboradores y mantenedores de este proyecto **no aceptan ninguna responsabilidad** por cualquier da&ntilde;o, lesi&oacute;n, p&eacute;rdida o perjuicio &mdash; directo o indirecto &mdash; derivado del uso o mal uso de este software o sus resultados. Al usar este software, reconoces y aceptas que lo haces **completamente bajo tu propio riesgo**.

---

## Qu&eacute; Hace

- **Analizar im&aacute;genes m&eacute;dicas** &mdash; Sube una radiograf&iacute;a, corte de CT, MRI, foto dermatol&oacute;gica o cualquier imagen m&eacute;dica y obt&eacute;n un an&aacute;lisis estructurado con hallazgos, observaciones y evaluaciones diferenciales
- **Soporte DICOM** &mdash; Carga archivos `.dcm` o carpetas DICOM completas. La app aplica ventaneo de 3 canales optimizado para MedGemma (hueso/pulm&oacute;n, tejido blando, cerebro) para convertir unidades Hounsfield en im&aacute;genes RGB optimizadas para el modelo
- **Series multi-corte** &mdash; Sube una serie completa de CT o MRI y navega los cortes en una galer&iacute;a de miniaturas. Selecci&oacute;n autom&aacute;tica de cortes representativos o elecci&oacute;n manual de cu&aacute;les enviar para an&aacute;lisis
- **Contexto de notas cl&iacute;nicas** &mdash; Sube res&uacute;menes de consulta, resultados de laboratorio o notas cl&iacute;nicas (PDF o texto) para dar al modelo contexto adicional al responder preguntas
- **Chat conversacional** &mdash; Haz preguntas de seguimiento sobre la imagen, solicita enfoque en regiones espec&iacute;ficas o discute hallazgos en una interfaz de chat con respuestas en tiempo real e historial completo de conversaci&oacute;n
- **Completamente local** &mdash; Todo se ejecuta en tu hardware a trav&eacute;s de Ollama. Sin APIs en la nube, sin subida de datos, sin necesidad de internet despu&eacute;s de la configuraci&oacute;n inicial

---

## C&oacute;mo Se Construy&oacute;

Este proyecto fue construido completamente a trav&eacute;s de una sesi&oacute;n de programaci&oacute;n conversacional con Claude (el asistente de IA de Anthropic) usando Claude Code. Todo el proceso de desarrollo &mdash; desde el concepto inicial hasta la aplicaci&oacute;n de escritorio funcional &mdash; se realiz&oacute; iterativamente mediante instrucciones en lenguaje natural.

### Arquitectura

La app es un **&uacute;nico archivo HTML** (`index.html`) con CSS y JavaScript en l&iacute;nea, m&aacute;s dos dependencias por CDN:

- **[dicomParser.js](https://github.com/cornerstonejs/dicomParser)** &mdash; Analiza archivos DICOM en el navegador, extrayendo datos de p&iacute;xeles y metadatos
- **[PDF.js](https://mozilla.github.io/pdf.js/)** &mdash; Extrae texto de notas cl&iacute;nicas en PDF para inyecci&oacute;n de contexto

El backend es **Ollama** ejecut&aacute;ndose localmente, sirviendo el modelo de visi&oacute;n MedGemma 1.5 4B. La app se comunica con la API REST de Ollama (`/api/chat`) con streaming habilitado.

### Modelo

La app utiliza **MedGemma 1.5 4B-IT** (ajustado por instrucciones) de Google, cuantizado a Q8_0 mediante la [conversi&oacute;n GGUF de Unsloth](https://huggingface.co/unsloth/medgemma-1.5-4b-it-GGUF). Este modelo est&aacute; basado en Gemma 3 con un codificador de im&aacute;genes SigLIP y fue entrenado en conjuntos de datos de im&aacute;genes m&eacute;dicas que incluyen:

- Radiograf&iacute;as de t&oacute;rax
- Tomograf&iacute;as computarizadas (CT)
- Im&aacute;genes de resonancia magn&eacute;tica (MRI)
- Fotos dermatol&oacute;gicas
- Laminillas de histopatolog&iacute;a
- Im&aacute;genes de oftalmolog&iacute;a

### Pipeline de Procesamiento DICOM

Los archivos DICOM se procesan completamente en el navegador:

1. Analizar el archivo `.dcm` con `dicomParser.js`
2. Extraer datos de p&iacute;xeles y convertir a Unidades Hounsfield usando pendiente/intercepto de los metadatos DICOM
3. Aplicar ventaneo de 3 canales optimizado para MedGemma:
   - **Canal rojo:** Ventana de hueso/pulm&oacute;n (W:2250, L:-100)
   - **Canal verde:** Ventana de tejido blando (W:350, L:40)
   - **Canal azul:** Ventana de cerebro (W:80, L:40)
4. Renderizar en canvas y exportar como PNG base64 para el modelo

### Aplicaci&oacute;n de Escritorio

El contenedor Electron (`electron-app/`) a&ntilde;ade:

- Detecci&oacute;n autom&aacute;tica del binario de Ollama en rutas de instalaci&oacute;n de macOS, Windows y Linux
- Inicio autom&aacute;tico del servidor Ollama con `OLLAMA_ORIGINS=*` para CORS
- Descarga del modelo con un clic en el primer inicio (~5 GB)
- Compilaciones multiplataforma (macOS `.app`, Windows `.exe`, Linux `AppImage`)

---

## Capacidades

| Caracter&iacute;stica | Detalles |
|---|---|
| **Formatos de imagen** | JPEG, PNG, BMP, WebP, TIFF, GIF, SVG |
| **Formatos m&eacute;dicos** | DICOM (`.dcm`), sintaxis de transferencia sin compresi&oacute;n |
| **M&eacute;todos de carga** | Clic para buscar, arrastrar y soltar, pegar desde portapapeles (Ctrl/Cmd+V) |
| **Series DICOM** | Carga de carpetas, selecci&oacute;n m&uacute;ltiple de archivos, galer&iacute;a de cortes con navegaci&oacute;n por miniaturas |
| **Selecci&oacute;n de cortes** | Selecci&oacute;n manual (clic/shift-clic), auto-selecci&oacute;n (espaciado uniforme), seleccionar todos |
| **Notas cl&iacute;nicas** | Carga de PDF (extracci&oacute;n de texto), carga de texto plano, pegar directamente |
| **Chat** | Respuestas en streaming, historial de conversaci&oacute;n, preguntas de seguimiento |
| **Ventaneo** | Ventaneo autom&aacute;tico de 3 canales CT para MedGemma (hueso, tejido, cerebro) |
| **Plataformas** | Navegador (cualquier SO), macOS `.app`, Windows `.exe`, Linux `AppImage` |
| **Privacidad** | 100% local &mdash; ning&uacute;n dato sale de tu m&aacute;quina |

---

## C&oacute;mo Empezar

### Requisitos Previos

- **[Ollama](https://ollama.com/download)** instalado y disponible en tu PATH
- ~5 GB de espacio en disco para el modelo MedGemma
- Una m&aacute;quina con al menos 8 GB de RAM (16 GB recomendado)

### Opci&oacute;n 1: Navegador (M&aacute;s R&aacute;pido)

```bash
# Clonar el repositorio
git clone https://github.com/KeNFT1/medgemma-viewer.git
cd medgemma-viewer

# Ejecutar el lanzador (maneja Ollama, descarga del modelo y servidor web)
chmod +x launch.sh
./launch.sh
```

El lanzador:
1. Inicia Ollama con CORS habilitado
2. Descarga el modelo MedGemma si no est&aacute; instalado
3. Inicia un servidor web local en el puerto 8090
4. Abre tu navegador en `http://localhost:8090`

### Opci&oacute;n 2: Aplicaci&oacute;n de Escritorio Electron

```bash
cd electron-app
npm install
npm start        # Ejecutar en modo desarrollo
```

Para compilar un `.app` / `.exe` independiente:

```bash
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

La aplicaci&oacute;n compilada est&aacute; en `electron-app/dist/`. En el primer inicio, pedir&aacute; descargar el modelo MedGemma si no est&aacute; instalado.

### Configuraci&oacute;n Manual del Modelo

Si prefieres configurar el modelo manualmente:

```bash
# Descargar el modelo desde HuggingFace (incluye proyector de visi&oacute;n)
ollama pull hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0

# Crear un alias m&aacute;s corto
ollama cp hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0 medgemma-vision
```

---

## Estructura del Proyecto

```
medgemma-viewer/
├── index.html           # Webapp principal (archivo &uacute;nico, funciona en cualquier navegador)
├── launch.sh            # Lanzador de shell (inicia Ollama + servidor web)
├── model/
│   └── Modelfile        # Configuraci&oacute;n del modelo Ollama (referencia)
└── electron-app/
    ├── main.js          # Proceso principal de Electron (gesti&oacute;n de Ollama)
    ├── preload.js       # Puente IPC de Electron
    ├── index.html       # Versi&oacute;n Electron de la webapp
    └── package.json     # Dependencias y configuraci&oacute;n de compilaci&oacute;n
```

---

## Consejos de Uso

- **An&aacute;lisis de imagen individual:** Sube cualquier imagen m&eacute;dica (radiograf&iacute;a, foto, captura de pantalla) y haz clic en **Analyze** o escribe una pregunta personalizada
- **Series CT/MRI:** Haz clic en **+ Folder** para subir un directorio DICOM, o arrastra m&uacute;ltiples archivos `.dcm` a la zona de carga. Usa la galer&iacute;a de cortes para seleccionar cu&aacute;les incluir en tu consulta
- **Contexto cl&iacute;nico:** Cambia a la pesta&ntilde;a **Notes**, sube un PDF o pega notas cl&iacute;nicas, luego haz clic en **Load into Chat**. Las notas se incluir&aacute;n como contexto en tu pr&oacute;ximo mensaje
- **Preguntas personalizadas:** Escribe tu propia pregunta en el cuadro de chat en lugar de usar el prompt de an&aacute;lisis predeterminado &mdash; &uacute;til para preguntar sobre hallazgos o regiones espec&iacute;ficas
- **Cambio de modelo:** Cambia el nombre del modelo en el encabezado del chat si deseas usar un modelo de Ollama diferente

---

## Stack Tecnol&oacute;gico

- **Frontend:** HTML/CSS/JS vanilla (sin framework, archivo &uacute;nico)
- **An&aacute;lisis DICOM:** [dicomParser.js](https://github.com/cornerstonejs/dicomParser) v1.8.21
- **Extracci&oacute;n de PDF:** [PDF.js](https://mozilla.github.io/pdf.js/) v3.11.174
- **Modelo de IA:** [MedGemma 1.5 4B-IT Q8_0](https://huggingface.co/unsloth/medgemma-1.5-4b-it-GGUF) v&iacute;a Ollama
- **Escritorio:** [Electron](https://www.electronjs.org/) v35 + [electron-builder](https://www.electron.build/)
- **Servidor LLM:** [Ollama](https://ollama.com/)

</details>
