# MedGemma Viewer

A fully local medical image analysis application powered by [MedGemma 1.5](https://huggingface.co/google/medgemma-4b-it) and [Ollama](https://ollama.com). Upload X-rays, CT scans, MRI slices, or clinical photos and get AI-powered analysis through a conversational chat interface — all running on your machine with no data leaving your computer.

> **Disclaimer:** For research and educational use only. Not a substitute for professional medical advice, diagnosis, or treatment.

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
