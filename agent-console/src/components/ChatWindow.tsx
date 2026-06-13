'use client';
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../lib/protocol/ChatStore';
import { useUIStore } from '../lib/uiStore';
import { wsManager } from '../lib/protocol/WebSocketManager';
import {ConnectionStatus} from "../lib/protocol/types"
export default function ChatWindow() {
  const blocks = useChatStore((state) => state.blocks);
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const activeChatBlockId = useUIStore((state) => state.activeChatBlockId);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    wsManager.setOnStatusChange(setConnectionStatus);
  }, []);

  useEffect(() => {
    if (activeChatBlockId && chatContainerRef.current) {
      const element = chatContainerRef.current.querySelector(`[data-block-id="${activeChatBlockId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-yellow-400');
        setTimeout(() => element.classList.remove('ring-2', 'ring-yellow-400'), 2000);
      }
      useUIStore.getState().setActiveChatBlockId(null);
    }
  }, [activeChatBlockId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [blocks]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    addUserMessage(inputText);
    wsManager.StartNewTurn(); 
    wsManager.send({ type: 'USER_MESSAGE', content: inputText });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white relative">
      {connectionStatus === 'reconnecting' && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-600 text-white text-xs font-bold text-center py-1 z-50 animate-pulse">
          Connection dropped. Reconnecting...
        </div>
      )}
      
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {blocks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Send a message. Try: {`"summarize the report" or "show me the full database schema"`}
          </div>
        )}
        {blocks.map((block) => {
          if (block.type === 'user') return <div key={block.id} className="bg-blue-600 p-3 rounded-lg self-end max-w-md shadow-lg">{block.text}</div>;
          if (block.type === 'text') return (
            <div key={block.id} className="bg-gray-800 p-3 rounded-lg self-start max-w-2xl whitespace-pre-wrap shadow-lg">
              {block.text}{block.status === 'streaming' && <span className="animate-pulse ml-1 text-blue-400">▋</span>}
            </div>
          );
          if (block.type === 'tool_call') return (
            <div 
              key={block.id} data-block-id={block.call_id}
              onClick={() => useUIStore.getState().setActiveTimelineEventSeq(block.seq)}
              className="border border-yellow-500/50 p-3 rounded-lg self-start max-w-2xl bg-gray-800/50 shadow-lg cursor-pointer hover:border-yellow-400 transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-yellow-400">🛠️ Calling: {block.tool_name}</div>
                <div className="text-[10px] text-gray-500">{block.status === 'pending' ? '⏳ Waiting...' : '✅ Done'}</div>
              </div>
              <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto text-gray-300">{JSON.stringify(block.args, null, 2)}</pre>
              {block.status === 'completed' && block.result && (
                <div className="mt-3 border-t border-yellow-500/30 pt-2">
                  <div className="font-bold text-green-400 mb-1 text-sm">Result:</div>
                  <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto text-gray-300">{JSON.stringify(block.result, null, 2)}</pre>
                </div>
              )}
            </div>
          );
          return null;
        })}
      </div>
      
      <div className="p-4 border-t border-gray-700 bg-gray-950">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder='Try "summarize the report" or "analyze the correlation"...'
            className="flex-1 bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleSend} className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 font-bold transition-colors">Send</button>
        </div>
      </div>
    </div>
  );
}
