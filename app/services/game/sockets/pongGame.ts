//@ts-ignore
import { GameState } from "./shared/types.js";
import { W, S, ARROW_UP, ARROW_DOWN, PADDLE_SPEED } from "../utils/constants.ts";

export function createGameState(): GameState {
    return {
        leftPaddle: {
            x: 20,
            y: 200,
            width: 20,
            height: 120,
            vy: 0
        },
        rightPaddle: {
            x: 770,
            y: 200,
            width: 20,
            height: 120,
            vy: 0
        },
        ball: {
            x: 400,
            y: 250,
            vx: 10,
            vy: 5,
            radius: 25
        },
    }
}

export function gameLoop(state: GameState): number {
    // TODO:
    // definir les limites pour les mouvements des paddles
    // check if ball a touche le mur -> score doit etre change
    // check if score == 10, return 1/2 (ca depend qui a gagne)

    
    const ball = state.ball;
    const leftPaddle = state.leftPaddle;
    const rightPaddle = state.rightPaddle;
    
    // 1. move the ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 2. move the paddles
    leftPaddle.y += leftPaddle.vy;
    rightPaddle.y += rightPaddle.vy;
    
    // bounce on top or bottom
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= 500) {
        ball.vy *= -1;
    }

    // bounce on left or right
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= 800) {
        ball.vx *= -1;
    }

    // 3. detect collision of a ball (with walls and paddles)
    if (isBallCollision(ball, leftPaddle) && ball.vx < 0) {
        ball.vx = -ball.vx; // update ball direction on collision
    } else if (isBallCollision(ball, rightPaddle) && ball.vx > 0) {
        ball.vx = -ball.vx;
    }

    // 4. check if a player scored (si la balle a touche le mur -> but !)

    // 5. return 0 - continues, 1/2 if there is a winner

    return (0);
}

function isBallCollision(ball: any, paddle: any): boolean {
    
    if (ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y + ball.radius > paddle.y && 
        ball.y - ball.radius < paddle.y + paddle.height
    ) return true;
    return false;
}

export function handleKeydown(key: number, state: GameState) {

    switch (key) {
        case (S): // jouer a gauche
            state.leftPaddle.vy = PADDLE_SPEED;
            break;
        case (ARROW_DOWN): // jouer a droite
            state.rightPaddle.vy = PADDLE_SPEED;
            break;
        default: 
            state.leftPaddle.vy = 0;
            state.rightPaddle.vy = 0;
            break;
    }
}

export function handleKeyup(key: number, state: GameState) {
    switch (key) {
        case (W):
            state.leftPaddle.vy = -PADDLE_SPEED;
            break;
        case (ARROW_UP):
            state.rightPaddle.vy = -PADDLE_SPEED;
            break;
        default:
            state.leftPaddle.vy = 0;
            state.rightPaddle.vy = 0;
            break;
    }
}