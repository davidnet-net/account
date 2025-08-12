export interface JwtPayload {
  userId: number | string;
  username: string;
  type: "access" | "refresh";
  exp?: number;    // expiration timestamp (seconds since epoch)
  jti?: string;    // only for refresh tokens (Not available in frontend)
}

export function parseJwt(token: string): JwtPayload {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );

  return JSON.parse(jsonPayload) as JwtPayload;
}
