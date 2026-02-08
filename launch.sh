#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8090

echo "========================================="
echo "  MedGemma Viewer"
echo "========================================="
echo ""

# --- Check for Ollama ---
if ! command -v ollama &>/dev/null; then
  echo "ERROR: Ollama is not installed."
  echo "Install it from: https://ollama.com/download"
  echo ""
  read -p "Press Enter to exit..."
  exit 1
fi

# --- Start Ollama if not running ---
if ! curl -s http://localhost:11434/api/tags &>/dev/null; then
  echo "[1/3] Starting Ollama..."
  OLLAMA_ORIGINS="*" ollama serve &>/dev/null &
  OLLAMA_PID=$!
  sleep 3
  echo "       Ollama started (PID $OLLAMA_PID)"
else
  echo "[1/3] Ollama already running."
  OLLAMA_PID=""
fi

# --- Ensure the model is available ---
echo "[2/3] Checking model..."
if ! ollama list 2>/dev/null | grep -q "medgemma-vision"; then
  echo "       Model 'medgemma-vision' not found. Pulling from HuggingFace..."
  echo "       (This is a ~5 GB download, may take a while)"
  ollama pull hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0
  ollama cp hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q8_0 medgemma-vision
  echo "       Model ready."
else
  echo "       Model 'medgemma-vision' is available."
fi

# --- Start web server ---
echo "[3/3] Starting web server on port $PORT..."
cd "$SCRIPT_DIR"
python3 -m http.server $PORT &>/dev/null &
SERVER_PID=$!

echo ""
echo "========================================="
echo "  Ready! Opening browser..."
echo "  http://localhost:$PORT"
echo ""
echo "  Press Ctrl+C to stop."
echo "========================================="

# Open browser (macOS)
if command -v open &>/dev/null; then
  open "http://localhost:$PORT"
elif command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:$PORT"
fi

# --- Cleanup on exit ---
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $SERVER_PID 2>/dev/null || true
  if [ -n "$OLLAMA_PID" ]; then
    kill $OLLAMA_PID 2>/dev/null || true
  fi
  echo "Done."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Wait
wait
