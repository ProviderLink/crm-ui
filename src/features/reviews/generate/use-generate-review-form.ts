import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useCrmClientUsersQuery,
  useCrmVaUsersQuery,
} from '@/hooks/queries';
import { generateReview } from '@/services/performance-reviews.service';
import { ROLE_TYPES, type RoleType } from '@/types/performance-review';

import { schema, type FormValues } from './schema';

export function useGenerateReviewForm({
  onOpenChange,
  onCreated,
  defaultCandidateName,
  defaultClientName,
  defaultJobTitle,
  defaultJobDescription,
  propVaId,
  propClientId,
  jobId,
}: {
  onOpenChange: (open: boolean) => void;
  /** Called with the new review's id once it has been generated. */
  onCreated: (reviewId: string) => void;
  defaultCandidateName: string;
  defaultClientName: string;
  defaultJobTitle: string;
  defaultJobDescription: string;
  propVaId?: string;
  propClientId?: string;
  jobId?: string;
}) {
  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();
  const { data: crmClients = [] } = useCrmClientUsersQuery();
  const { data: assignments = [] } = useAllAssignmentsQuery();

  const crmClientRefs = useMemo(
    () => new Set(crmClients.map(c => c.clientRef).filter(Boolean)),
    [crmClients]
  );
  const filteredClients = useMemo(
    () => atsClients.filter(c => crmClientRefs.has(c.id)),
    [atsClients, crmClientRefs]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: propClientId ?? '',
      vaId: propVaId ?? '',
      jobDescription: defaultJobDescription,
      managerNotes: '',
      clientExpectations: '',
    },
  });

  const selectedClientId = useWatch({ control, name: 'clientId' });
  const selectedVaId = useWatch({ control, name: 'vaId' });

  // VAs who have an active assignment with the selected client
  const clientVas = useMemo(() => {
    if (!selectedClientId) return [];
    const candidateIds = new Set(
      assignments
        .filter(a => a.clientId === selectedClientId)
        .map(a => a.candidateId)
    );
    return crmVAs.filter(
      v => v.candidateRef && candidateIds.has(v.candidateRef)
    );
  }, [selectedClientId, assignments, crmVAs]);

  // Role types available for the selected VA under the selected client
  const availableRoleTypes = useMemo(() => {
    if (!selectedVaId || !selectedClientId) return ROLE_TYPES;
    const matchingTypes = assignments
      .filter(
        a =>
          a.clientId === selectedClientId &&
          a.candidateId === selectedVaId &&
          a.serviceType
      )
      .map(a => a.serviceType as RoleType)
      .filter(t => ROLE_TYPES.includes(t));
    return matchingTypes.length > 0 ? [...new Set(matchingTypes)] : ROLE_TYPES;
  }, [selectedVaId, selectedClientId, assignments]);

  // Keeps the form's role type in step with the choices above: when the VA and
  // client have exactly one service type between them, that is the role type.
  useEffect(() => {
    if (
      availableRoleTypes.length === 1 &&
      availableRoleTypes[0] !== undefined
    ) {
      setValue('roleType', availableRoleTypes[0]);
    }
  }, [availableRoleTypes, setValue]);

  // A VA belongs to a client, so choosing another client clears the VA (unless
  // the VA was given to the dialog).
  function handleClientChange() {
    if (!propVaId) setValue('vaId', '');
  }

  async function onSubmit(values: FormValues) {
    try {
      const review = await generateReview({
        ...values,
        managerNotes: values.managerNotes ?? '',
        jobId,
        candidateName: defaultCandidateName || undefined,
        clientName: defaultClientName || undefined,
        jobTitle: defaultJobTitle || undefined,
      });
      toast.success('Review generated successfully');
      reset();
      onOpenChange(false);
      onCreated(review.id);
    } catch {
      toast.error('Failed to generate review. Please try again.');
    }
  }

  function handleClose(open: boolean) {
    if (!isSubmitting) {
      onOpenChange(open);
      if (!open) reset();
    }
  }

  const isPreFilled = !!(propVaId && propClientId);

  return {
    register,
    handleSubmit,
    control,
    errors,
    isSubmitting,
    onSubmit,
    handleClose,
    handleClientChange,
    isPreFilled,
    filteredClients,
    clientVas,
    availableRoleTypes,
    selectedClientId,
  };
}
