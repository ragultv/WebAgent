# AI Web Builder

A live, AI-powered website builder that generates code based on natural language descriptions.

## Features

- Natural language prompt input
- Live code generation with streaming updates
- Monaco code editor for manual code tweaking
- Live preview with instant updates
- Responsive split-pane layout
- Dark mode support

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the `VITE_API_BASE_URL` in `.env` to point to your API server.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
/src
  /components
    PromptInput.jsx    # Handles user input and generation
    CodeEditor.jsx     # Monaco editor implementation
    PreviewPane.jsx    # Live preview iframe
  App.jsx             # Main application layout
  main.jsx           # Application entry point
/public
  index.html         # HTML template
```

## API Integration

The application expects a `/api/generate` endpoint that:
- Accepts POST requests with a JSON body containing a `prompt` field
- Returns streamed HTML/CSS/JS code
- Supports proper CORS configuration