export type BlockType = 'user' | 'text' | 'tool_call';

export interface TextBlock {
  id: string;
  type: 'text';
  stream_id: string;
  text: string;
  status: 'streaming' | 'paused' | 'complete';
}

export interface ToolCallBlock {
  id: string;
  type: 'tool_call';
  seq : number;
  stream_id: string;
  call_id: string;
  tool_name: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: 'pending' | 'completed' | 'error'; 
}

export interface UserBlock {
  id: string;
  type: 'user';
  text: string;
}

export type ChatBlock = UserBlock | TextBlock | ToolCallBlock;
