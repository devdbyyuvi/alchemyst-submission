import { wsManager } from './protocol/WebSocketManager';
import { useChatStore } from './protocol/ChatStore';
import { useTimelineStore } from './protocol/TimelineStore';

export function initApp() {
    wsManager.setOnMessage((msg) => {
        useChatStore.getState().handleServerMessage(msg);
    });

    wsManager.setOnProtocolEvent((msg) => {
        useTimelineStore.getState().handleProtocolEvent(msg);
    });

    wsManager.connect('ws://localhost:4747/ws');
}