import { create } from 'zustand';
import { DiffResult } from './workers/diffWorker';

interface ContextState {
  histories: Record<string, unknown[]>;
  currentIndex: Record<string, number>;
  currentDiff: Record<string, DiffResult | null>;
  addSnapshot: (contextId: string, data: unknown) => void;
  setHistoryIndex: (contextId: string, index: number) => void;
}

const worker = typeof window !== 'undefined' 
  ? new Worker(new URL('./workers/diffWorker.ts', import.meta.url)) 
  : null;

export const useContextStore = create<ContextState>((set) => {
  if (worker) {
    worker.onmessage = (event) => {
      const { type, contextId, diff, newData } = event.data;
      if (type === 'DIFF_COMPLETE') {
        set((state) => {
          const histories = { ...state.histories };
          const currentIdx = state.currentIndex[contextId] || 0;
          histories[contextId][currentIdx] = newData;
          return {
            histories,
            currentDiff: { ...state.currentDiff, [contextId]: diff },
          };
        });
      }
    };
  }

  return {
    histories: {},
    currentIndex: {},
    currentDiff: {},

    addSnapshot: (contextId: string, data: unknown) => {
      set((state) => {
        const existingHistory = state.histories[contextId] || [];
        const newHistory = [...existingHistory, data];
        const newIndex = newHistory.length - 1;

        if (worker && newHistory.length > 1) {
          worker.postMessage({
            oldData: newHistory[newIndex - 1],
            newData: data,
            contextId,
          });
        }

        return {
          histories: { ...state.histories, [contextId]: newHistory },
          currentIndex: { ...state.currentIndex, [contextId]: newIndex },
          currentDiff: { 
            ...state.currentDiff, 
            [contextId]: newHistory.length === 1 ? null : state.currentDiff[contextId] 
          },
        };
      });
    },

    setHistoryIndex: (contextId: string, index: number) => {
      set((state) => ({
        ...state,
        currentIndex: { ...state.currentIndex, [contextId]: index },
      }));
    },
  };
});