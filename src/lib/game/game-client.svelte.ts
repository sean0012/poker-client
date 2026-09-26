import type {
  Gaze,
  Role,
  Game,
  ServerEvent,
  Status,
} from './types';

export function createGameClient() {
  const state = $state({
    gameName: 'game-1',
    gameId: '',
    deckSize: 20 as number | undefined,
    firstChips: 20 as number | undefined,
    secondChips: 20 as number | undefined,

    game: null as Game | null,
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

  async function readGame(response: Response): Promise<Game> {
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
      state.game = await readGame(
        await fetch('/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.gameName.trim(),
            deck_size: state.deckSize,
            initial_chips: [state.firstChips, state.secondChips],
          }),
        })
      );

      state.gameName = state.game.name;
      state.gameId = state.game.id;
    } catch (cause) {
      showError(cause);
    } finally {
      state.busy = false;
    }
  }

  async function getGameInfo() {
    const id = state.gameId.trim();

    if (!id || state.busy || state.status === 'connecting') return;

    state.busy = true;
    state.error = '';

    try {
      state.game = await readGame(
        await fetch(`/games/${encodeURIComponent(id)}`)
      );
    } catch (cause) {
      // Do not keep showing the previous game when another lookup fails.
      if (state.status === 'disconnected') state.game = null;
      showError(cause);
    } finally {
      state.busy = false;
    }
  }

  function joinGame(nextRole: Role) {
    const id = state.gameId.trim();

    if (!id || state.busy || state.status !== 'disconnected') return;

    state.error = '';
    state.game = null;
    state.role = null;
    state.seat = null;
    state.view = 'opponent';
    state.gameId = id;
    state.status = 'connecting';

    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';

      const connection = new WebSocket(
        `${protocol}//${location.host}/games/` +
          `${encodeURIComponent(id)}/${nextRole}`
      );

      socket = connection;

      connection.onmessage = (event) => {
        if (socket !== connection) return;

        try {
          const message = JSON.parse(event.data) as ServerEvent;

          if (message.type === 'error') {
            state.error = message.message;
            leaveGame();
            return;
          }

          if (message.type === 'joined') {
            state.role = message.role;
            state.seat = message.seat;
            state.game = message.game;
            state.status = 'connected';
          } else if (message.type === 'game_updated') {
            state.game = message.game;
          }
        } catch {
          state.error = 'Unable to parse the server message.';
          leaveGame();
        }
      };

      connection.onerror = () => {
        if (socket !== connection) return;
        state.error = 'Connection failed. Check the server address and game ID.';
      };

      connection.onclose = () => {
        if (socket !== connection) return;

        socket = null;
        state.status = 'disconnected';
        state.role = null;
        state.seat = null;
        state.game = null;
      };
    } catch (cause) {
      leaveGame();
      showError(cause);
    }
  }

  function leaveGame() {
    const previous = socket;
    socket = null;
    previous?.close();

    state.status = 'disconnected';
    state.role = null;
    state.seat = null;
    state.game = null;
  }

  return {
    state,
    createGame,
    getGameInfo,
    joinGame,
    leaveGame,
  };
}

export type GameClient = ReturnType<typeof createGameClient>;
