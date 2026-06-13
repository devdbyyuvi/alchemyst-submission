import { ClientMessage, ServerMessage, ConnectionStatus } from "./types";
import { MessageBuffer } from "./MessageBuffer";

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private buffer: MessageBuffer = new MessageBuffer();
  private onMessageCallback: ((msg: ServerMessage) => void) | null = null;
  private status: ConnectionStatus = "disconnected";
  private onStatusChange: ((status: ConnectionStatus) => void) | null = null;
  private retryCount: number = 0;
  private url: string = "";
  private onProtocolEvent: ((msg: ServerMessage) => void) | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  public setOnProtocolEvent(cb: (msg: ServerMessage) => void): void {
    this.onProtocolEvent = cb;
  }
  public setOnMessage(cb: (msg: ServerMessage) => void): void {
    this.onMessageCallback = cb;
  }
  public setOnStatusChange(cb: (status: ConnectionStatus) => void): void {
    this.onStatusChange = cb;
  }

  public connect(url: string): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (this.ws) {
      this.ws.onclose = null; 
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.ws = new WebSocket(url);
    this.url = url;

    this.ws.onopen = () => {
      this.status = "connected";
      if (this.onStatusChange) this.onStatusChange(this.status);
      this.retryCount = 0;

      if (this.buffer.getLastProcessedSeq() > 0) {
        this.send({
          type: "RESUME",
          last_seq: this.buffer.getLastProcessedSeq(),
        });
      }
      console.log("WebSocket connected");
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      let parsedMsg: ServerMessage;
      try {
        parsedMsg = JSON.parse(msg.data) as ServerMessage;
      } catch (e) {
        console.error("Failed to parse message", msg.data);
        return;
      }

      if (this.onProtocolEvent) {
        this.onProtocolEvent(parsedMsg);
      }

      if (parsedMsg.type === "PING") {
        if (parsedMsg.challenge) {
          this.send({ type: "PONG", echo: parsedMsg.challenge });
        }
        this.buffer.add(parsedMsg);
        this.buffer.flush();
        return;
      }

      if (parsedMsg.type === "TOOL_CALL") {
        this.send({ type: "TOOL_ACK", call_id: parsedMsg.call_id });
      }

      this.buffer.add(parsedMsg);
      const readyMessages = this.buffer.flush();

      for (const readyMsg of readyMessages) {
        if (this.onMessageCallback) {
          this.onMessageCallback(readyMsg);
        }
      }
    };

    this.ws.onclose = (event) => {
      console.log("WS closed", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      this.status = "reconnecting";
      this.retryCount++;

      if (this.onStatusChange) {
        this.onStatusChange(this.status);
      }

      const delay = Math.min(500 * Math.pow(2, this.retryCount), 10000);

      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.url);
      }, delay);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  }

  public send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      let parsedMsg: string;
      try {
        parsedMsg = JSON.stringify(message);
        this.ws.send(parsedMsg);
      } catch (e) {
        console.error("Failed to send message", message, "\n Error:", e);
      }
    }
  }

  public StartNewTurn(): void {
    this.buffer = new MessageBuffer();
  }
}

const globalForWs = globalThis as unknown as {
  wsManager: WebSocketManager | undefined;
};
export const wsManager: WebSocketManager =
  globalForWs.wsManager ?? new WebSocketManager();

if (process.env.NODE_ENV !== "production") {
  globalForWs.wsManager = wsManager;
}
