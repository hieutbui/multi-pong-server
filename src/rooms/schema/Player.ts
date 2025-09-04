import { Schema, type } from '@colyseus/schema';
import { Constants } from '../../constants';

const { GAME_WIDTH, PADDLE_WIDTH } = Constants;

export default class Player extends Schema {
  @type('number')
  x: number = GAME_WIDTH / 2 - PADDLE_WIDTH / 2;

  @type('number')
  y: number = 0;

  @type('number')
  score: number = 0;

  @type('string')
  position: string = 'bottom'; // Can be 'top' or 'bottom'
}
