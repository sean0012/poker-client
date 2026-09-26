const GUEST_ID_KEY = 'indian-poker.guest-id';

function createGuestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `guest-${crypto.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2);
  return `guest-${Date.now().toString(36)}-${randomPart}`;
}

export function getGuestId(): string {
  const storedGuestId = sessionStorage.getItem(GUEST_ID_KEY);
  if (storedGuestId) return storedGuestId;

  const guestId = createGuestId();
  sessionStorage.setItem(GUEST_ID_KEY, guestId);
  return guestId;
}