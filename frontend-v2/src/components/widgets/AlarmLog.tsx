import { useEffect, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { websocketService } from '../../services/websocket'

interface Props {
  widget: any
  editable: boolean
  onRemove: () => void
}

interface Alarm {
  id: string
  channelId: string
  severity: string
  message: string
  timestamp: number
}

export default function AlarmLog({ widget, editable, onRemove }: Props) {
  const [alarms, setAlarms] = useState<Alarm[]>([])

  useEffect(() => {
    const unsubscribe = websocketService.subscribe('alarms', (alarm) => {
      setAlarms((prev) => [alarm, ...prev].slice(0, widget.config.maxItems || 10))
    })

    return unsubscribe
  }, [widget.config.maxItems])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10'
      case 'WARNING':
        return 'text-yellow-400 bg-yellow-500/10'
      default:
        return 'text-blue-400 bg-blue-500/10'
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="h-full p-4 flex flex-col">
      {editable && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded z-10"
        >
          <X size={16} className="text-white" />
        </button>
      )}

      <div className="text-sm text-gray-400 mb-2 flex items-center">
        <AlertTriangle size={16} className="mr-2" />
        {widget.config.title || 'Alarms'}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {alarms.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No alarms
          </div>
        ) : (
          alarms.map((alarm) => (
            <div
              key={alarm.id}
              className={`p-2 rounded text-sm ${getSeverityColor(alarm.severity)}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium">{alarm.severity}</span>
                <span className="text-xs opacity-75">{formatTime(alarm.timestamp)}</span>
              </div>
              <div className="text-xs mt-1 opacity-90">{alarm.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
