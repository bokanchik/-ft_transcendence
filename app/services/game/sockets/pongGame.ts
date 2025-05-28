import { GameState, Player } from "../types/gameTypes.ts";

export class PongGame {
    state: GameState;
    matchId: string;
    interval: NodeJS.Timeout;
    
    constructor(player1: Player, player2: Player, matchId: string) {
        this.matchId = matchId;
        this.state = this.initializeGameState(player1, player2);
        this.interval = setInterval(() => this.gameLoop(), 1000 / 60); // executer 60fois/sec
    }

    initializeGameState(player1: Player, player2: Player): GameState {
        return {
            player1,
            player2,
            ball: { x: 400, y: 300, vx: 5, vy: 5},
            score1: 0,
            score2: 0
        };
    }
    
    gameLoop() {
        this.updateBall();
        this.checkCollisions();
        this.emitGameState();
    }

    updateBall() {

    }

    checkCollisions() {

    }

    emitGameState() {

    }
}



export function handlePlayerMove(leftPaddle: number, rightPaddle: number) {
    
    // gerer le mouvement de la balle 
    // gerer le score
    // gerer le deplacement des raquettes

}