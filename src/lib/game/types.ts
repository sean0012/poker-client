export type Role = 'player' | 'spectator';
export type Status = 'disconnected' | 'connecting' | 'connected';
export type Gaze = 'opponent' | 'table';

export type Player = {
  seat: number;
  connected: boolean;
  initial_chips: number;
  current_chips: number;
  gaze: Gaze;
};

export type Game = {
  id: string;
  name: string;
  deck_size: number;
  remaining_cards: number;
  players: [Player, Player];
  spectators: number;
  pot: number;
  history: string[];
};

export type ServerEvent =
  | {
      type: 'joined';
      role: Role;
      seat: number | null;
      game: Game;
    }
  | {
      type: 'game_updated';
      game: Game;
    }
  | {
      type: 'error';
      message: string;
    };