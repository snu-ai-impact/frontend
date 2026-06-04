export const AUTH_COOKIE_NAME = "snuaiimpact_auth";

export function getLoginCredentials() {
  return {
    id: process.env.APP_LOGIN_ID ?? "",
    password: process.env.APP_LOGIN_PASSWORD ?? "",
    secret: process.env.APP_AUTH_SECRET ?? "",
  };
}

export function isAuthConfigured() {
  const { id, password, secret } = getLoginCredentials();
  return Boolean(id && password && secret);
}
