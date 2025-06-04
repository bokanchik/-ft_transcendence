//@ts-ignore
import { GameState } from "./shared/types.js";
import { W, S, ARROW_UP, ARROW_DOWN, PADDLE_SPEED, GAME_HEIGHT, GAME_WIDTH, PADDLE_HEIGHT, FINAL_SCORE } from "../utils/constants.ts";
import { fastify } from "../server.ts";
import { Socket } from "socket.io";

const keyState = {
    W: false,
    S: false, 
    UP: false,
    DOWN: false
};

let score1: number = 0; // left player
let score2: number = 0; // right player

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
            vx: 3,
            vy: 3,
            radius: 15
        },
    }
}

export function gameLoop(state: GameState, socket: Socket): number {    
    const ball = state.ball;
    const leftPaddle = state.leftPaddle;
    const rightPaddle = state.rightPaddle;
    
    // 1. move the ball
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (keyState.W) state.leftPaddle.y -= PADDLE_SPEED;
    if (keyState.S) state.leftPaddle.y += PADDLE_SPEED;
    if (keyState.UP) state.rightPaddle.y -= PADDLE_SPEED;
    if (keyState.DOWN) state.rightPaddle.y += PADDLE_SPEED;

    // 2. move the paddles with bounds check
    leftPaddle.y = Math.min(leftPaddle.y, GAME_HEIGHT - PADDLE_HEIGHT);
    rightPaddle.y = Math.min(rightPaddle.y, GAME_HEIGHT - PADDLE_HEIGHT);
    
    leftPaddle.y = Math.max(leftPaddle.y, 0);
    rightPaddle.y = Math.max(rightPaddle.y, 0);
    
    // bounce on top or bottom
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= GAME_HEIGHT) {
        ball.vy *= -1; // renverser la vitesse de la balle
    }
    
    // 3. detect collision of a ball (with walls and paddles)
    if (isBallCollision(ball, leftPaddle) && ball.vx < 0) {
        ball.vx = -ball.vx; // update ball direction on collision
    } else if (isBallCollision(ball, rightPaddle) && ball.vx > 0) {
        ball.vx = -ball.vx;
    }
    
    // 4. check if a player scored (si la balle a touche le mur -> but !)
    if (ball.x - ball.radius <= 0) {
        updateScore('right', socket);
        resetBall(state);
    }
    if (ball.x + ball.radius >= GAME_WIDTH) {
        updateScore('left', socket);
        resetBall(state);
    }
    
    // 5. return 0 - continues, 1/2 if there is a winner
    if (score1 == FINAL_SCORE) {
        return 1; // leftPlayer won
    } else if (score2 == FINAL_SCORE) {
        return 2; // rightPlayer won
    }
    
    return 0;
}

function updateScore(side: string, socket: Socket) {
    if (side === 'left') {
        score1++;
    } else if (side === 'right') {
        score2++;
    }
    socket.emit('scoreUpdated', ({ score1, score2 }));
    fastify.log.info(`New score ${score1} : ${score2}`);
}

function resetBall(state: GameState) {
    state.ball.x = 400;
    state.ball.y = 250;
    state.ball.vx = -state.ball.vx;
    state.ball.vy = -state.ball.vy;
}

function isBallCollision(ball: any, paddle: any): boolean {
    // 1. Calculate the center x and y of a paddle, using the left corner x and y
    const paddleCenterX = paddle.x + paddle.width / 2;
    const paddleCenterY = paddle.y + paddle.height / 2;

    // 2.   Calculate the absolute values of the x and y difference between
    //      the center of a ball and a paddle
    const ballDistanceX = Math.abs(ball.x - paddleCenterX);
    const ballDistanceY = Math.abs(ball.y - paddleCenterY);
    
    // 3.   Easy case where the ball is far away from the paddle
    if (ballDistanceX > (paddle.width / 2 + ball.radius)) { return false; }
    if (ballDistanceY > (paddle.height / 2 + ball.radius)) { return false; }
    
    // 4.   The ball is close enough to the paddle, an intersection is guaranteed
    if (ballDistanceX <= (paddle.width / 2)) { return true; }
    if (ballDistanceY <= (paddle.height / 2)) { return true; }
    
    // 5.   The difficul case where the ball may intersect the corcner of a paddle.
    //      Calculate the distance from the center of the ball and the corner, and
    //      then verify that the distance is not more than the radius of a ball
    const cornerDistanceSq = Math.pow(ballDistanceX - paddle.width / 2, 2) +
    Math.pow(ballDistanceY - paddle.height / 2, 2);
    
    return (cornerDistanceSq <= (Math.pow(ball.radius, 2)));
    
}

export function resetScore() {
    score1 = 0;
    score2 = 0;
}

export function handleKeydown(key: number) {
    
    switch (key) {
        case W: keyState.W = true; break;
        case S: keyState.S = true; break;
        case ARROW_UP: keyState.UP = true; break;
        case ARROW_DOWN: keyState.DOWN = true; break;
    }
}
            
export function handleKeyup(key: number) {
    switch (key) {
        case W: keyState.W = false; break;
        case S: keyState.S = false; break;
        case ARROW_UP: keyState.UP = false; break;
        case ARROW_DOWN: keyState.DOWN = false; break;
    }
}
      