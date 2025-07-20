export interface Match {
    round: number;
    player1: string;
    player2: string;
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

export function singleEliminationMatches(participants: string[]): Match[] {
    const shuffled: string[] = shuffle([...participants]);

    const pairs: [string, string][] = makePairs(shuffled);

    return pairs.map(([p1, p2]) => ({
        round: 1,
        player1: p1,
        player2: p2,
    }))
}