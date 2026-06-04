import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export async function fetchLocations(schoolId) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('school_id', schoolId)
    .order('location_id', { ascending: true })
  if (error) throw error
  return data
}

export function buildTree(flatList) {
  const map = {}
  const roots = []
  flatList.forEach(node => {
    map[node.location_id] = { ...node, children: [] }
  })
  flatList.forEach(node => {
    if (!node.parent_location_id) {
      roots.push(map[node.location_id])
    } else if (map[node.parent_location_id]) {
      map[node.parent_location_id].children.push(map[node.location_id])
    }
  })
  return roots
}

export function getCumulativeElevation(node, flatList) {
  let total = Number(node.elevation_offset) || 0
  let current = node
  while (current.parent_location_id) {
    const parent = flatList.find(n => n.location_id === current.parent_location_id)
    if (!parent) break
    total += Number(parent.elevation_offset) || 0
    current = parent
  }
  return total
}

export async function addLocation({ location_name, location_type, elevation_offset, parent_location_id, is_safe_zone, school_id }) {
  const { data, error } = await supabase
    .from('locations')
    .insert([{ location_name, location_type, elevation_offset, parent_location_id: parent_location_id || null, is_safe_zone: is_safe_zone || false, school_id }])
    .select()
  if (error) throw error
  return data[0]
}

export async function toggleSafeZone(locationId, currentValue) {
  const { data, error } = await supabase
    .from('locations')
    .update({ is_safe_zone: !currentValue })
    .eq('location_id', locationId)
    .select()
  if (error) throw error
  return data[0]
}

export async function deleteLocation(locationId) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('location_id', locationId)
  if (error) throw error
}

export function useLocations(schoolId) {
  const [locations, setLocations] = useState([])
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    if (!schoolId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchLocations(schoolId)
      setLocations(data)
      setTree(buildTree(data))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [schoolId])

  return { locations, tree, loading, error, reload: load }
}
