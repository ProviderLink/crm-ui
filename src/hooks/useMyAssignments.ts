import { useMyAssignmentsQuery } from '@/hooks/queries'

export function useMyAssignments() {
  const { data, isLoading, isError } = useMyAssignmentsQuery()
  return { assignments: data ?? [], isLoading, isError }
}
