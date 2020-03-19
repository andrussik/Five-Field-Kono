export enum PlayerName {
    playerOne,
    playerTwo
}

export class Player {
    name: PlayerName;
    score: number;
    isAI: boolean;

    constructor(playerName: PlayerName, score: number, isAI: boolean) {
        this.name = playerName;
        this.score = score;
        this.isAI = isAI;
    }
}