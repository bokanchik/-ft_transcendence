export interface Paddle {
    y: number,
};

export interface Ball {
    x: number,
    y: number,
}

export interface GameState {
    leftPaddle: Paddle,
    rightPaddle: Paddle,
    ball: Ball,
    score1: number,
    score2: number,
}

export interface Velocity {
  x: number;
  y: number;
};

// ! n'a pas fonctionne pour le frontends avec './shared/constants.js' !
export const TIMEOUT_MS: number  = 60000;
export const FRAME_RATE: number = 60;
export const W: number = 87;
export const S: number  = 83;
export const ARROW_UP: number = 38;
export const ARROW_DOWN: number = 40;
export const PADDLE_SPEED: number = 10;
export const GAME_HEIGHT: number = 500;
export const GAME_WIDTH: number = 800;
export const BALL_RADIUS: number = 15;
export const PADDLE_HEIGHT: number  = 120;
export const PADDLE_WIDTH: number  = 20;
export const FINAL_SCORE: number  = 5;
export const MAX_SPEED: number  = 15;
export const PADDLE_X_LEFT = 20;
export const PADDLE_X_RIGHT = 770;
