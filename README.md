MACHI TALK V2
=============
V2 replaces the V1 demo phrase dictionary with a real server-side translation API.

ARCHITECTURE
Browser/GitHub Pages
  microphone -> browser speech recognition
  -> POST /translate
  -> secure Node server
  -> OpenAI Responses API
  -> translated text
  -> browser speech synthesis

SUPPORTED LANGUAGES
Tamil, Hindi, English, Telugu, Bengali.

SECURITY
Never put OPENAI_API_KEY in index.html, app.js, GitHub Pages, or any public repository.
Keep it in the server's environment variable (.env locally; platform secret in production).

LOCAL TEST
1. Install Node.js 20+.
2. Open this folder in a terminal.
3. Run: npm install
4. Copy .env.example to .env
5. Put your API key into .env
6. Run: npm start
7. The server runs on http://localhost:3000
8. Open the V2 frontend and set Translation server to http://localhost:3000

GITHUB PAGES
GitHub Pages can host the frontend only. It cannot safely hold the API key or run the Node translation server.
For production, deploy the server separately (for example on a server platform that supports Node environment variables), then put its HTTPS URL into the app's Translation server field.

CURRENT LIMITATION
This version translates recognized speech after each utterance. It is not yet a true full-duplex cellular-call bridge. The next stage is low-latency streaming/realtime audio and call integration.
