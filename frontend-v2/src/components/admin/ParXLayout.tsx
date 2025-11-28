import { useState } from 'react'
import ModuleTree from './ModuleTree/ModuleTree'
import ConfigurationPanel from './ConfigurationPanel/ConfigurationPanel'

export default function ParXLayout() {
  const [selectedModule, setSelectedModule] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<'interface' | 'connection' | 'channel' | null>(null)

  return (
    <div className="flex h-full bg-slate-900">
      {/* Left Pane: Module Tree */}
      <div className="w-80 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">ParX I/O Configuration</h1>
          <p className="text-sm text-gray-400 mt-1">Module Explorer</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <ModuleTree 
            onSelect={(module, type) => {
              setSelectedModule(module)
              setSelectedType(type)
            }}
            selectedId={selectedModule?.id}
          />
        </div>
      </div>

      {/* Right Pane: Configuration Panel */}
      <div className="flex-1 flex flex-col">
        {selectedModule ? (
          <ConfigurationPanel 
            module={selectedModule}
            moduleType={selectedType}
            onUpdate={() => {
              // Trigger tree refresh
              setSelectedModule({ ...selectedModule })
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📡</div>
              <h2 className="text-xl font-semibold text-gray-400 mb-2">
                No Module Selected
              </h2>
              <p className="text-gray-500">
                Select a module from the tree to configure
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
