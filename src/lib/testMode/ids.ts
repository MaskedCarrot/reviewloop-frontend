/** Single stable test user; all /api/* traffic is mocked in local test mode. */
export const TEST_USER_ID = "a0000000-0000-4000-8000-00000000d001";

export const TEST_BUSINESS_ID = "a0000000-0000-4000-8000-00000000b001";

export const STORAGE_KEY = "reviewloop_test_mode_state_v1";

/** Set by "Try demo" (browser-only). Keeps all traffic on the client mock even without `NEXT_PUBLIC_TEST_MODE`. */
export const LOCAL_DEMO_FLAG = "reviewloop_try_demo_local";

export const PRO_MONTHLY_CREDITS = 200;
export const EMAIL_CREDIT = 1;
export const SMS_CREDIT = 5; // 1-segment default for estimates

export const TOPUP_BY_KEY: Record<string, number> = {
  topup_500: 500,
  topup_2000: 2000,
  topup_5000: 5000,
};
