export function shuffle(players: string[]) {
    let j, x, i;
    for (i = players.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = players[i];
        players[i] = players[j];
        players[j] = x;
    }
    return players;
}

export function makePairs(arr: string[]) {
    let oddElem: string | undefined;
    const pairs: [string, string | null][]  = [];

    if (arr.length % 2 !== 0) {
        oddElem = arr.pop();
    }

    for (let i = 0; i < arr.length; i+= 2) {
        if (arr[i + 1] !== undefined) {
            pairs.push([arr[i], arr[i + 1]]);
        }
    }

    return { pairs, oddElem };
}