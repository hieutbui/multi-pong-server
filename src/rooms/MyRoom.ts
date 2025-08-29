import { Room, Client } from '@colyseus/core';
import { MyRoomState, GameState } from './schema/MyRoomState';
import { Constants } from '../constants';
import Player from './schema/Player';

const { BALL_RADIUS, GAME_HEIGHT, GAME_WIDTH, PADDLE_WIDTH, PADDLE_HEIGHT } = Constants;

export class MyRoom extends Room<MyRoomState> {
  maxClients = 2;
  state = new MyRoomState();
  private countdownInterval: NodeJS.Timeout | null = null;

  onCreate(options: any) {
    //Listen for player paddle movement
    this.onMessage('move', (client, message) => {
      const player = this.state.players.get(client.sessionId);

      if (player) {
        player.y = message.y;
      }
    });

    // Handle restart requests
    this.onMessage('restart', (client) => {
      // Only process restart requests if game is over
      if (this.state.gameState === GameState.GAME_OVER) {
        // Reset scores for all players
        this.state.players.forEach((player, sessionId) => {
          player.score = 0;
          this.state.scores.set(sessionId, 0);
        });

        // Reset ball
        this.state.ball.reset();
        
        // Start a new game
        this.startCountdown();
      }
    });

    // Game Loop
    this.setSimulationInterval(() => {
      if (this.state.gameState === GameState.WAITING_FOR_PLAYERS) {
        if (this.clients.length === 2) {
          this.startCountdown();
        }
        return;
      }

      if (this.state.gameState === GameState.COUNTDOWN || this.state.gameState === GameState.POINT_SCORED) {
        return; // Pause ball movement during countdown or after scoring
      }

      if (this.state.gameState !== GameState.PLAYING) {
        return; // Only process physics when game is active
      }

      const ball = this.state.ball;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Ball collision with top/bottom walls
      if (ball.y - BALL_RADIUS < 0 || ball.y + BALL_RADIUS > GAME_HEIGHT) {
        ball.vy *= -1;
      }

      // Ball collision with paddles
      this.state.players.forEach((player) => {
        // Left paddle
        if (player.x < GAME_WIDTH / 2 && ball.vx < 0) {
          if (
            ball.x - BALL_RADIUS < player.x + PADDLE_WIDTH &&
            ball.y > player.y &&
            ball.y < player.y + PADDLE_HEIGHT
          ) {
            ball.vx *= -1;
            // Increase ball speed on paddle hit
            ball.increaseSpeed();
            
            // Add some angle variation based on where the ball hits the paddle
            const hitPosition = (ball.y - player.y) / PADDLE_HEIGHT; // 0 to 1
            const angleModifier = (hitPosition - 0.5) * 0.5; // -0.25 to 0.25
            ball.vy += angleModifier * ball.speed;
          }
        }
        // Right paddle
        if (player.x > GAME_WIDTH / 2 && ball.vx > 0) {
          if (
            ball.x + BALL_RADIUS > player.x && 
            ball.y > player.y && 
            ball.y < player.y + PADDLE_HEIGHT
          ) {
            ball.vx *= -1;
            // Increase ball speed on paddle hit
            ball.increaseSpeed();
            
            // Add some angle variation based on where the ball hits the paddle
            const hitPosition = (ball.y - player.y) / PADDLE_HEIGHT; // 0 to 1
            const angleModifier = (hitPosition - 0.5) * 0.5; // -0.25 to 0.25
            ball.vy += angleModifier * ball.speed;
          }
        }
      });

      // --- SCORING LOGIC ---
      const playerIds = Array.from(this.state.players.keys());
      
      // If ball goes past the right paddle, player 1 scores
      if (ball.x + BALL_RADIUS > GAME_WIDTH) {
        this.scorePoint(playerIds[0]);
      }

      // If ball goes past the left paddle, player 2 scores
      if (ball.x - BALL_RADIUS < 0) {
        this.scorePoint(playerIds[1]);
      }
    });
  }

  scorePoint(scoringPlayerId: string) {
    // Update scores in MapSchema
    const currentScore = this.state.scores.get(scoringPlayerId) || 0;
    this.state.scores.set(scoringPlayerId, currentScore + 1);

    // Update score in player object as well for backwards compatibility
    const player = this.state.players.get(scoringPlayerId);
    if (player) {
      player.score++;
    }

    // Check for game over
    if (currentScore + 1 >= this.state.winningScore) {
      this.state.gameState = GameState.GAME_OVER;
      this.state.stateMessage = `Player ${scoringPlayerId} wins!`;
      return;
    }

    // Point scored state
    this.state.gameState = GameState.POINT_SCORED;
    this.state.stateMessage = `Player ${scoringPlayerId} scored!`;

    // Reset ball after a brief pause
    this.clock.setTimeout(() => {
      this.state.ball.reset();
      this.startCountdown();
    }, 200);
  }

  startCountdown() {
    this.state.gameState = GameState.COUNTDOWN;
    this.state.countdownTime = 3;
    this.state.stateMessage = "Get ready!";

    // Clear any existing interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Start countdown
    this.countdownInterval = setInterval(() => {
      this.state.countdownTime--;
      
      if (this.state.countdownTime <= 0) {
        clearInterval(this.countdownInterval as NodeJS.Timeout);
        this.state.gameState = GameState.PLAYING;
        this.state.stateMessage = "Go!";
        
        // Clear "Go!" message after a short delay
        this.clock.setTimeout(() => {
          if (this.state.gameState === GameState.PLAYING) {
            this.state.stateMessage = "";
          }
        }, 1000);
      }
    }, 1000);
  }

  onJoin(client: Client, options: any) {
    console.log(`[${this.roomId}] CLIENT JOINED:`, client.sessionId);
    const player = new Player();

    // Assign player to left or right side based on the number of clients
    player.x = this.clients.length === 1 ? PADDLE_WIDTH * 2 : GAME_WIDTH - PADDLE_WIDTH * 3;

    // Set player in the players map
    this.state.players.set(client.sessionId, player);
    
    // Initialize score for this player
    this.state.scores.set(client.sessionId, 0);

    if (this.clients.length === this.maxClients) {
      this.lock();
      console.log(`[${this.roomId}] Room is now locked.`);
      this.startCountdown();
    } else {
      this.state.gameState = GameState.WAITING_FOR_PLAYERS;
      this.state.stateMessage = "Waiting for opponent...";
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`[${this.roomId}] CLIENT LEFT:`, client.sessionId);
    
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
    }
    
    if (this.state.scores.has(client.sessionId)) {
      this.state.scores.delete(client.sessionId);
    }
    
    // If a player leaves during the game, end it
    if (this.state.gameState === GameState.PLAYING || 
        this.state.gameState === GameState.COUNTDOWN) {
      this.state.gameState = GameState.WAITING_FOR_PLAYERS;
      this.state.stateMessage = "Game ended: opponent left";
      
      // Clear any active countdown
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
