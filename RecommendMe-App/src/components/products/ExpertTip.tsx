import { Lightbulb } from "lucide-react";

interface ExpertTipProps {
  tip: string;
}

export default function ExpertTip({ tip }: ExpertTipProps) {
  return (
    <div className="flex items-start gap-2.5 bg-accent/50 border border-border rounded-xl px-3.5 py-3">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Lightbulb className="h-3.5 w-3.5 text-foreground" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-0.5">Pro Tip</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
