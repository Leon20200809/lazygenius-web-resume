// src/types/resume.ts
import type { Profile } from "@/types/profile";
import type { Education } from "@/types/education";
import { Career } from "@/types/career";
import { Certification } from "@/types/certification";

export interface ResumeData {
  profile: Profile;
  education: Education[];
  career: Career[];
  certification: Certification[];
}