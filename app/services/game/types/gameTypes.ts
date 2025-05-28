export interface Player {
    userId: number;
    socketId: string;
    paddle: number;
}

export interface Ball {
    x: number; // position horizontale
    y: number; // position verticale
    vx: number; // vitesse horizantale
    vy: number; // vitesse verticale
};

export interface GameState {
    player1: Player;
    player2: Player;
    ball: Ball;
    score1: number;
    score2: number;
}