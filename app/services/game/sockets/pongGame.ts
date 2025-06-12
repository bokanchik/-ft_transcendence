//@ts-ignore
import { GameState, W, S, ARROW_UP, ARROW_DOWN, PADDLE_SPEED, GAME_HEIGHT, GAME_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH, FINAL_SCORE, MAX_SPEED, PADDLE_X_LEFT, PADDLE_X_RIGHT } from "../shared/gameTypes.js";
import { fastify } from "../server.ts";
import { Socket } from "socket.io";

const keyState = {
    local: {
        W: false,
        S: false, 
        UP: false,
        DOWN: false
    },
    remote: {
        left: {
            UP: false,
            DOWN: false,
        },
        right: {
            UP: false,
            DOWN: false,
        }
    }
};

export function createGameState(): GameState {
    return {
        leftPaddle: {
            y: 200,
            vy: 0,
        },
        rightPaddle: {
            y: 200,
            vy: 0,
        },
        ball: {
            x: 400,
            y: 250,
            vx: 5,
            vy: 2,
            radius: 15
        },
        score1: 0, // left
        score2: 0, // right
    }
}

export function gameLoop(state: GameState, mode: string): number {    
    const ball = state.ball;
    const leftPaddle = state.leftPaddle;
    const rightPaddle = state.rightPaddle;
    
    // 1. move the ball
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // 2. move the paddles with bounds check
    if (mode === 'local') {
        if (keyState.local.W) state.leftPaddle.y -= PADDLE_SPEED;
        if (keyState.local.S) state.leftPaddle.y += PADDLE_SPEED;
        if (keyState.local.UP) state.rightPaddle.y -= PADDLE_SPEED;
        if (keyState.local.DOWN) state.rightPaddle.y += PADDLE_SPEED;
    } else if (mode === 'remote') {
        if (keyState.remote.left.UP) state.leftPaddle.y -= PADDLE_SPEED;
        if (keyState.remote.left.DOWN) state.leftPaddle.y += PADDLE_SPEED;
        if (keyState.remote.right.UP) state.rightPaddle.y -= PADDLE_SPEED;
        if (keyState.remote.right.DOWN) state.rightPaddle.y += PADDLE_SPEED;
    }

    leftPaddle.y = Math.min(leftPaddle.y, GAME_HEIGHT - PADDLE_HEIGHT);
    rightPaddle.y = Math.min(rightPaddle.y, GAME_HEIGHT - PADDLE_HEIGHT);
    
    leftPaddle.y = Math.max(leftPaddle.y, 0);
    rightPaddle.y = Math.max(rightPaddle.y, 0);
    
    // bounce on top or bottom
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= GAME_HEIGHT) {
        ball.vy *= -1; // renverser la vitesse de la balle
    }
    
    // 3. detect collision of a ball (with walls and paddles) et changer la vitesse de la balle + l'angle
    if (isBallCollision(ball, PADDLE_X_LEFT, leftPaddle.y) && ball.vx < 0) {
        const impactY = (ball.y - (leftPaddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.vx = Math.min(-ball.vx * 1.05, MAX_SPEED); // Inverser et accélérer horizontalement
        ball.vy = ball.vy + impactY * 2; // Modifier l’angle verticalement
    } else if (isBallCollision(ball, PADDLE_X_RIGHT, rightPaddle.y) && ball.vx > 0) {
        const impactY = (ball.y - (rightPaddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.vx = Math.max(-ball.vx * 1.05, -MAX_SPEED);
        ball.vy = ball.vy + impactY * 2;
    }
    
    
    // 4. check if a player scored (si la balle a touche le mur -> but !)
    if (ball.x - ball.radius <= 0) {
        updateScore('right', state);
        resetBall(state);
    }
    if (ball.x + ball.radius >= GAME_WIDTH) {
        updateScore('left', state);
        resetBall(state);
    }
    
    // 5. return 0 - continues, 1/2 if there is a winner
    if (state.score1 == FINAL_SCORE) {
        return 1; // leftPlayer won
    } else if (state.score2 == FINAL_SCORE) {
        return 2; // rightPlayer won
    }
    
    return 0;
}

function updateScore(side: string, state: GameState) {
    if (side === 'left') {
        state.score1++;
    } else if (side === 'right') {
        state.score2++;
    }
   
    fastify.log.info(`New score {${state.score1}} : {${state.score2}}`);
}

function resetBall(state: GameState) {
    state.ball.x = GAME_WIDTH / 2;
    state.ball.y = GAME_HEIGHT / 2;

    // Valeurs de vitesse de base
    const baseSpeedX = 5;
    const baseSpeedY = 2;

    // Direction aléatoire : -1 ou 1
    const directionX = Math.random() < 0.5 ? -1 : 1;
    const directionY = Math.random() < 0.5 ? -1 : 1;

    state.ball.vx = baseSpeedX * directionX;
    state.ball.vy = baseSpeedY * directionY;
}


function isBallCollision(ball: any, paddleX: any, paddleY): boolean {
    // 1. Calculate the center x and y of a paddle, using the left corner x and y
    const paddleCenterX = paddleX + PADDLE_WIDTH / 2;
    const paddleCenterY = paddleY + PADDLE_HEIGHT / 2;

    // 2.   Calculate the absolute values of the x and y difference between
    //      the center of a ball and a paddle
    const ballDistanceX = Math.abs(ball.x - paddleCenterX);
    const ballDistanceY = Math.abs(ball.y - paddleCenterY);
    
    // 3.   Easy case where the ball is far away from the paddle
    if (ballDistanceX > (PADDLE_WIDTH / 2 + ball.radius)) { return false; }
    if (ballDistanceY > (PADDLE_HEIGHT / 2 + ball.radius)) { return false; }
    
    // 4.   The ball is close enough to the paddle, an intersection is guaranteed
    if (ballDistanceX <= (PADDLE_WIDTH / 2)) { return true; }
    if (ballDistanceY <= (PADDLE_HEIGHT / 2)) { return true; }
    
    // 5.   The difficul case where the ball may intersect the corcner of a paddle.
    //      Calculate the distance from the center of the ball and the corner, and
    //      then verify that the distance is not more than the radius of a ball
    const cornerDistanceSq = Math.pow(ballDistanceX - PADDLE_WIDTH / 2, 2) +
    Math.pow(ballDistanceY - PADDLE_HEIGHT / 2, 2);
    
    return (cornerDistanceSq <= (Math.pow(ball.radius, 2)));
    
}

export function handleKeydownRemote(key: number, side: string, state: GameState) {
    switch (key) {
        case ARROW_UP: keyState.remote[side].UP = true; break;
        case ARROW_DOWN: keyState.remote[side].DOWN = true; break;
    }
}

export function handleKeyupRemote(key: number, side: string, state: GameState) {
    switch (key) {
            case ARROW_UP: keyState.remote[side].UP = false; break;
            case ARROW_DOWN: keyState.remote[side].DOWN = false; break;
    }
}

export function handleKeydown(key: number) {
    
    switch (key) {
        case W: keyState.local.W = true; break;
        case S: keyState.local.S = true; break;
        case ARROW_UP: keyState.local.UP = true; break;
        case ARROW_DOWN: keyState.local.DOWN = true; break;
    }
}
            
export function handleKeyup(key: number) {
    switch (key) {
        case W: keyState.local.W = false; break;
        case S: keyState.local.S = false; break;
        case ARROW_UP: keyState.local.UP = false; break;
        case ARROW_DOWN: keyState.local.DOWN = false; break;
    }
}
      