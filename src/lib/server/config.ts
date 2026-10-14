export const APP = "haanriver";
export const SESSION_COOKIE = "hr_session";
/** Public sign-up is off unless ALLOW_PUBLIC_SIGNUP=1. */
export const SIGNUP_ENABLED = process.env.ALLOW_PUBLIC_SIGNUP === "1";
