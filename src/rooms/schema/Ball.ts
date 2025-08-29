import { Schema, type } from '@colyseus/schema';
import { Constants } from '../../constants';

const { GAME_WIDTH, GAME_HEIGHT } = Constants;

export default class Ball extends Schema {
  @type('number')
  x: number = GAME_WIDTH / 2;

  @type('number')
  y: number = GAME_HEIGHT / 2;

  @type('number')
  vx: number = (Math.random() > 0.5 ? 1 : -1) * 5;

  @type('number')
  vy: number = (Math.random() > 0.5 ? 1 : -1) * 5;
  
  @type('number')
  speed: number = 5;
  
  @type('number')
  maxSpeed: number = 15;
  
  // Reset the ball to center with random direction
  reset() {
    this.x = GAME_WIDTH / 2;
    this.y = GAME_HEIGHT / 2;
    
    // Random angle between -45 and 45 degrees (in radians)
    const angle = (Math.random() * 90 - 45) * Math.PI / 180;
    
    // Randomize direction (left or right)
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    // Set initial speed
    this.speed = 5;
    
    // Set velocity components based on angle and speed
    this.vx = direction * this.speed * Math.cos(angle);
    this.vy = this.speed * Math.sin(angle);
  }
  
  // Increase ball speed up to maxSpeed
  increaseSpeed() {
    if (this.speed < this.maxSpeed) {
      this.speed += 0.5;
      
      // Maintain direction but increase magnitude
      const currentAngle = Math.atan2(this.vy, this.vx);
      this.vx = this.speed * Math.cos(currentAngle);
      this.vy = this.speed * Math.sin(currentAngle);
    }
  }
}
