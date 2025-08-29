import { Schema, type } from '@colyseus/schema';
import { Constants } from '../../constants';

const { GAME_HEIGHT, PADDLE_HEIGHT } = Constants;

export default class Player extends Schema {
  @type('number')
  x: number = 0;

  @type('number')
  y: number = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;

  @type('number')
  score: number = 0;
}
