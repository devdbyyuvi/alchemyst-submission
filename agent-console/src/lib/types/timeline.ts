export type TimelineEventType =
  | "TOKEN_BATCH"
  | "TOOL_CALL"
  | "TOOL_RESULT"
  | "CONTEXT_SNAPSHOT"
  | "PING"
  | "PONG"
  | "ERROR"
  | "STREAM_END";

export interface BaseTimelineEvent {
  id: string;
  seq: number;
  timestamp: number;
}

export interface TokenBatchEvent extends BaseTimelineEvent {
  type: "TOKEN_BATCH";
  stream_id: string;
  tokenCount: number;
  text: string;
  durationMs: number;
}

export interface ToolCallEvent extends BaseTimelineEvent {
  type: "TOOL_CALL";
  call_id: string;
  tool_name: string;
}

export interface ToolResultEvent extends BaseTimelineEvent {
  type: "TOOL_RESULT";
  call_id: string;
}

export interface ContextSnapshotEvent extends BaseTimelineEvent {
  type: "CONTEXT_SNAPSHOT";
  context_id: string;
}

export interface PingEvent extends BaseTimelineEvent {
  type: "PING";
}

export interface StreamEndEvent extends BaseTimelineEvent {
  type: "STREAM_END";
  stream_id: string;
}

export interface ErrorEvent extends BaseTimelineEvent {
  type: "ERROR";
  code: string;
  message: string;
}

export type TimelineEvent =
  | TokenBatchEvent
  | ToolCallEvent
  | ToolResultEvent
  | ContextSnapshotEvent
  | PingEvent
  | StreamEndEvent
  | ErrorEvent;
