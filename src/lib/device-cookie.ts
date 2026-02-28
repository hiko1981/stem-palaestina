/** Cookie-based device ID — persists across Safari, PWA and iMessage links on iOS */

const DEVICE_ID_KEY = "stem_device_id";
const VOTED_KEY = "stem_voted";
const VOTE_VALUE_KEY = "stem_vote_value";
const MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${MAX_AGE};SameSite=Lax;Secure`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Get device ID from localStorage + cookie, creating if needed. Syncs both. */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY) || getCookie(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
  }
  // Always sync both stores
  localStorage.setItem(DEVICE_ID_KEY, id);
  setCookie(DEVICE_ID_KEY, id);
  return id;
}

/** Mark device as voted (both stores) */
export function setDeviceVoted(voteValue: boolean) {
  localStorage.setItem("stem_palaestina_voted", "true");
  localStorage.setItem("stem_palaestina_vote", voteValue ? "true" : "false");
  setCookie(VOTED_KEY, "1");
  setCookie(VOTE_VALUE_KEY, voteValue ? "true" : "false");
}

/** Check if device voted (either store) */
export function getDeviceVoted(): { voted: boolean; voteValue: boolean } {
  const lsVoted = localStorage.getItem("stem_palaestina_voted") === "true";
  const cookieVoted = getCookie(VOTED_KEY) === "1";
  const voted = lsVoted || cookieVoted;

  const lsValue = localStorage.getItem("stem_palaestina_vote");
  const cookieValue = getCookie(VOTE_VALUE_KEY);
  const voteValue = (lsValue ?? cookieValue) !== "false";

  // Sync if one has it and the other doesn't
  if (voted) {
    setDeviceVoted(voteValue);
  }

  return { voted, voteValue };
}
