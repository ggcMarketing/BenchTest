import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { websocketService } from '../../services/websocket'

interface Props {
  widget: any
  editable: boolean
  onRemove: () => void
}

export default function ValueCard({ widget, editable, onRemove }: Props) {
  const [value, setValue] = useState<number | null>(null)
  const [quality, setQuality] = useState('UNKNOWN')

  useEffect(() => {
    if (!widget.config.channel) return

    const unsubscribe = websocketService.subscribe(
      widget.config.channel,
      (data) => {
        setValue(data.value)
        setQuality(data.quality)
      }
    )

    return unsubscribe
  }, [widget.config.channel])

  const formatValue = (val: number | null) => {
    if (val === null) return '--'
    return val.toFixed(widget.config.decimals || 2)
  }

  const getQualityColor = () => {
    switch (quality) {
      case 'GOOD':
        return 'text-green-400'
      case 'BAD':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="h-full p-4 flex flex-col">
      {editable && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded"
        >
          <X size={16} className="text-white" />
        </button>
      )}

      <div className="text-sm text-gray-400 mb-2">
        {widget.config.title || 'Value'}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getQualityColor()}`}>
            {formatValue(value)}
          </div>
          {widget.config.units && (
            <div className="text-sm text-gray-500 mt-1">
              {widget.config.units}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        {widget.config.channel || 'No channel'}
      </div>
    </div>
  )
}
