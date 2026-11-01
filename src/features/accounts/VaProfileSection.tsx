import { useRole } from '@/hooks/use-role';
import { NotesThread } from '@/features/notes/NotesThread';
import { QK, useVaAssignmentsQuery, useVaProfileQuery } from '@/hooks/queries';
import { updateVaProfile } from '@/services/va-profiles.service';
import type { UpdateVaProfilePayload } from '@/types/va-profile';

import { ProfileHeader, ProfileStats } from './profile/parts';
import { useProfileEditor } from './profile/use-profile-editor';
import { VaAssignmentList } from './profile/VaAssignmentList';
import { VaProfileForm } from './profile/VaProfileForm';
import { VaProfileView } from './profile/VaProfileView';

/** A VA's CRM profile in the account sheet: view, edit, notes and assignments. */
export function VaProfileSection({
  vaId,
}: {
  vaId: string | null | undefined;
}) {
  const { isStaff: canEdit } = useRole();

  const { data: profile, isLoading: profileLoading } = useVaProfileQuery(vaId);
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useVaAssignmentsQuery(vaId);

  const editor = useProfileEditor<UpdateVaProfilePayload>({
    source: profile,
    mutationFn: payload => updateVaProfile(vaId!, payload),
    // The Accounts table enriches its rows from the list too.
    invalidate: [QK.vaProfile(vaId), QK.vaProfilesList],
  });

  if (!vaId) {
    return (
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground italic">
          This VA account is not yet linked to an ATS candidate record.
        </p>
      </div>
    );
  }

  if (profileLoading || assignmentsLoading) {
    return (
      <div className="space-y-3 border-t border-border pt-6">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-xl bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ProfileStats
        items={[
          {
            label: 'Active Clients',
            value: assignments.filter(a => a.status === 'active').length,
          },
          { label: 'Total Assignments', value: assignments.length },
          {
            label: 'Satisfaction',
            value:
              profile?.satisfactionScore != null
                ? `${profile.satisfactionScore}/5`
                : '—',
          },
        ]}
      />

      <ProfileHeader
        canEdit={canEdit}
        editing={editor.editing}
        onEdit={editor.startEdit}
      />

      {editor.editing ? (
        <VaProfileForm editor={editor} />
      ) : profile ? (
        <VaProfileView profile={profile} />
      ) : null}

      {/* Internal notes thread: staff only */}
      <NotesThread subjectType="va" subjectId={vaId} />

      <VaAssignmentList assignments={assignments} />
    </div>
  );
}
