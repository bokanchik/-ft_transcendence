import { Match } from "./matchmaking.tournament.ts";

export interface Tournament {
    id: string;
    matches: Match[];
}

const tournaments: Record<string, Tournament> = {};

export function createTournament(id: string, matches: Match[]) {
    tournaments[id] = { id, matches }
}

export function getTournament(id: string): Tournament | undefined {
    return tournaments[id];
}

