import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { websocketService } from '../../services/websocket'

interface Props {
  widget: any
  editable: boolean
  onRemove: () => void
}

interface DataPoint {
  timestamp: number
  [key: string]: number
}

export default function TrendGraph({ widget, editable, onRemove }: Props) {
  const [data, setData] = useState<DataPoint[]>([])
  const maxPoints = 100

  useEffect(() => {
    const channels = widget.config.channels || []
    if (channels.length === 0) return

    const unsubscribers = channels.map((channel: string) =>
      websocketService.subscribe(channel, (update) => {
        setData((prev) => {
          const newData = [
            ...prev,
            {
              timestamp: update.timestamp,
              [channel]: update.value,
            },
          ].slice(-maxPoints)
          return newData
        })
      })
    )

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [widget.config.channels])

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

      <div className="text-sm text-gray-400 mb-2">
        {widget.config.title || 'Trend'}
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '4px',
              }}
              labelFormatter={formatTime}
            />
            <Legend />
            {(widget.config.channels || []).map((channel: string, index: number) => (
              <Line
                key={channel}
                type="monotone"
                dataKey={channel}
                stroke={`hsl(${index * 60}, 70%, 50%)`}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
