export interface SessionInfo {
  userId: number;
  username: string;
  display_name: string;
  profilePicture: string;
  email_verified: number;
  email: string;
  type: "access";
  exp: number;
  jti: string;
  admin: number;
  internal: number;
  preferences: {
    timezone: string;
    dateFormat: string;
    firstDay: string;
  },
}

export interface UserProfile {
  id: number;
  username: string;
  email: string | null; // filtered based on visibility
  email_visible: string; // "public" | "connections" | "private"
  display_name: string | null;
  avatar_url: string | null;
  description: string | null;
  admin: number;
  internal: number;
  created_at: Date;
}

export interface ProfileResponse {
  profile: UserProfile;
  isFriend: boolean;
  isSelf: boolean;
}

export interface securitydata {
  twofa_email_enabled: number;
  twofa_totp_enabled: number;
}