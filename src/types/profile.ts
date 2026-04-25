// src/types/profile.ts → Profile型・empty_profile
export type Profile = {
  name: string;
  furigana: string;
  title: string;
  tagline: string;
  summary: string;
  birth_date: string;
  gender: string;
  postal_code: string;
  address: string;
  address_kana: string;
  phone: string;
  email: string;
  photo_url: string;
  nearest_station: string;
  github_url: string;
  portfolio_url: string;
  wanted_job: string;
  commuting_time: string;
  dependents: string;
  spouse: string;
  spouse_support: string;
};

export const empty_profile: Profile = {
  name: "",
  furigana: "",
  title: "",
  tagline: "",
  summary: "",
  birth_date: "",
  gender: "",
  postal_code: "",
  address: "",
  address_kana: "",
  phone: "",
  email: "",
  photo_url: "",
  nearest_station: "",
  github_url: "",
  portfolio_url: "",
  wanted_job: "",
  commuting_time: "",
  dependents: "",
  spouse: "",
  spouse_support: "",
};