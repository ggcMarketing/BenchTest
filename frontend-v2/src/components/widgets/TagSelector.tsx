import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3000/api/v1'

interface Tag {
  id: string
  name: string
  protocol: string
  metadata?: {
    units?: string
    description?: string
  }
}

interface Props {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  multiple?: boolean
  label?: string
}

export default function TagSelector({ selectedTags, onChange, multiple = true, label = 'Select Tags' }: Props) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const response = await axios.get(`${API_URL}/io/channels`)
      setAvailableTags(response.data.channels || [])
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleTag = (tagId: string) => {
    if (multiple) {
      if (selectedTags.includes(tagId)) {
        onChange(selectedTags.filter((id) => id !== tagId))
      } else {
        onChange([...selectedTags, tagId])
      }
    } else {
      onChange([tagId])
      setShowDropdown(false)
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((id) => id !== tagId))
  }

  const getTagInfo = (tagId: string) => {
    return availableTags.find((t) => t.id === tagId)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-400">{label}</label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tagId) => {
            const tag = getTagInfo(tagId)
            return (
              <div
                key={tagId}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-sm"
              >
                <span className="text-blue-300">{tag?.name || tagId}</span>
                {tag?.metadata?.units && (
                  <span className="text-blue-400 text-xs">({tag.metadata.units})</span>
                )}
                <button
                  onClick={() => handleRemoveTag(tagId)}
                  className="p-0.5 hover:bg-blue-500/30 rounded"
                >
                  <X size={12} className="text-blue-300" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search tags..."
            className="flex-1 bg-transparent text-white text-sm outline-none"
          />
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-slate-700 border border-slate-600 rounded shadow-lg max-h-60 overflow-y-auto">
              {filteredTags.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>
              ) : (
                filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-3 py-2 hover:bg-slate-600 cursor-pointer ${
                      selectedTags.includes(tag.id) ? 'bg-blue-500/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white text-sm">{tag.name}</div>
                        <div className="text-xs text-gray-400">{tag.id}</div>
                      </div>
                      {tag.metadata?.units && (
                        <span className="text-xs text-gray-500">{tag.metadata.units}</span>
                      )}
                      {selectedTags.includes(tag.id) && (
                        <div className="ml-2 w-2 h-2 bg-blue-400 rounded-full" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {multiple ? 'Select one or more tags to display' : 'Select a tag to display'}
      </p>
    </div>
  )
}
