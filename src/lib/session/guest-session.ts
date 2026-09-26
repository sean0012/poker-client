export type GuestSession = {
  user_id: string;
  display_name: string;
  avatar: string;
};

export async function initializeGuestSession(): Promise<GuestSession> {
  const response = await fetch('/session', {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}