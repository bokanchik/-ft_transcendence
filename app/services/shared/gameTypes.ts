export interface Paddle {
    x: number,
    y: number,
    width: number,
    height: number,
    vy: number // vitesse y
};

export interface Ball {
    x: number,
    y: number,
    vx: number, // vitesse x
    vy: number, // vitesse y
    radius: number
}

export interface GameState {
    leftPaddle: Paddle,
    rightPaddle: Paddle,
    ball: Ball,
    // score0: number,
    // score1: number
    // peut-etre rajouter le score?
}