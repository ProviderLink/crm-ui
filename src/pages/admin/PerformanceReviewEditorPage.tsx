import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DownloadIcon,
  GripVerticalIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  StarIcon,
  TargetIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { QK, usePerformanceReviewQuery } from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import {
  completeReview,
  exportReviewPdf,
  improveManagerSummary,
  regenerateCategories,
  regenerateGoals,
  updateReview,
} from '@/services/performance-reviews.service';
import {
  FINAL_RECOMMENDATIONS,
  RATING_LABELS,
  type FinalRecommendation,
  type IPerformanceCategory,
} from '@/types/performance-review';

const RATING_OPTIONS = [
  { value: '1', label: '1 — Unsatisfactory' },
  { value: '2', label: '2 — Needs Improvement' },
  { value: '3', label: '3 — Meets Expectations' },
  { value: '4', label: '4 — Exceeds Expectations' },
  { value: '5', label: '5 — Outstanding' },
  { value: 'na', label: 'N/A' },
];

const RATING_COLORS: Record<number, string> = {
  1: 'bg-white/[0.04] text-[#F87171] border-[rgba(255,255,255,0.08)]',
  2: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
  3: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
  4: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
  5: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
};

function ratingToValue(r: number | null): string {
  if (r === null) return 'na';
  return String(r);
}

function valueToRating(v: string): number | null {
  if (v === 'na' || v === '') return null;
  return parseInt(v, 10);
}

function AiButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-7 px-2.5 text-xs border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 gap-1.5"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2Icon className="size-3 animate-spin" />
      ) : (
        <SparklesIcon className="size-3" />
      )}
      {loading ? 'Working…' : label}
    </Button>
  );
}

function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-none border-border/60">
      <CardHeader className="px-5 py-4 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">{children}</CardContent>
    </Card>
  );
}

export default function PerformanceReviewEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAppSelector(s => s.auth.user);
  const rolePrefix = user?.role === 'admin' ? '/admin' : '/am';
  const isAccountManager = user?.role === 'account_manager';

  const { data: review, isLoading } = usePerformanceReviewQuery(id ?? '');
  const isReadOnly = isAccountManager || review?.reviewStatus === 'Completed';

  // Form state
  const [roleSummary, setRoleSummary] = useState('');
  const [coreResponsibilities, setCoreResponsibilities] = useState<string[]>(
    []
  );
  const [categories, setCategories] = useState<IPerformanceCategory[]>([]);
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [goalsNextPeriod, setGoalsNextPeriod] = useState<string[]>([]);
  const [finalRecommendation, setFinalRecommendation] = useState<
    FinalRecommendation | ''
  >('');
  const [overallRating, setOverallRating] = useState<string>('');
  const [finalManagerSummary, setFinalManagerSummary] = useState('');

  // AI loading states
  const [regenCatLoading, setRegenCatLoading] = useState(false);
  const [regenGoalsLoading, setRegenGoalsLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!review) return;
    setRoleSummary(review.roleSummary ?? '');
    setCoreResponsibilities(review.coreResponsibilities ?? []);
    setCategories(review.categories ?? []);
    setStrengths(review.strengths ?? '');
    setAreasForImprovement(review.areasForImprovement ?? '');
    setGoalsNextPeriod(review.goalsNextPeriod ?? []);
    setFinalRecommendation(review.finalRecommendation ?? '');
    setOverallRating(review.overallRating ? String(review.overallRating) : '');
    setFinalManagerSummary(review.finalManagerSummary ?? '');
  }, [review]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: QK.performanceReview(id!) });
  }

  async function handleSaveDraft() {
    if (!id) return;
    setSaving(true);
    try {
      await updateReview(id, {
        roleSummary,
        coreResponsibilities,
        strengths,
        areasForImprovement,
        goalsNextPeriod,
        finalRecommendation: finalRecommendation || null,
        overallRating: overallRating ? parseInt(overallRating, 10) : null,
        finalManagerSummary,
        categories,
        reviewStatus:
          review?.reviewStatus === 'Draft' ||
          review?.reviewStatus === 'AI Generated'
            ? 'In Review'
            : review?.reviewStatus,
      });
      invalidate();
      toast.success('Saved');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenCategories() {
    if (!id) return;
    setRegenCatLoading(true);
    try {
      const updated = await regenerateCategories(id);
      setCategories(updated.categories ?? []);
      invalidate();
      toast.success('Categories regenerated');
    } catch {
      toast.error('Failed to regenerate categories.');
    } finally {
      setRegenCatLoading(false);
    }
  }

  async function handleRegenGoals() {
    if (!id) return;
    setRegenGoalsLoading(true);
    try {
      const updated = await regenerateGoals(id);
      setGoalsNextPeriod(updated.goalsNextPeriod ?? []);
      invalidate();
      toast.success('Goals regenerated');
    } catch {
      toast.error('Failed to regenerate goals.');
    } finally {
      setRegenGoalsLoading(false);
    }
  }

  async function handleImproveManagerSummary() {
    if (!id) return;
    setImproveLoading(true);
    try {
      const updated = await improveManagerSummary(id);
      setFinalManagerSummary(updated.finalManagerSummary ?? '');
      invalidate();
      toast.success('Manager summary improved');
    } catch {
      toast.error('Failed to improve summary.');
    } finally {
      setImproveLoading(false);
    }
  }

  async function handleExportPdf() {
    if (!id) return;
    setExporting(true);
    try {
      const name = review?.candidateName ?? 'review';
      await exportReviewPdf(
        id,
        `performance-review-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      );
    } catch {
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleMarkCompleted() {
    if (!id) return;
    setCompleting(true);
    try {
      // Save all current form state before completing so no selections are lost
      await updateReview(id, {
        roleSummary,
        coreResponsibilities,
        strengths,
        areasForImprovement,
        goalsNextPeriod,
        finalRecommendation: finalRecommendation || null,
        overallRating: overallRating ? parseInt(overallRating, 10) : null,
        finalManagerSummary,
        categories,
      });
      await completeReview(id);
      invalidate();
      toast.success('Review marked as Completed');
      setCompleteOpen(false);
    } catch {
      toast.error('Failed to complete review.');
    } finally {
      setCompleting(false);
    }
  }

  function updateCategoryField(
    catId: string,
    field: 'rating' | 'managerComments',
    value: number | null | string
  ) {
    setCategories(prev =>
      prev.map(c => (c.id === catId ? { ...c, [field]: value } : c))
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Review not found.</p>
      </div>
    );
  }

  const ratingNum = overallRating ? parseInt(overallRating, 10) : null;

  // Conditionally show admin-only editing UI
  // (now uses isReadOnly which includes isAccountManager check)

  return (
    <div className="@container/main flex flex-1 flex-col">
      {/* ── Sticky toolbar ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/95 border-b border-border px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            onClick={() => navigate(`${rolePrefix}/performance-reviews`)}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">
                {review.reviewType} Review
              </span>
              {review.candidateName && (
                <span className="text-muted-foreground text-sm truncate">
                  — {review.candidateName}
                </span>
              )}
              {review?.reviewStatus === 'Completed' && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded bg-white/[0.04] text-[#A0A0A0] border border-[rgba(255,255,255,0.08)]">
                  <LockIcon className="size-2.5" />
                  Completed
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-muted-foreground hover:text-foreground border border-border/60"
              onClick={handleExportPdf}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <DownloadIcon className="size-3.5" />
              )}
              <span className="hidden sm:inline ml-1.5">Export PDF</span>
            </Button>

            {!isReadOnly && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <SaveIcon className="size-3.5" />
                  )}
                  <span className="ml-1.5">Save Draft</span>
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setCompleteOpen(true)}
                >
                  <CheckCircle2Icon className="size-3.5" />
                  <span className="ml-1.5 hidden sm:inline">
                    Mark Completed
                  </span>
                  <span className="ml-1.5 sm:hidden">Complete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 lg:px-6 py-6">
        <div className="space-y-5">
          {/* AI disclaimer */}
          {!isReadOnly && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-amber-500/8 border border-amber-500/25 text-amber-700 dark:text-amber-400">
              <AlertTriangleIcon className="size-4 shrink-0" />
              <p className="text-sm font-medium">
                AI-generated draft — please review and edit before finalizing.
              </p>
            </div>
          )}

          {/* ── Metadata card ─────────────────────────────────────────────── */}
          <Card className="shadow-none border-border/60 bg-muted/30">
            <CardContent className="px-5 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    VA / Candidate
                  </p>
                  <p className="text-sm font-medium">
                    {review.candidateName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Client</p>
                  <p className="text-sm font-medium">
                    {review.clientName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Review Period
                  </p>
                  <p className="text-sm font-medium">
                    {review.reviewPeriodStart?.slice(0, 10)} –{' '}
                    {review.reviewPeriodEnd?.slice(0, 10)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <p className="text-sm font-medium">{review.reviewStatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Role Summary ──────────────────────────────────────────────── */}
          <SectionCard
            icon={<UserIcon className="size-3.5" />}
            title="Role Summary"
          >
            <Textarea
              value={roleSummary}
              onChange={e => setRoleSummary(e.target.value)}
              rows={4}
              placeholder="Describe the VA's role and responsibilities..."
              disabled={isReadOnly}
              className="resize-none"
            />
          </SectionCard>

          {/* ── Manager Summary ───────────────────────────────────────────── */}
          <SectionCard
            icon={<ClipboardListIcon className="size-3.5" />}
            title="Manager Summary"
            action={
              !isReadOnly ? (
                <AiButton
                  label="Improve with AI"
                  loading={improveLoading}
                  onClick={handleImproveManagerSummary}
                />
              ) : undefined
            }
          >
            <Textarea
              value={finalManagerSummary}
              onChange={e => setFinalManagerSummary(e.target.value)}
              rows={4}
              placeholder="Overall manager assessment..."
              disabled={isReadOnly}
              className="resize-none"
            />
          </SectionCard>

          {/* ── Core Responsibilities ─────────────────────────────────────── */}
          <SectionCard
            icon={<GripVerticalIcon className="size-3.5" />}
            title="Core Responsibilities"
            action={
              !isReadOnly ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setCoreResponsibilities(prev => [...prev, ''])}
                >
                  <PlusIcon className="size-3" />
                  Add
                </Button>
              ) : undefined
            }
          >
            {coreResponsibilities.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-1">
                No responsibilities listed.
              </p>
            ) : (
              <div className="space-y-2">
                {coreResponsibilities.map((resp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-none size-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium select-none">
                      {i + 1}
                    </span>
                    <Input
                      value={resp}
                      onChange={e => {
                        const updated = [...coreResponsibilities];
                        updated[i] = e.target.value;
                        setCoreResponsibilities(updated);
                      }}
                      placeholder={`Responsibility ${i + 1}`}
                      disabled={isReadOnly}
                      className="h-8 text-sm"
                    />
                    {!isReadOnly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        onClick={() =>
                          setCoreResponsibilities(prev =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Performance Categories ────────────────────────────────────── */}
          <SectionCard
            icon={<StarIcon className="size-3.5" />}
            title="Performance Categories"
            action={
              !isReadOnly ? (
                <AiButton
                  label="Regenerate"
                  loading={regenCatLoading}
                  onClick={handleRegenCategories}
                />
              ) : undefined
            }
          >
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-1">
                No categories yet.{' '}
                {!isReadOnly && 'Use "Regenerate" to generate them with AI.'}
              </p>
            ) : (
              <div className="space-y-3">
                {categories
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="rounded-lg border border-border/50 bg-background p-4"
                    >
                      {/* Category header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="flex-none mt-0.5 size-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium select-none">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-tight">
                              {cat.categoryName}
                            </p>
                            {cat.categoryDescription && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {cat.categoryDescription}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Rating select + badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          {cat.rating !== null && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${RATING_COLORS[cat.rating] ?? ''}`}
                            >
                              {cat.rating} · {RATING_LABELS[cat.rating]}
                            </span>
                          )}
                          <Select
                            value={ratingToValue(cat.rating)}
                            onValueChange={v =>
                              updateCategoryField(
                                cat.id,
                                'rating',
                                valueToRating(v)
                              )
                            }
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <SelectValue placeholder="Set rating" />
                            </SelectTrigger>
                            <SelectContent>
                              {RATING_OPTIONS.map(o => (
                                <SelectItem
                                  key={o.value}
                                  value={o.value}
                                  className="text-xs"
                                >
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Manager comments */}
                      <Textarea
                        value={cat.managerComments ?? ''}
                        onChange={e =>
                          updateCategoryField(
                            cat.id,
                            'managerComments',
                            e.target.value
                          )
                        }
                        rows={2}
                        placeholder="Manager comments for this category..."
                        className="text-sm resize-none bg-muted/30"
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
              </div>
            )}
          </SectionCard>

          {/* ── Strengths + Areas (side by side) ─────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SectionCard
              icon={<span className="text-[#A0A0A0]">↑</span>}
              title="Strengths"
            >
              <Textarea
                value={strengths}
                onChange={e => setStrengths(e.target.value)}
                rows={5}
                placeholder="What did this VA do well?"
                disabled={isReadOnly}
                className="resize-none"
              />
            </SectionCard>

            <SectionCard
              icon={<span className="text-amber-600">↗</span>}
              title="Areas for Improvement"
            >
              <Textarea
                value={areasForImprovement}
                onChange={e => setAreasForImprovement(e.target.value)}
                rows={5}
                placeholder="What areas need improvement?"
                disabled={isReadOnly}
                className="resize-none"
              />
            </SectionCard>
          </div>

          {/* ── Goals Next Period ─────────────────────────────────────────── */}
          <SectionCard
            icon={<TargetIcon className="size-3.5" />}
            title="Goals — Next Period"
            action={
              !isReadOnly ? (
                <div className="flex items-center gap-2">
                  <AiButton
                    label="Regenerate"
                    loading={regenGoalsLoading}
                    onClick={handleRegenGoals}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setGoalsNextPeriod(prev => [...prev, ''])}
                  >
                    <PlusIcon className="size-3" />
                    Add
                  </Button>
                </div>
              ) : undefined
            }
          >
            {goalsNextPeriod.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-1">
                No goals listed.{' '}
                {!isReadOnly && 'Use "Regenerate" to generate them with AI.'}
              </p>
            ) : (
              <div className="space-y-2">
                {goalsNextPeriod.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-none size-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium select-none">
                      {i + 1}
                    </span>
                    <Input
                      value={goal}
                      onChange={e => {
                        const updated = [...goalsNextPeriod];
                        updated[i] = e.target.value;
                        setGoalsNextPeriod(updated);
                      }}
                      placeholder={`Goal ${i + 1}`}
                      disabled={isReadOnly}
                      className="h-8 text-sm"
                    />
                    {!isReadOnly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        onClick={() =>
                          setGoalsNextPeriod(prev =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Final Assessment ──────────────────────────────────────────── */}
          <Card className="shadow-none border-border/60">
            <CardHeader className="px-5 py-4 pb-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="text-muted-foreground">
                  <CheckCircle2Icon className="size-3.5" />
                </span>
                Final Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Final Recommendation
                  </Label>
                  <Select
                    value={finalRecommendation}
                    onValueChange={v =>
                      setFinalRecommendation(v as FinalRecommendation)
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      {FINAL_RECOMMENDATIONS.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    Overall Rating
                  </Label>
                  <Select
                    value={overallRating}
                    onValueChange={setOverallRating}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n} — {RATING_LABELS[n]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ratingNum !== null && (
                    <p
                      className={`text-xs font-medium ${RATING_COLORS[ratingNum]?.split(' ')[1] ?? ''}`}
                    >
                      {RATING_LABELS[ratingNum]}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Bottom save bar ───────────────────────────────────────────── */}
          {!isReadOnly && (
            <div className="flex justify-end gap-2 py-2 pb-8">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                Save Draft
              </Button>
              <Button size="sm" onClick={() => setCompleteOpen(true)}>
                <CheckCircle2Icon className="size-4" />
                Mark Completed
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={completeOpen}
        onCancel={() => setCompleteOpen(false)}
        title="Mark Review as Completed"
        description="Once completed, the review will be locked and no further edits can be made. Are you sure?"
        confirmLabel={completing ? 'Completing…' : 'Mark Completed'}
        onConfirm={handleMarkCompleted}
        variant="default"
      />
    </div>
  );
}
