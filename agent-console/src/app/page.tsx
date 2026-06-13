'use client';

import { useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import TimelinePanel from '../components/TimelinePanel';
import ContextPanel from '../components/ContextPanel';
import { initApp } from '../lib/setup';

const globalForInit = globalThis as unknown as { isInitialized: boolean | undefined };
let isInitialized = globalForInit.isInitialized ?? false;

export default function Home() {
  useEffect(() => {
    if (!isInitialized) {
      initApp();
      isInitialized = true;
      globalForInit.isInitialized = true;
    }
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-900">
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow />
      </div>
      <div className="flex border-r border-gray-800">
        <TimelinePanel />
      </div>
      <ContextPanel />
    </div>
  );
}