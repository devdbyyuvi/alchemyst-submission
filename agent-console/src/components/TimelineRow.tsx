"use client";

import { useState } from "react";
import { TimelineEvent, TokenBatchEvent } from "../lib/types/timeline";
import { useUIStore } from "../lib/uiStore";

interface TimelineRowProps {
  event: TimelineEvent;
}

export function TimelineRow({ event }: TimelineRowProps) {
  const setActiveChatBlockId = useUIStore(
    (state) => state.setActiveChatBlockId,
  );

  const baseClasses =
    "px-3 py-2 border-b border-gray-800 text-xs font-mono hover:bg-gray-800/50 transition-colors";

  const time = new Date(event.timestamp).toLocaleTimeString();

  if (event.type === "TOKEN_BATCH") {
    return (
      <TokenBatchRow event={event} baseClasses={baseClasses} time={time} />
    );
  }

  if (event.type === "TOOL_CALL") {
    return (
      <div
        className={`${baseClasses} border-l-4 border-blue-500 bg-blue-900/10`}
        onClick={() => setActiveChatBlockId(event.call_id)}
      >
        <div className="flex justify-between text-blue-400 font-bold">
          <span>{event.tool_name}</span>
          <span className="text-gray-500">
            {time} (seq: {event.seq})
          </span>
        </div>
        <div className="text-gray-400 mt-1">Call ID: {event.call_id}</div>
      </div>
    );
  }

  if (event.type === "TOOL_RESULT") {
    return (
      <div
        className={`${baseClasses} border-l-4 border-green-500 bg-green-900/10 pl-6`}
      >
        <div className="flex justify-between text-green-400 font-bold">
          <span>{`>>`} Result</span>
          <span className="text-gray-500">
            {time} (seq: {event.seq})
          </span>
        </div>
        <div className="text-gray-400 mt-1">Call ID: {event.call_id}</div>
      </div>
    );
  }

  if (event.type === "CONTEXT_SNAPSHOT") {
    return (
      <div className={`${baseClasses} bg-purple-900/10 text-purple-300`}>
        <span className="font-bold">{`>>`} Context Snapshot</span>
        <span className="ml-2 text-gray-500">
          ID: {event.context_id} (seq: {event.seq})
        </span>
      </div>
    );
  }

  if (event.type === "PING") {
    return (
      <div className={`${baseClasses} text-gray-600 italic`}>
        {`>>`} Heartbeat (seq: {event.seq}) - {time}
      </div>
    );
  }

  if (event.type === "STREAM_END") {
    return (
      <div
        className={`${baseClasses} bg-gray-800 text-center font-bold text-gray-400`}
      >
        --- Stream Ended (seq: {event.seq}) ---
      </div>
    );
  }

  if (event.type === "ERROR") {
    return (
      <div className={`${baseClasses} bg-red-900/20 text-red-400 font-bold`}>
        ERROR [{event.code}]: {event.message} (seq: {event.seq})
      </div>
    );
  }

  return null;
}

function TokenBatchRow({
  event,
  baseClasses,
  time,
}: {
  event: TokenBatchEvent;
  baseClasses: string;
  time: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`${baseClasses} cursor-pointer`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-center text-cyan-400">
        <span className="font-bold">
          {isExpanded ? "v" : ">"} Streamed {event.tokenCount} tokens
        </span>
        <span className="text-gray-500 text-[10px]">
          {event.durationMs}ms (seq: {event.seq})
        </span>
      </div>

      {isExpanded && (
        <>
          <div className="mt-2 p-2 bg-black/40 rounded text-gray-300 whitespace-pre-wrap break-all">
            {event.text}
          </div>
          <div className="mt-2 p-2 bg-black/40 rounded text-gray-300 whitespace-pre-wrap break-all">
            {time}
          </div>
        </>
      )}
    </div>
  );
}
