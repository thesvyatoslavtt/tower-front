import type { AISuggestion } from "./AIPanel";

export const aiPanelMock: AISuggestion[] = [
  {
    text: "47 active employees across 8 units. 2 employees on probation — probation reviews are overdue.",
    warn: true,
    action: "View Probations",
    interactionId: "goto-performance",
  },
  {
    text: "Vacation utilization is uneven — one employee has used 100% while 4 have used 0 days.",
    action: "Review",
    interactionId: "goto-onboarding",
  },
  {
    text: "Two invoices are overdue by more than 30 days. Escalation recommended.",
    urgent: true,
    action: "Act Now",
    interactionId: "goto-finance",
  },
];
