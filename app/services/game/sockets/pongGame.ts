//@ts-ignore
import { GameState } from "./shared/types.js";
import { W, S, ARROW_UP, ARROW_DOWN, PADDLE_SPEED, GAME_HEIGHT, GAME_WIDTH, PADDLE_HEIGHT, FINAL_SCORE } from "../utils/constants.ts";
import { fastify } from "../server.ts";
import { Socket } from "socket.io";

export function createGameState(): GameState {
    return {
       leftPaddle: {
            lowerEdgePos: 200,
            velocity: 100
	    },
	    rightPaddle: {
            lowerEdgePos: 200,
            velocity: 100
	    },
        ball: {
            x: 400,
            y: 250,
            vectorX: 0,
            vectorY: 0,
            velocity: 0,
            radius: 25
        },
        score1: 0, 
        score2: 0
    }
}

export function gameLoop(state: GameState, socket: Socket): number {    
    const ball = state.ball;
    const leftPaddle = state.leftPaddle;
    const rightPaddle = state.rightPaddle;

    // 1. move the ball
    ball.x += ball.vx;
    ball.y += ball.vy;
    
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
        updateScore(state, 'right', socket);
        resetBall(state);
    }
    if (ball.x + ball.radius >= GAME_WIDTH) {
        updateScore(state, 'left', socket);
        resetBall(state);
    }
    
    // 5. return 0 - continues, 1/2 if there is a winner
    if (state.score1 == FINAL_SCORE) {
        return 1; // leftPlayer won
    } else if (state.score2 == FINAL_SCORE) {
        return 2; // rightPlayer won
    }

  //  fastify.log.info('Score Left: ' + score1 + 'Score right ' + score2);
    
    return 0;
}

function updateScore(state: GameState, side: string, socket: Socket) {
    if (side === 'left') {
        state.score1++;
    } else if (side === 'right') {
        state.score2++;
    }
    
    const data = {
        score1: state.score1,
        score2: state.score2
    }

    socket.emit('scoreUpdated', (data));
    fastify.log.info(`New state.score ${state.score1} : ${state.score2}`);
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

export function handleKeydown(socket: Socket, key: number, state: GameState) {
    
    switch (key) {
        case (S): // jouer a gauche
            state.leftPaddle.lowerEdgePos += PADDLE_SPEED;
            socket.emit('leftPaddle', state.leftPaddle.lowerEdgePos);
            break;
            case (ARROW_DOWN): // jouer a droite
            state.rightPaddle.lowerEdgePos += PADDLE_SPEED;
            const data = {
                lowerEdgePos: state.rightPaddle.lowerEdgePos,
                velocity: state.rightPaddle.velocity,
            }
            socket.emit('rightPaddle', (data));
            break;
        case (W):
            state.leftPaddle.lowerEdgePos += -PADDLE_SPEED;
            socket.emit('leftPaddle', state.leftPaddle.lowerEdgePos);
            break;
        case (ARROW_UP):
            state.rightPaddle.lowerEdgePos += -PADDLE_SPEED;
            socket.emit('rightPaddle', state.rightPaddle.lowerEdgePos,  state.rightPaddle.velocity);
            break;
        default:
            break;
        }
}
            
