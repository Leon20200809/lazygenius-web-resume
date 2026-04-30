// src/types/resume.ts
import type { Profile } from "@/types/profile";
import type { Education } from "@/types/education";

export type ResumeData = {
  profile: Profile;
  education: Education[];
};