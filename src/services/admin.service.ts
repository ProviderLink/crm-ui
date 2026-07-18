import api from '@/lib/api';

/** Matches the ats-crm-backend /crm/dashboard response shape. */
export interface IDashboardStats {
  overview: {
    totalAssignments: number;
    activeAssignments: number;
    onHoldAssignments: number;
    endedAssignments: number;
    totalEodSubmissionsToday: number;
    totalWorkEntriesToday: number;
    missingEodsToday: number;
  };
  eodCompliance: {
    totalActive: number;
    submittedToday: number;
    missingToday: number;
    complianceRate: number;
  };
  assignmentHealth: {
    active: number;
    on_hold: number;
    ended: number;
  };
  weeklyWorkHours: {
    totalMinutes: number;
    totalHours: number;
    entriesCount: number;
  };
}

export async function getDashboardStats(): Promise<IDashboardStats> {
  const { data } = await api.get<{ data: IDashboardStats }>('/crm/dashboard');
  return data.data;
}
