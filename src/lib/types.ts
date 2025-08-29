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
  admin: 0 | 1;
  internal: 0 | 1;
  preferences: {
    timezone: string;
    dateFormat: string;
    firstDay: string;
  },
}

export interface UserProfile {
  id: number;
  username: string;
  email: string | null;
  email_visible: "public" | "connections" | "private";
  display_name: string | null;
  avatar_url: string | null;
  description: string | null;
  admin: number;
  internal: number;
  created_at: Date;
  timezone: string | null;
  timezone_visible: "public" | "connections" | "private";
}

export interface ProfileResponse {
  profile: UserProfile;
  isFriend: boolean;
  isSelf: boolean;
  isPending: boolean;
}

export interface securitydata {
  twofa_email_enabled: 0 | 1;
  twofa_totp_enabled: 0 | 1;
}

export interface session {
  id: number;
  user_id: number;
  user_agent: string;
  ip_address: string;
  jwt_id: string;
  expires_at: string;
  created_at: string;
  last_updated: string;

  created_at_fmt?: string;
  last_updated_fmt?: string;
  expires_at_fmt?: string;
}
