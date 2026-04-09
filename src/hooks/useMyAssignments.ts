import { getMyAssignments } from '@/services/assignments.service'
import type { IAssignment } from '@/types/assignment'
import { useEffect, useState } from 'react'

export function useMyAssignments() {
  const [assignments, setAssignments] = useState<IAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMyAssignments()
      .then(data => setAssignments(data.filter(a => a.status === 'active')))
      .catch(() => setAssignments([]))
      .finally(() => setIsLoading(false))
  }, [])

  return { assignments, isLoading }
}
