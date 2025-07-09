import { fastify }from "../server.ts";

export interface Match {
    id: string;
    round: number;
    player1: string;
    player2: string;
    score1?: number;
    score2?: number;
    winner?: string;
}

export function shuffle(players: string[]): string[] {
    let j: number, x: string, i: number;
    for (i = players.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = players[i];
        players[i] = players[j];
        players[j] = x;
    }
    return players;
}

export function makePairs(arr: string[]): [string, string][] {
    const copy: string[] = [...arr];
    const pairs: [string, string][] = [];

    for (let i = 0; i < copy.length; i+= 2) {
        if (copy[i + 1] !== undefined) {
            pairs.push([copy[i], copy[i + 1]]);
        }
    }

    return pairs;
}

// function to create matches for Round 1
export async function singleEliminationMatches(participants: string[]): Promise<Match[]> {
    const shuffled: string[] = shuffle([...participants]);

    const pairs: [string, string][] = makePairs(shuffled);

    const matches: Match[] = [];

    for (const [player1, player2] of pairs) {
        const matchId = await requestMatchFormGameService(player1, player2);
        
        fastify.log.info(`Match for players ${player1} and ${player2} created with matchId = ${matchId}`);

        matches.push({
            id: matchId,
            round: 1,
            player1,
            player2
        });
    }
    return matches;
}

export async function requestMatchFormGameService(player1: string, player2: string): Promise<string> {
    const response = await fetch("http://game:3001/api/game/match/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player1, player2 })
    });

    if (!response.ok) {
        throw new Error(`Failed to create a match: ${await response.text()}`);
    }

    const data = await response.json();

    return data.matchId;
}