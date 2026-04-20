import { useMyAssignmentsQuery } from '@/hooks/queries'

export function useMyAssignments() {
  const { data, isLoading } = useMyAssignmentsQuery()
  return { assignments: data ?? [], isLoading }
}
