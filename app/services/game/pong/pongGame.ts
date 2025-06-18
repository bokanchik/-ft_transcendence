//@ts-ignore
import { GameState, Velocity, W, S, ARROW_UP, ARROW_DOWN, PADDLE_SPEED, GAME_HEIGHT, GAME_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH, FINAL_SCORE, MAX_SPEED, PADDLE_X_LEFT, PADDLE_X_RIGHT, BALL_RADIUS } from "../shared/gameTypes.js";
import { fastify } from "../server.ts";

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

export function createBallState(): Velocity {
    return {
        x: 5,
        y: 2
    }
}

export function createGameState(): GameState {
    return {
        leftPaddle: {
            y: 200,
        },
        rightPaddle: {
            y: 200,
        },
        ball: {
            x: 400,
            y: 250,
        },
        score1: 0,
        score2: 0, 
    }
}

export function gameLoop(state: GameState, velocity: Velocity, mode: string): { winner: number, goalScored: boolean } {    
    const ball = state.ball;
    const leftPaddle = state.leftPaddle;
    const rightPaddle = state.rightPaddle;
    let goalScored = false;

    // --- 1. move the ball ---
    ball.x += velocity.x;
    ball.y += velocity.y;
    
    // --- 2. move the paddles according to a game mode: ---
    //        local: W, S -> leftPaddle, UP, DOWN -> rightPaddle
    //        remote: depending on side parameter, only UP, DOWN key available
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
    
    // --- 3. check for bounds with game canvas ---
    leftPaddle.y = Math.min(leftPaddle.y, GAME_HEIGHT - PADDLE_HEIGHT);
    rightPaddle.y = Math.min(rightPaddle.y, GAME_HEIGHT - PADDLE_HEIGHT);
    
    leftPaddle.y = Math.max(leftPaddle.y, 0);
    rightPaddle.y = Math.max(rightPaddle.y, 0);
    
    // --- 4. bounce the ball on top or bottom ---
    if (ball.y - BALL_RADIUS <= 0 || ball.y + BALL_RADIUS >= GAME_HEIGHT) {
       velocity.y *= -1; // renverser la direction Y de la balle
    }
    
    // --- 5. detect collision of a ball (with walls and paddles) and change
    //        the direction and angle for the ball --- 
    if (isBallCollision(ball, PADDLE_X_LEFT, leftPaddle.y) && velocity.x < 0) {
        const impactY = (ball.y - (leftPaddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        velocity.x = Math.min(-velocity.x * 1.05, MAX_SPEED); // Inverser et accélérer horizontalement
        velocity.y = velocity.y + impactY * 2; // Modifier l’angle verticalement
    } else if (isBallCollision(ball, PADDLE_X_RIGHT, rightPaddle.y) && velocity.x > 0) {
        const impactY = (ball.y - (rightPaddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        velocity.x = Math.max(-velocity.x * 1.05, -MAX_SPEED);
        velocity.y = velocity.y + impactY * 2;
    }
    
    // --- 6. check if a player scored (si la balle a touche le mur -> but !), then reset 
    //         ball direction and notify the client with goalScored=true value ---
    if (ball.x - BALL_RADIUS <= 0) {
        updateScore('right', state);
        resetBall(state, velocity);
        goalScored = true;
    }

    if (ball.x + BALL_RADIUS >= GAME_WIDTH) {
        updateScore('left', state);
        resetBall(state, velocity);
        goalScored = true;
    }
    
    // --- 7. handle the main loop return value:
    //        return 0 - game continues, 1 || 2 if there is a winner
    if (state.score1 == FINAL_SCORE) {
        return { winner: 1, goalScored }; // leftPlayer won
    } else if (state.score2 == FINAL_SCORE) {
        return { winner: 2, goalScored }; // rightPlayer won
    }
    
    return { winner: 0, goalScored };
}

function updateScore(side: string, state: GameState) {
    if (side === 'left') {
        state.score1++;
    } else if (side === 'right') {
        state.score2++;
    }
   
    fastify.log.info(`New score {${state.score1}} : {${state.score2}}`);
}

function resetBall(state: GameState, velocity: Velocity) {
    state.ball.x = GAME_WIDTH / 2;
    state.ball.y = GAME_HEIGHT / 2;

    // Valeurs de vitesse de base
    const baseSpeedX = 5;
    const baseSpeedY = 2;

    // Direction aléatoire : -1 ou 1
    const directionX = Math.random() < 0.5 ? -1 : 1;
    const directionY = Math.random() < 0.5 ? -1 : 1;

    velocity.x = baseSpeedX * directionX;
    velocity.y = baseSpeedY * directionY;
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
    if (ballDistanceX > (PADDLE_WIDTH / 2 + BALL_RADIUS)) { return false; }
    if (ballDistanceY > (PADDLE_HEIGHT / 2 + BALL_RADIUS)) { return false; }
    
    // 4.   The ball is close enough to the paddle, an intersection is guaranteed
    if (ballDistanceX <= (PADDLE_WIDTH / 2)) { return true; }
    if (ballDistanceY <= (PADDLE_HEIGHT / 2)) { return true; }
    
    // 5.   The difficult case where the ball may intersect the corner of a paddle.
    //      Calculate the distance from the center of the ball and the corner, and
    //      then verify that the distance is not more than the radius of a ball
    const cornerDistanceSq = Math.pow(ballDistanceX - PADDLE_WIDTH / 2, 2) +
            Math.pow(ballDistanceY - PADDLE_HEIGHT / 2, 2);
    
    return (cornerDistanceSq <= (Math.pow(BALL_RADIUS, 2)));
    
}

// --- KeyInput Handlers for local && remote mode ---
export function handleKeydownRemote(key: number, side: string) {
    switch (key) {
        case ARROW_UP: keyState.remote[side].UP = true; break;
        case ARROW_DOWN: keyState.remote[side].DOWN = true; break;
    }
}

export function handleKeyupRemote(key: number, side: string) {
    switch (key) {
            case ARROW_UP: keyState.remote[side].UP = false; break;
            case ARROW_DOWN: keyState.remote[side].DOWN = false; break;
    }
}

export function handleKeydownLocal(key: number) {
    switch (key) {
        case W: keyState.local.W = true; break;
        case S: keyState.local.S = true; break;
        case ARROW_UP: keyState.local.UP = true; break;
        case ARROW_DOWN: keyState.local.DOWN = true; break;
    }
}
            
export function handleKeyupLocal(key: number) {
    switch (key) {
        case W: keyState.local.W = false; break;
        case S: keyState.local.S = false; break;
        case ARROW_UP: keyState.local.UP = false; break;
        case ARROW_DOWN: keyState.local.DOWN = false; break;
    }
}
      