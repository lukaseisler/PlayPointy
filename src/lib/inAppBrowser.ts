/** TikTok / Instagram / Facebook etc. — Google OAuth oft kaputt. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Line\/|TikTok|ByteLocale|Bytedance|Twitter|LinkedInApp|Snapchat/i.test(
    ua,
  );
}
