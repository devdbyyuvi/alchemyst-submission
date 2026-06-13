import { create } from 'zustand';

interface UIState {
  activeChatBlockId: string | null; 
  activeTimelineEventSeq: number | null; 

  setActiveChatBlockId: (id: string | null) => void;
  setActiveTimelineEventSeq: (seq: number | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeChatBlockId: null,
  activeTimelineEventSeq: null,
  setActiveChatBlockId: (id) => set({ activeChatBlockId: id }),
  setActiveTimelineEventSeq: (seq) => set({ activeTimelineEventSeq: seq }),
}));
