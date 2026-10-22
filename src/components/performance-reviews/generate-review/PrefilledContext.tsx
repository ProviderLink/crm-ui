export function PrefilledContext({
  candidateName,
  clientName,
  jobTitle,
}: {
  candidateName: string;
  clientName: string;
  jobTitle: string;
}) {
  if (!candidateName && !clientName && !jobTitle) return null;
  return (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              {candidateName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    VA / Candidate
                  </p>
                  <p className="text-sm font-medium truncate">
                    {candidateName}
                  </p>
                </div>
              )}
              {clientName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client</p>
                  <p className="text-sm font-medium truncate">
                    {clientName}
                  </p>
                </div>
              )}
              {jobTitle && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Job Title
                  </p>
                  <p className="text-sm font-medium truncate">
                    {jobTitle}
                  </p>
                </div>
              )}
            </div>
  );
}
