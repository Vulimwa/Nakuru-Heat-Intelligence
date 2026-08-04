# Nakuru Heat Intelligence

Nakuru Heat Intelligence is a web-based research assistant for the Nakuru Urban Heat Observatory. It helps users explore the 2021–2026 study through a chat interface, covering Surface Urban Heat Island (SIUHI) patterns, heat exposure, hotspots, land cover, Lake Nakuru cooling associations, and heat-management guidance.

## How it works

1. A user submits a question in the React chat interface.
2. The server retrieves the most relevant sections from `Nakuru_Urban_Heat_Observatory_Knowledge.md`.
3. The question and retrieved context are sent to OpenRouter for a grounded response.
4. If the LLM is unavailable, the app uses its local knowledge-answering fallback.

The assistant treats the Observatory knowledge base as its primary source. When a question is not covered by the study, it may provide a concise general explanation, clearly identifying it as general information rather than a Nakuru Observatory finding.

## Tech stack

- React, TypeScript, Vite, and Tailwind CSS for the interface
- Express for the local API server
- OpenRouter Chat Completions API for LLM responses
- Markdown knowledge base with server-side retrieval and local fallbacks
- Vercel serverless handlers for deployment

## Requirements

- Node.js 20 or newer
- An OpenRouter API key

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
OPEN_ROUTER_API_KEY="your-openrouter-api-key"

# Optional. Defaults to OpenRouter's free router, which selects an available free model.
OPENROUTER_MODEL="openrouter/free"

# Optional. Used as the HTTP Referer header sent to OpenRouter.
APP_URL="http://localhost:3000"
```

`OPEN_ROUTER_API_KEY` is the required environment-variable name. Keep `.env` private; it is excluded from Git.

## Run locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

If you change `.env` or the server-side model configuration, stop the process and start it again so the new environment values are loaded.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express server and Vite development middleware. |
| `npm run lint` | Type-check the project without emitting files. |
| `npm run build` | Create the production web build and bundled Node server. |
| `npm start` | Run the bundled production server after building. |

## Model configuration

By default, the app uses `openrouter/free`. This OpenRouter router chooses a currently available free model automatically, so it can operate without paid-model credits. Free models can be rate limited or temporarily unavailable.

To use a specific OpenRouter model, set its model ID in `.env`, then restart the server:

```env
OPENROUTER_MODEL="openai/gpt-4o"
```

Specific paid models require an OpenRouter account with sufficient credits.

## Knowledge base

The source document is:

```text
Nakuru_Urban_Heat_Observatory_Knowledge.md
```

The server reloads it when its modification time changes. Keep the file in the repository root for both local and deployed use. The retrieval layer selects the most relevant sections before each model request; this gives the model the data needed to answer specific Observatory questions instead of relying only on general knowledge.

## API

### `GET /api/status`

Returns whether the knowledge base is available and whether the OpenRouter key is configured.

### `POST /api/chat`

Accepts a JSON body with a user question:

```json
{ "message": "Which land-cover type was hottest in 2026?" }
```

Returns an answer, the response mode (`openrouter` or `local`), and a timestamp.

## Deployment

The repository includes `vercel.json` for Vercel deployment. Configure these environment variables in the Vercel project settings:

- `OPEN_ROUTER_API_KEY` — required
- `OPENROUTER_MODEL` — optional; defaults to `openrouter/free`
- `APP_URL` — optional but recommended; set it to the deployed application URL

Never expose the API key in browser code, source control, screenshots, or public documentation.

## Important interpretation notes

- SIUHI describes surface thermal conditions; it is not the same as air temperature.
- Population exposure estimates are not individual health outcomes.
- The Lake Nakuru analysis describes spatial cooling association, not proof that the lake alone caused the cooling.
