import type { IVaProfile, UpdateVaProfilePayload } from '@/types/va-profile';

/**
 * TODO: ats-crm-backend does not have a standalone /va-profiles resource.
 * VA workload/risk data should be stored on the Candidate model or a
 * dedicated CRM sub-resource. Wire this up once the data model is settled.
 */

export async function getVaProfiles(): Promise<IVaProfile[]> {
  return [];
}

export async function updateVaProfile(
  _id: string,
  _payload: UpdateVaProfilePayload
): Promise<IVaProfile> {
  throw new Error('Not implemented — VA profile updates not yet supported');
}
