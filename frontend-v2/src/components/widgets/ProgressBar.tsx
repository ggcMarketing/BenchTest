import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { websocketService } from '../../services/websocket'

interface Props {
  widget: any
  editable: boolean
  onRemove: () => void
}

export default function ProgressBar({ widget, editable, onRemove }: Props) {
  const [value, setValue] = useState<number>(0)

  useEffect(() => {
    if (!widget.config.channel) return

    const unsubscribe = websocketService.subscribe(
      widget.config.channel,
      (data) => {
        setValue(data.value)
      }
    )

    return unsubscribe
  }, [widget.config.channel])

  const min = widget.config.min || 0
  const max = widget.config.max || 100
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

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
        {widget.config.title || 'Progress'}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-full bg-slate-700 rounded-full h-8 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300 flex items-center justify-center"
            style={{ width: `${percentage}%` }}
          >
            <span className="text-white text-sm font-medium">
              {value.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  )
}
