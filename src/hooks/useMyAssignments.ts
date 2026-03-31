import { useState, useEffect } from 'react'
import type { IAssignment } from '@/types/assignment'
import { getMyAssignments } from '@/services/assignments.service'

export function useMyAssignments() {
  const [assignments, setAssignments] = useState<IAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMyAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setIsLoading(false))
  }, [])

  return { assignments, isLoading }
}
