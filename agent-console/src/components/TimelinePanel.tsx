'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTimelineStore } from '../lib/protocol/TimelineStore';
import { useUIStore } from '../lib/uiStore';
import { TimelineRow } from './TimelineRow';

export default function TimelinePanel() {
  const events = useTimelineStore((state) => state.events);
  const activeTimelineEventSeq = useUIStore((state) => state.activeTimelineEventSeq);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filterType !== 'ALL' && event.type !== filterType) return false;
      if (searchText) {
        const stringified = JSON.stringify(event).toLowerCase();
        if (!stringified.includes(searchText.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, filterType, searchText]);

  const rowVirtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, 
    overscan: 10,
  });

  useEffect(() => {
    if (isAtBottom && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [events, isAtBottom]);

  const handleScroll = () => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  useEffect(() => {
    if (activeTimelineEventSeq !== null) {
      const index = filteredEvents.findIndex(e => e.seq === activeTimelineEventSeq);
      if (index !== -1) {
        rowVirtualizer.scrollToIndex(index, { align: 'center' });
      }
      useUIStore.getState().setActiveTimelineEventSeq(null);
    }
  }, [activeTimelineEventSeq, filteredEvents, rowVirtualizer]);

  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-gray-800 text-gray-300 w-[400px] min-w-[300px]">
      <div className="p-3 border-b border-gray-800 flex flex-col gap-2 bg-gray-900">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-sm text-white">Agent Trace Timeline</h2>
          <span className="text-[10px] text-gray-500">{events.length} events</span>
        </div>
        <div className="flex gap-2">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 text-xs p-1.5 rounded border border-gray-700 focus:outline-none"
          >
            <option value="ALL">All Events</option>
            <option value="TOKEN_BATCH">Tokens</option>
            <option value="TOOL_CALL">Tool Calls</option>
            <option value="TOOL_RESULT">Results</option>
            <option value="CONTEXT_SNAPSHOT">Context</option>
            <option value="PING">Heartbeats</option>
          </select>
          <input 
            type="text" 
            placeholder="Search events..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-gray-800 text-xs p-1.5 rounded border border-gray-700 flex-1 focus:outline-none"
          />
        </div>
      </div>

      <div 
        ref={parentRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const event = filteredEvents[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement} 
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TimelineRow event={event} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}