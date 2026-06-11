import { useState } from 'react'
import { toggleSafeZone, deleteLocation, getCumulativeElevation } from '../hooks/useLocations'
import Badge from './ui/Badge'
import Button from './ui/Button'
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const TYPE_VARIANTS = {
  block: 'brand',
  floor: 'warning',
  room:  'neutral',
}

const TYPE_INDENT = {
  block: 'ml-0',
  floor: 'ml-4 md:ml-8',
  room:  'ml-8 md:ml-16',
}

export default function LocationTreeNode({ node, flatList, onReload, onAddChild, canEdit }) {
  const [expanded, setExpanded] = useState(true)
  const cumulative = getCumulativeElevation(node, flatList)
  const hasChildren = node.children && node.children.length > 0

  const handleToggleSafeZone = async () => {
    try {
      await toggleSafeZone(node.location_id, node.is_safe_zone)
      onReload()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (hasChildren) {
      alert('Cannot delete — this node has children. Remove children first.')
      return
    }
    if (!confirm(`Delete "${node.location_name}"?`)) return
    try {
      await deleteLocation(node.location_id)
      onReload()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div className={`${TYPE_INDENT[node.location_type] || 'ml-0'} mb-3`}>
      <div className={`p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md ${node.is_safe_zone ? 'border-teal-200 bg-teal-50/30' : ''}`}>

        {/* Top row — expand toggle + name + type badge */}
        <div className="flex items-start gap-3">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 p-1 hover:bg-slate-100 rounded-lg transition-colors mt-0.5 flex-shrink-0"
            >
              {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            {/* Name + badges row */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-slate-800">{node.location_name}</span>
              <Badge variant={TYPE_VARIANTS[node.location_type]}>
                {node.location_type}
              </Badge>
              {node.is_safe_zone && (
                <Badge variant="active" icon={ShieldCheckIcon}>
                  Safe Zone
                </Badge>
              )}
            </div>

            {/* Elevation info */}
            <div className="text-[11px] mt-1.5 text-slate-500 font-medium flex items-center gap-2">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Offset: +{node.elevation_offset}cm</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-teal-600 font-bold">Absolute: {cumulative}cm</span>
            </div>

            {/* Action buttons */}
            {canEdit && (
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-50">
                {node.location_type !== 'room' && (
                  <Button
                    onClick={() => onAddChild(node)}
                    variant="secondary"
                    className="h-8 px-3 text-[11px] font-bold"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    {node.location_type === 'block' ? 'Add Floor' : 'Add Room'}
                  </Button>
                )}
                <Button
                  onClick={handleToggleSafeZone}
                  variant={node.is_safe_zone ? 'primary' : 'secondary'}
                  className={`h-8 px-3 text-[11px] font-bold ${node.is_safe_zone ? 'bg-teal-600 text-white' : ''}`}
                >
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  {node.is_safe_zone ? 'Safe' : 'Set Safe'}
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="danger"
                  className="h-8 px-3 text-[11px] font-bold"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="mt-2 space-y-1">
          {node.children.map(child => (
            <LocationTreeNode
              key={child.location_id}
              node={child}
              flatList={flatList}
              onReload={onReload}
              onAddChild={onAddChild}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
