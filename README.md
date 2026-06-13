## Architecture

This application is built on a strict separation between a Protocol Layer (handling raw WebSocket frames, reordering, and synchronous heartbeats) and a Presentation Layer (Zustand stores and React components). The Protocol Layer utilizes a Map-based reordering buffer and a synchronous Fast-Path to guarantee sub-millisecond `PONG` and `TOOL_ACK` responses, completely decoupling network compliance from React's render cycle. This architecture ensures the UI remains responsive and state remains consistent even under the extreme main-thread blocking conditions introduced by the backend's Chaos Mode.
```cmd
cd agent-server
npm install
npm run build
node dist/index.js <params>
```
params : mode | port (eg node dist/index.js --mode chaos --port 8080)

```cmd
cd agent-client
npm install
npm run build
npm run dev
```

## WebSocket State Machine

The connection lifecycle is managed by a strict state machine to handle Chaos Mode drops and multi-turn conversations seamlessly.

---

```mermaid
graph TD
    subgraph "Agent Server"
        WS["WebSocket Server"]
    end

    subgraph "Browser - Protocol Layer"
        WSM["WebSocket Manager"]
        FP{"Fast-Path Interceptor"}
        MB["Message Buffer - Map-based Reordering"]
        WW["Web Worker - JSON Diffing"]
    end

    subgraph "Browser - Presentation Layer"
        ZC["Zustand Chat Store"]
        ZT["Zustand Timeline Store"]
        ZX["Zustand Context Store"]
        UI["React UI Components"]
    end

    WS ==>|Raw JSON Frames| WSM
    WSM --> FP

    FP -->|PING / TOOL_CALL| WS
    FP -->|Everything Else| MB

    MB -->|Strictly Ordered & Deduplicated| ZC
    MB -->|Batched Tokens| ZT
    MB -->|Snapshots| ZX

    ZX -->|500KB+ Payloads| WW
    WW -->|Lightweight Patches| ZX

    ZC --> UI
    ZT --> UI
    ZX --> UI
```

## Screenshots 
<img width="1918" height="912" alt="image" src="https://github.com/user-attachments/assets/cb6f6012-1e2a-4a5d-a41a-45b58246e1c6" />
<img width="1870" height="897" alt="image" src="https://github.com/user-attachments/assets/50c2e9d1-633e-4a94-a349-5d9704531b6a" />
<img width="1021" height="907" alt="image" src="https://github.com/user-attachments/assets/030a1876-4fbe-4d59-9f0d-20ec4134ed00" />

## [Video for chaos mode](https://youtu.be/IsBKILBi9PM) 


PS: This is my alt account you can go to my main @yuvraajnarula => https://www.github.com/yuvraajnarula for my profile :)
