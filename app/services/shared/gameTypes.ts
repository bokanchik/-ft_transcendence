export interface Paddle {
    lowerEdgePos: number,
    velocity: number // vitesse y
};

export interface Ball {
    x: number,
    y: number,
    vectorX: number, // vitesse x
    vectorY: number, // vitesse y
    velocity: number,
    radius: number
}

export interface GameState {
    leftPaddle: Paddle,
    rightPaddle: Paddle,
    ball: Ball,
    score0: number,
    score1: number
    // peut-etre rajouter le score?
}