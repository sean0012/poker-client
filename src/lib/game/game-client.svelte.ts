import type {
  Gaze,
  Role,
  Room,
  ServerEvent,
  Status,
} from './types';

export function createGameClient() {
  const state = $state({
    roomName: 'game-1',
    deckSize: 20 as number | undefined,
    firstChips: 20 as number | undefined,
    secondChips: 20 as number | undefined,

    room: null as Room | null,
    status: 'disconnected' as Status,
    role: null as Role | null,
    seat: null as number | null,
    view: 'opponent' as Gaze,

    busy: false,
    error: '',
  });

  let socket: WebSocket | null = null;

  function showError(cause: unknown) {
    state.error =
      cause instanceof Error ? cause.message : String(cause);
  }

  async function readRoom(response: Response): Promise<Room> {
    if (!response.ok) {
      throw new Error(
        `${response.status}: ${await response.text()}`
      );
    }

    return response.json();
  }

  async function createGame() {
    if (state.busy || state.status !== 'disconnected') return;

    state.busy = true;
    state.error = '';

    try {
      state.room = await readRoom(
        await fetch('/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.roomName.trim(),
            deck_size: state.deckSize,
            initial_chips: [state.firstChips, state.secondChips],
          }),
        })
      );

      state.roomName = state.room.name;
    } catch (cause) {
      showError(cause);
    } finally {
      state.busy = false;
    }
  }

  async function getRoomInfo() {
    const name = state.roomName.trim();

    if (!name || state.busy || state.status === 'connecting') return;

    state.busy = true;
    state.error = '';

    try {
      state.room = await readRoom(
        await fetch(`/rooms/${encodeURIComponent(name)}`)
      );
    } catch (cause) {
      // Do not keep showing the previous room when another lookup fails.
      if (state.status === 'disconnected') state.room = null;
      showError(cause);
    } finally {
      state.busy = false;
    }
  }

  function joinRoom(nextRole: Role) {
    const name = state.roomName.trim();

    if (!name || state.busy || state.status !== 'disconnected') return;

    state.error = '';
    state.room = null;
    state.role = null;
    state.seat = null;
    state.view = 'opponent';
    state.roomName = name;
    state.status = 'connecting';

    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';

      const connection = new WebSocket(
        `${protocol}//${location.host}/rooms/` +
          `${encodeURIComponent(name)}/${nextRole}`
      );

      socket = connection;

      connection.onmessage = (event) => {
        if (socket !== connection) return;

        try {
          const message = JSON.parse(event.data) as ServerEvent;

          if (message.type === 'error') {
            state.error = message.message;
            leaveRoom();
            return;
          }

          if (message.type === 'joined') {
            state.role = message.role;
            state.seat = message.seat;
            state.room = message.room;
            state.status = 'connected';
          }
        } catch {
          state.error = 'Unable to parse the server message.';
          leaveRoom();
        }
      };

      connection.onerror = () => {
        if (socket !== connection) return;
        state.error = 'Connection failed. Check the server address and room name.';
      };

      connection.onclose = () => {
        if (socket !== connection) return;

        socket = null;
        state.status = 'disconnected';
        state.role = null;
        state.seat = null;
        state.room = null;
      };
    } catch (cause) {
      leaveRoom();
      showError(cause);
    }
  }

  function leaveRoom() {
    const previous = socket;
    socket = null;
    previous?.close();

    state.status = 'disconnected';
    state.role = null;
    state.seat = null;
    state.room = null;
  }

  return {
    state,
    createGame,
    getRoomInfo,
    joinRoom,
    leaveRoom,
  };
}

export type GameClient = ReturnType<typeof createGameClient>;
