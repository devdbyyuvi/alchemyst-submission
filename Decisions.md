# Architectural Decisions & Trade-offs

## 1. Sequence Number Ordering & Deduplication
**Approach:** I implemented a `MessageBuffer` class utilizing a `Map<number, ServerMessage>`. 
**Why:** In Chaos Mode, messages arrive out of order and with duplicates. An Array would require O(N) searches to find gaps or duplicates. A `Map` provides O(1) lookups. The buffer tracks a single source of truth: `nextExpectedSeq`. When a message arrives, it is buffered. The `flush()` method continuously checks if `nextExpectedSeq` exists in the Map, pulling it out, incrementing the counter, and returning an ordered array. This guarantees the UI only ever processes strictly sequential, deduplicated state updates.

## 2. Preventing Layout Shift During Tool Calls
**Approach:** The UI does not render a flat list of messages. Instead, it maintains an array of discrete `ChatBlock` objects (`user`, `text`, `tool_call`). 
**Why:** When a `TOOL_CALL` arrives, the state machine explicitly finds the active `text` block and changes its status to `'paused'`, freezing the text. It then pushes a *new* `tool_call` block. When the `TOOL_RESULT` arrives, it updates that specific block, and the next `TOKEN` creates a *new* `text` block. This prevents the "jumping" or "reflow" that occurs when trying to mutate a single continuous string with inline tool call placeholders.

## 3. Reconnection State Recovery
**Approach:** The `WebSocketManager` tracks connection status and implements exponential backoff (500ms, 1s, 2s, 4s... capped at 10s). Upon `onopen`, it immediately checks `buffer.getLastProcessedSeq()`. If > 0, it sends `{ type: "RESUME", last_seq: ... }` as the *very first* message.
**Crucial Detail:** I added a `startNewTurn()` method that resets the `MessageBuffer` to expect `seq: 1`. This is required because the backend explicitly resets its global `seq` counter to `0` on every new `USER_MESSAGE`. Without this, a reconnection after a new user message would request a `last_seq` the server no longer recognizes, causing a permanent hang.

## 4. Identified Protocol Failure Mode: The `TOOL_ACK` Race Condition
**The Trap:** The server waits 5 seconds for a `TOOL_ACK`. If the client relies on React's `useEffect` to detect a `TOOL_CALL` and send the ACK, the response is coupled to React's render cycle. In Chaos Mode, a 500KB `CONTEXT_SNAPSHOT` or a burst of 300 tokens can block the main thread. If the main thread is blocked, React cannot render, the `useEffect` does not fire, the `TOOL_ACK` is delayed past 5 seconds, and the server logs a protocol violation.
**The Solution:** I implemented a **Synchronous Fast-Path** in the `ws.onmessage` handler. `PING` and `TOOL_CALL` messages are intercepted and responded to *synchronously*, before the message is ever passed to the `MessageBuffer` or Zustand. This guarantees sub-millisecond protocol compliance, completely decoupled from main-thread rendering performance.

## 5. Scaling to 50 Concurrent Agent Streams (Operations Dashboard)
If this were an operations dashboard, React state updates would become the bottleneck. I would:
1. Move the `WebSocketManager` and `MessageBuffer` into a **SharedWorker**. This offloads JSON parsing, buffering, and deduplication from the main thread entirely.
2. Use a single, highly optimized virtualized list (like `@tanstack/react-virtual`) for the entire dashboard, rendering only the visible rows.
3. Replace Zustand with a custom `useSyncExternalStore` hook that batches updates via `requestAnimationFrame`, ensuring the UI never renders at more than 60fps regardless of message volume.

## 6. Scaling to 100x Longer Responses (Document Generation)
If the agent generates a 50,000-token document, storing the entire string in React state will cause massive memory overhead and slow re-renders. I would:
1. Stop storing the full text in Zustand. Instead, the `WebSocketManager` would directly manipulate the DOM using `document.createTextNode` and `appendChild` on a specific `div` reference.
2. This bypasses React's reconciliation entirely for the text stream, reducing memory footprint to near-zero and guaranteeing 60fps streaming, while still using React for the surrounding UI chrome (tool calls, headers, etc.).



I discovered a subtle protocol deadlock during testing: the backend assigns monotonic sequence numbers to PING heartbeats. If the client intercepts PINGs in a synchronous Fast-Path and bypasses the reordering buffer to guarantee sub-millisecond PONG responses, the buffer's nextExpectedSeq tracker falls out of sync, causing a permanent deadlock on the next TOOL_RESULT. I solved this by advancing the buffer state for PINGs without triggering the UI callback, ensuring protocol compliance and state recovery remain perfectly decoupled.

I implemented ghost socket assassination in the WebSocketManager to prevent React Strict Mode's double-mounting behavior from creating abandoned sockets that trigger infinite reconnection loops against single-session backends.