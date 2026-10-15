let isRedirectingAfterLogout = false;

export function markIntentionalLogout() {
  isRedirectingAfterLogout = true;
}

export function clearIntentionalLogout() {
  isRedirectingAfterLogout = false;
}

export function isIntentionalLogout() {
  return isRedirectingAfterLogout;
}
