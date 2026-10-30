import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useEodContextQuery, useEodSubmissionsQuery } from '@/hooks/queries';
import { useMyAssignments } from '@/hooks/useMyAssignments';
import { getApiError } from '@/lib/api-error';
import { calcHours, todayString } from '@/lib/time';
import { createEodSubmission } from '@/services/eod-submissions.service';

import { DEFAULT_WORK_ENTRY, schema, type FormData } from './schema';

export function useEodSubmitForm() {
  const navigate = useNavigate();
  /**
   * VAs work from every timezone but report against the **company's** business
   * day, so "today" comes from the backend (company timezone) rather than the
   * device clock. The form never sends a date: the server files the EOD
   * against its own current company day. The device value is only a
   * placeholder until the context resolves.
   */
  const deviceToday = todayString();
  const { data: eodContext, isLoading: loadingContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? deviceToday;
  const companyTimezone = eodContext?.timezone ?? null;
  const {
    assignments,
    isLoading: loadingAssignments,
    isError: assignmentsError,
  } = useMyAssignments();
  const queryClient = useQueryClient();
  const { data: eods = [], isLoading: checkingEod } = useEodSubmissionsQuery({
    date: today,
  });
  const submittedKeys = new Set(eods.map(e => `${e.assignmentId}::${e.date}`));
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      communicatedWithClient: undefined,
      shiftStart: '',
      shiftEnd: '',
      workEntries: [DEFAULT_WORK_ENTRY],
    },
  });

  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
  } = useFieldArray({ control, name: 'workEntries' });

  const selectedAssignmentId = watch('assignmentId') ?? '';
  const shiftStart = watch('shiftStart') ?? '';
  const shiftEnd = watch('shiftEnd') ?? '';
  // Preview only — the server recomputes this from the shift times.
  const hoursWorked = calcHours(shiftStart, shiftEnd);
  const alreadySubmitted = selectedAssignmentId
    ? submittedKeys.has(`${selectedAssignmentId}::${today}`)
    : false;

  useEffect(() => {
    if (assignments.length === 1 && assignments[0]) {
      setValue('assignmentId', assignments[0]._id);
    }
  }, [assignments, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      // `date` is omitted so the server uses the company's current day, and
      // `hoursWorked` is derived server-side so overnight shifts are not
      // under-counted.
      await createEodSubmission(data);
      queryClient.invalidateQueries({ queryKey: ['eod-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['eod-context'] });
      navigate('/va/eod/history');
    } catch (err) {
      setError(getApiError(err, 'Failed to submit EOD. Please try again.'));
    }
  }

  return {
    today,
    companyTimezone,
    assignments,
    loading: loadingAssignments || checkingEod || loadingContext,
    assignmentsError,
    error,
    register,
    control,
    setValue,
    errors,
    isSubmitting,
    onFormSubmit: handleSubmit(onSubmit),
    workFields,
    appendWork,
    removeWork,
    hoursWorked,
    alreadySubmitted,
  };
}
