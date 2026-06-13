import { create } from "zustand";
import { ServerMessage } from "./types";
import { TimelineEvent, TokenBatchEvent } from "../types/timeline";

interface TimelineState {
  events: TimelineEvent[];
  currentBatchStartTime: number | null;
  handleProtocolEvent: (msg: ServerMessage) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  currentBatchStartTime: null,

  handleProtocolEvent: (msg: ServerMessage) => {
    const currentEvents = get().events;
    const newEvents = [...currentEvents];
    let batchStartTime = get().currentBatchStartTime;

    if (msg.type === "TOKEN") {
      const lastEvent = newEvents[newEvents.length - 1];

      if (
        lastEvent &&
        lastEvent.type === "TOKEN_BATCH" &&
        lastEvent.stream_id === msg.stream_id
      ) {
        const updatedBatch: TokenBatchEvent = {
          ...lastEvent,
          text: lastEvent.text + msg.text,
          tokenCount: lastEvent.tokenCount + 1,
          durationMs: batchStartTime ? Date.now() - batchStartTime : 0,
        };

        newEvents[newEvents.length - 1] = updatedBatch;
      } else {
        const newBatch: TokenBatchEvent = {
          id: crypto.randomUUID(),
          seq: msg.seq,
          timestamp: Date.now(),
          type: "TOKEN_BATCH",
          stream_id: msg.stream_id,
          tokenCount: 1,
          text: msg.text,
          durationMs: 0,
        };
        newEvents.push(newBatch);

        batchStartTime = Date.now();
      }
    } else {
      batchStartTime = null;

      let newEvent: TimelineEvent | null = null;
      const baseEvent = {
        id: crypto.randomUUID(),
        seq: msg.seq,
        timestamp: Date.now(),
      };

      if (msg.type === "TOOL_CALL") {
        newEvent = {
          ...baseEvent,
          type: "TOOL_CALL",
          call_id: msg.call_id,
          tool_name: msg.tool_name,
        };
      } else if (msg.type === "TOOL_RESULT") {
        newEvent = { ...baseEvent, type: "TOOL_RESULT", call_id: msg.call_id };
      } else if (msg.type === "CONTEXT_SNAPSHOT") {
        newEvent = {
          ...baseEvent,
          type: "CONTEXT_SNAPSHOT",
          context_id: msg.context_id,
        };
      } else if (msg.type === "PING") {
        newEvent = { ...baseEvent, type: "PING" };
      } else if (msg.type === "STREAM_END") {
        newEvent = {
          ...baseEvent,
          type: "STREAM_END",
          stream_id: msg.stream_id,
        };
      } else if (msg.type === "ERROR") {
        newEvent = {
          ...baseEvent,
          type: "ERROR",
          code: msg.code,
          message: msg.message,
        };
      }

      if (newEvent) {
        newEvents.push(newEvent);
      }
    }

    set({ events: newEvents, currentBatchStartTime: batchStartTime });
  },
}));
