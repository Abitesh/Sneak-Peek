# Sneak-Peek

![Sneak-Peek Logo](assets/icon.png)

**Sneak-Peek is an AI-powered desktop assistant designed for intelligent conversations, real-time assistance, coding, technical interviews, contextual understanding, and productivity.**

It brings together conversational intelligence, live transcription, screen understanding, document retrieval, and multiple AI providers through a unified desktop experience.

**Repository:** https://github.com/Abitesh/Sneak-Peek

## Overview

Sneak-Peek aims to make AI assistance more accessible, contextual, responsive, and useful during everyday computer workflows.

Instead of relying only on a language model's general knowledge, Sneak-Peek can combine conversation context, authorized documents, project information, transcripts, and screen content to produce more relevant responses.

The long-term objective is a fast, reliable, privacy-conscious desktop assistant with a single coherent intelligence architecture.

## Features

### AI Conversations
- Interactive desktop chat with streamed responses.
- Support for configured cloud and local AI models.
- Conversation-aware follow-ups and context continuity.
- Model routing, controlled fallback, and cancellation.

### Real-Time Assistance
- Microphone and supported system-audio transcription.
- Listen, Analyze, automatic-answer, and manual-answer workflows.
- Live meeting and interview assistance.
- Transcript context and recent-question recovery.
- Request cancellation and protection against stale responses.

### Contextual Intelligence
- Authorized document and project retrieval.
- Context-aware question understanding.
- Conversation history and evidence selection.
- Retrieval-augmented generation (RAG).
- Source isolation, grounding, and provenance handling.

### Screen and Coding Assistance
- Screenshot-based questions and screen understanding.
- Coding and technical problem assistance.
- Explanations, follow-ups, and structured responses.
- Support for visual and textual context through compatible AI models.

### Desktop Experience
- Electron-based application.
- Desktop chat overlays and launcher.
- Configurable AI providers and settings.
- Multiple interaction workflows.
- Local storage for supported application data.

## How It Works

Sneak-Peek uses a centralized Intelligence Engine to coordinate the answer process.

```text
User / Conversation / Transcript / Screen
                  |
                  v
          Intelligence Engine
                  |
                  v
       Conversation Understanding
                  |
                  v
            Context Planner
                  |
                  v
       Authorized Context & RAG
                  |
                  v
            Evidence Pack
                  |
                  v
            Response Planner
                  |
                  v
           Prompt Assembler
                  |
                  v
             Model Router
                  |
                  v
         Generation Controller
                  |
                  v
           Streaming Answer
```

The Intelligence Engine determines how a request should be handled. Retrieval supplies relevant authorized information, while the selected AI model generates the response.

## Technology Stack

| Layer | Technologies |
|---|---|
| Desktop | Electron |
| Frontend | React, TypeScript, Vite |
| Application logic | Node.js, TypeScript |
| Intelligence | Centralized context and generation pipeline |
| Retrieval | RAG, lexical and semantic search |
| Storage | SQLite and vector-enabled retrieval |
| AI | Configured cloud and local LLM providers |
| Speech | Supported audio capture and speech-to-text providers |
| Platforms | macOS development, with additional cross-platform support and verification in progress |

## Getting Started

### Prerequisites

Install a compatible version of Node.js and npm, together with the build tools required for your operating system.

Some AI features require configured API credentials, locally installed models, network access, or speech-to-text configuration.

### Development

Clone the repository:

```bash
git clone https://github.com/Abitesh/Sneak-Peek.git
cd Sneak-Peek
```

Install dependencies:

```bash
npm ci
```

Launch the development application:

```bash
npm start
```

The initial dependency setup may also prepare native modules and download required local assets.

### Build for macOS Apple Silicon

```bash
npm run app:build -- --mac dmg --arm64 --publish never
node scripts/verify-macos-bundle.cjs release/Sneak-Peek-2.8.7-arm64.dmg arm64 --launch
open release/Sneak-Peek-2.8.7-arm64.dmg
```

The build checks the unpacked application and the app inside the installer. The separate launch check opens the mounted app with a temporary profile. After it passes, drag Sneak-Peek into Applications.

This local build is intended for development and personal testing; public distribution requires separate licensing and release checks.

## Configuration

Sneak-Peek provides application settings for configuring supported AI providers, model preferences, audio input, transcription, and related features.

Some capabilities depend on provider quotas, available models, macOS permissions, and local device configuration.

Provider credentials and private user information should never be committed to the repository.

## Roadmap 2.0

Sneak-Peek is under active development. Planned product milestones include:

| Milestone | Focus |
|---|---|
| V2-01 | Dedicated Coding / DSA, CS Fundamentals, and Resume & Projects modes |
| V2-02 | Session preparation, role selection, resumes, documents, and preferences |
| V2-03 | Responsive, movable, resizable, and customizable desktop UI |
| V2-04 | Model favorites, provider availability, and quota awareness |
| V2-05 | Intelligence quality, response speed, and cost optimization |
| V2-06 | Interview practice, preparation, and session review |

See [ROADMAP.md](ROADMAP.md) for current plans, progress, and acceptance requirements.

## Development Status

Sneak-Peek is an evolving desktop application.

Core intelligence, chat, retrieval, transcription, and desktop workflows are implemented, with ongoing improvements to performance, user experience, reliability, platform compatibility, and model availability.

Not every planned feature is complete or verified on every platform.

## Privacy and Responsible Use

Sneak-Peek is designed around authorized context access and controlled AI requests. Users should configure their providers and permissions according to their needs.

Audio capture, transcription, screenshots, and document access should be used only with appropriate permissions and consent.

Users remain responsible for reviewing AI-generated information and respecting applicable meeting, interview, workplace, and privacy rules.

Project repository: https://github.com/Abitesh/Sneak-Peek

## License and Attribution

Please review [LICENSE](LICENSE) for the applicable personal-use, modification, distribution, and attribution requirements.

All applicable copyright and attribution notices must remain intact.