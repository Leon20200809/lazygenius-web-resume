// src/types/resume.ts
import type { Profile } from "./profile";

export type ResumeRow = {
  date: string;
  text: string;
};

export type ResumeData = {
  profile: Profile;
  education: ResumeRow[];
  careers: ResumeRow[];
  certifications: string[];
};