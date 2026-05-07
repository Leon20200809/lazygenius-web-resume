// src/features/reply/types.ts

export type SelectionResult = "passed" | "rejected" | "";

export type ReplyFormValues = {
  recipient_name: string;
  selection_result: SelectionResult;
  company: string;
  person: string;
  email: string;
  interview_dates: string;
  passed_note: string;
  rejection_reason: string;
  improvement_points: string;
};
