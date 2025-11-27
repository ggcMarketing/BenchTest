import { io, Socket } from 'socket.io-client';

export interface TagData {
  tagId: string;
  tagPath: string;
  value: number;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
  timestamp: number;
}

export interface AlarmData {
  tagPath: string;
  severity: string;
  message: string;
  timestamp: number;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private subscribers: Map<string, Set<(data: TagData) => void>> = new Map();
  private alarmCallbacks: Set<(alarm: AlarmData) => void> = new Set();

  connect(url: string = 'http://localhost:3001') {
    if (this.socket?.connected) {
      console.log('Already connected');
      return;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('tagUpdate', (data: TagData) => {
      this.notifySubscribers(data.tagId, data);
    });

    this.socket.on('alarm', (alarm: AlarmData) => {
      this.notifyAlarmCallbacks(alarm);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  subscribe(tagId: string, callback: (data: TagData) => void) {
    if (!this.subscribers.has(tagId)) {
      this.subscribers.set(tagId, new Set());
      this.socket?.emit('subscribe', { tagId });
    }
    this.subscribers.get(tagId)!.add(callback);
  }

  unsubscribe(tagId: string, callback: (data: TagData) => void) {
    const subs = this.subscribers.get(tagId);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscribers.delete(tagId);
        this.socket?.emit('unsubscribe', { tagId });
      }
    }
  }

  onAlarm(callback: (alarm: AlarmData) => void) {
    this.alarmCallbacks.add(callback);
  }

  offAlarm(callback: (alarm: AlarmData) => void) {
    this.alarmCallbacks.delete(callback);
  }

  private notifySubscribers(tagId: string, data: TagData) {
    this.subscribers.get(tagId)?.forEach(callback => callback(data));
  }

  private notifyAlarmCallbacks(alarm: AlarmData) {
    this.alarmCallbacks.forEach(callback => callback(alarm));
  }

  disconnect() {
    this.socket?.disconnect();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsClient = new WebSocketClient();
