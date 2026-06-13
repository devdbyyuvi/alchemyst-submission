import { create } from "zustand";
import { ServerMessage } from "./types";
import { ChatBlock, TextBlock, ToolCallBlock } from "../types/ui";
import { useContextStore } from "../contextStore";

interface ChatState {
  blocks: ChatBlock[];
  addUserMessage: (text: string) => void;
  handleServerMessage: (msg: ServerMessage) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  blocks: [],

  addUserMessage: (text: string) => {
    const newBlock: ChatBlock = { id: crypto.randomUUID(), type: "user", text };
    set((state) => ({ blocks: [...state.blocks, newBlock] }));
  },

  handleServerMessage: (msg: ServerMessage) => {
    const currentBlocks = get().blocks;
    let newBlocks = [...currentBlocks];

    if (msg.type === "TOKEN") {
      const lastBlock = newBlocks[newBlocks.length - 1];
      if (
        lastBlock &&
        lastBlock.type === "text" &&
        lastBlock.stream_id === msg.stream_id &&
        lastBlock.status === "streaming"
      ) {
        newBlocks[newBlocks.length - 1] = {
          ...lastBlock,
          text: lastBlock.text + msg.text,
        };
      } else {
        newBlocks.push({
          id: crypto.randomUUID(),
          type: "text",
          stream_id: msg.stream_id,
          text: msg.text,
          status: "streaming",
        });
      }
    } else if (msg.type === "TOOL_CALL") {
      for (let i = newBlocks.length - 1; i >= 0; i--) {
        if (
          newBlocks[i].type === "text" &&
          (newBlocks[i] as TextBlock).stream_id === msg.stream_id
        ) {
          newBlocks[i] = { ...(newBlocks[i] as TextBlock), status: "paused" };
          break;
        }
      }
      newBlocks.push({
        id: crypto.randomUUID(),
        type: "tool_call",
        stream_id: msg.stream_id,
        call_id: msg.call_id,
        tool_name: msg.tool_name,
        args: msg.args,
        seq: msg.seq,
        status: "pending",
      });
    } else if (msg.type === "TOOL_RESULT") {
      const toolIndex = newBlocks.findIndex(
        (b) =>
          b.type === "tool_call" &&
          (b as ToolCallBlock).call_id === msg.call_id,
      );
      if (toolIndex !== -1) {
        newBlocks[toolIndex] = {
          ...(newBlocks[toolIndex] as ToolCallBlock),
          result: msg.result,
          status: "completed",
        };
      }
    } else if (msg.type === "STREAM_END") {
      newBlocks = newBlocks.map((block) =>
        block.type === "text" && block.stream_id === msg.stream_id
          ? { ...block, status: "complete" }
          : block,
      );
    } else if (msg.type === "CONTEXT_SNAPSHOT") {
      useContextStore.getState().addSnapshot(msg.context_id, msg.data);
    }

    set({ blocks: newBlocks });
  },
}));
