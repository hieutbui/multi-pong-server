import { MapSchema, Schema, type } from '@colyseus/schema';
import Player from './Player';
import Ball from './Ball';

// Game state enum
export enum GameState {
  WAITING_FOR_PLAYERS = "waiting_for_players",
  COUNTDOWN = "countdown",
  PLAYING = "playing",
  POINT_SCORED = "point_scored",
  GAME_OVER = "game_over"
}

export class MyRoomState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type(Ball)
  ball = new Ball();
  
  @type({ map: "number" })
  scores = new MapSchema<number>();
  
  @type("string")
  gameState: string = GameState.WAITING_FOR_PLAYERS;
  
  @type("string")
  stateMessage: string = "Waiting for players...";
  
  @type("number")
  countdownTime: number = 3;
  
  @type("number")
  winningScore: number = 10;
}
