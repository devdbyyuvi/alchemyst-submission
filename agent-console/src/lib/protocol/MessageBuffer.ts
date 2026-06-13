import { ServerMessage } from "./types";

export class MessageBuffer {
  private buffer: Map<number, ServerMessage> = new Map();
  private nextExpectedSeq: number;

  constructor(initialSeq: number = 1) {
    this.nextExpectedSeq = initialSeq;
  }
  public add(msg: ServerMessage): void {
    if (msg.seq < this.nextExpectedSeq) {
      // already processed, hence we ignore
      console.log(
        `Ignoring old message with seq ${msg.seq}, expected was ${this.nextExpectedSeq}`,
      );
      return;
    }
    if (this.buffer.has(msg.seq)) {
      // duplicate, ignore
      console.log(`Ignoring duplicate message with seq ${msg.seq}`);
      return;
    }
    this.buffer.set(msg.seq, msg);
  }
  public flush(): ServerMessage[] {
    const output: ServerMessage[] = [];
    while (this.buffer.has(this.nextExpectedSeq)) {
      const msg = this.buffer.get(this.nextExpectedSeq)!;
      output.push(msg);
      this.buffer.delete(this.nextExpectedSeq);

      this.nextExpectedSeq++;
    }
    return output;
  }
  public getLastProcessedSeq(): number {
    return this.nextExpectedSeq - 1;
  }
}
