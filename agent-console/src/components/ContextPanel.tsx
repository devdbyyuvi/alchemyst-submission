"use client";
import { useContextStore } from "../lib/contextStore";
import { useState } from "react";

export default function ContextPanel() {
  const { histories, currentIndex, currentDiff, setHistoryIndex } =
    useContextStore();
  const contextIds = Object.keys(histories);

  if (contextIds.length === 0) {
    return (
      <div className="h-full p-4 bg-gray-950 border-l border-gray-800 text-gray-500 flex items-center justify-center text-sm">
        No context snapshots received yet.
      </div>
    );
  }

  const activeContextId = contextIds[0];
  const history = histories[activeContextId];
  const index = currentIndex[activeContextId] || 0;
  const diff = currentDiff[activeContextId];
  const currentData = history[index];

  return (
    <div className="h-full flex flex-col bg-gray-950 border-l border-gray-800 text-gray-300 w-[400px] min-w-[300px]">
      <div className="p-3 border-b border-gray-800 bg-gray-900">
        <h2 className="font-bold text-sm text-white mb-2">Context Inspector</h2>
        <div className="text-xs text-gray-500 mb-2 truncate">
          ID: {activeContextId}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-8">v{index + 1}</span>
          <input
            type="range"
            min={0}
            max={history.length - 1}
            value={index}
            onChange={(e) =>
              setHistoryIndex(activeContextId, parseInt(e.target.value))
            }
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-gray-400 w-8 text-right">
            v{history.length}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {currentData ? (
          <JsonTree data={currentData} diff={diff} path="" />
        ) : (
          <div className="text-gray-500 italic p-2">Computing diff...</div>
        )}
      </div>
    </div>
  );
}

type JsonDiff = {
  added?: Record<string, unknown>;
  removed?: Record<string, unknown>;
  changed?: Record<string, unknown>;
};

function JsonTree({
  data,
  diff,
  path,
}: {
  data: unknown;
  diff: JsonDiff | undefined;
  path: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (data === null || typeof data !== "object") {
    let color = "text-gray-300";
    if (typeof data === "string") color = "text-green-400";
    if (typeof data === "number") color = "text-blue-400";
    if (typeof data === "boolean") color = "text-purple-400";

    const isNew = diff?.added?.[path] !== undefined;
    const isRemoved = diff?.removed?.[path] !== undefined;
    const isChanged = diff?.changed?.[path] !== undefined;
    let bgClass = isNew
      ? "bg-green-900/30 text-green-300"
      : isRemoved
        ? "bg-red-900/30 text-red-300 line-through"
        : isChanged
          ? "bg-yellow-900/30 text-yellow-300"
          : "";

    return (
      <span className={`${color} ${bgClass} px-1 rounded`}>
        {typeof data === "string" ? `"${data}"` : String(data)}
      </span>
    );
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);
  const isNew = diff?.added?.[path] !== undefined;
  const isRemoved = diff?.removed?.[path] !== undefined;
  const isChanged = diff?.changed?.[path] !== undefined;
  let borderClass = isNew
    ? "border-green-500 bg-green-900/10"
    : isRemoved
      ? "border-red-500 bg-red-900/10"
      : isChanged
        ? "border-yellow-500 bg-yellow-900/10"
        : "border-gray-700";

  return (
    <div className={`ml-2 border-l-2 ${borderClass} pl-2`}>
      <div
        className="cursor-pointer hover:bg-gray-800/50 px-1 rounded flex items-center gap-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-gray-500 text-[10px]">
          {isExpanded ? "▼" : "▶"}
        </span>
        <span className="text-purple-400">
          {isArray ? `[${keys.length}]` : `{${keys.length}}`}
        </span>
        {isNew && (
          <span className="text-[10px] text-green-400 ml-1">+ NEW</span>
        )}
        {isRemoved && (
          <span className="text-[10px] text-red-400 ml-1">- REMOVED</span>
        )}
        {isChanged && (
          <span className="text-[10px] text-yellow-400 ml-1">~ CHANGED</span>
        )}
      </div>
      {isExpanded && (
        <div className="ml-4">
          {keys.map((key) => (
            <div key={key} className="flex">
              <span className="text-cyan-400 mr-2 shrink-0">"{key}":</span>
              <JsonTree
                data={(data as Record<string, unknown>)[key]}
                diff={diff}
                path={path ? `${path}.${key}` : key}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
