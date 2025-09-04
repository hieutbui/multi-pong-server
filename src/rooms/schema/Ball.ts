import { Schema, type } from '@colyseus/schema';
import { Constants } from '../../constants';

const { GAME_WIDTH, GAME_HEIGHT } = Constants;

export default class Ball extends Schema {
  @type('number')
  x: number = GAME_WIDTH / 2;

  @type('number')
  y: number = GAME_HEIGHT / 2;

  @type('number')
  vx: number = (Math.random() - 0.5) * 3; // Small horizontal component

  @type('number')
  vy: number = (Math.random() > 0.5 ? 1 : -1) * 5; // Larger vertical component for vertical gameplay
  
  @type('number')
  speed: number = 5;
  
  @type('number')
  maxSpeed: number = 15;
  
  // Reset the ball to center with random direction, favoring vertical movement
  reset() {
    this.x = GAME_WIDTH / 2;
    this.y = GAME_HEIGHT / 2;
    
    // Random angle between -30 and 30 degrees from vertical (in radians)
    const angle = (Math.random() * 60 - 30) * Math.PI / 180;
    
    // Randomize direction (up or down)
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    // Set initial speed
    this.speed = 5;
    
    // For vertical gameplay, vy is the primary component (using sin for vertical)
    // and vx is secondary (using cos for horizontal)
    this.vy = direction * this.speed * Math.cos(angle);
    this.vx = this.speed * Math.sin(angle);
  }
  
  // Increase ball speed up to maxSpeed
  increaseSpeed() {
    if (this.speed < this.maxSpeed) {
      this.speed += 0.5;
      
      // Maintain direction but increase magnitude
      const currentAngle = Math.atan2(this.vx, this.vy); // Note: swapped to put vy as primary
      this.vy = this.speed * Math.cos(currentAngle);
      this.vx = this.speed * Math.sin(currentAngle);
    }
  }
}
