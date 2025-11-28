import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_DATA_ROUTER_URL || 'http://localhost:3001'

class WebSocketService {
  private socket: Socket | null = null
  private subscribers: Map<string, Set<(data: any) => void>> = new Map()

  connect() {
    if (this.socket?.connected) return

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      // Resubscribe to all channels
      const channels = Array.from(this.subscribers.keys())
      if (channels.length > 0) {
        this.socket?.emit('subscribe', { channels })
      }
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    this.socket.on('channelUpdate', (data: any) => {
      const callbacks = this.subscribers.get(data.channelId)
      if (callbacks) {
        callbacks.forEach((callback) => callback(data))
      }
    })

    this.socket.on('alarm', (data: any) => {
      const callbacks = this.subscribers.get('alarms')
      if (callbacks) {
        callbacks.forEach((callback) => callback(data))
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  subscribe(channelId: string, callback: (data: any) => void) {
    if (!this.subscribers.has(channelId)) {
      this.subscribers.set(channelId, new Set())
    }
    this.subscribers.get(channelId)!.add(callback)

    // Subscribe via WebSocket
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { channels: [channelId] })
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(channelId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(channelId)
          if (this.socket?.connected) {
            this.socket.emit('unsubscribe', { channels: [channelId] })
          }
        }
      }
    }
  }
}

export const websocketService = new WebSocketService()
