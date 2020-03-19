import { GameMode } from './GameMode'
import { Player } from './Player'
import { PlayerName } from './Player'
import { Button } from './Button';


export class GameEngine {

    board: number[][];
    boardStates: string[] = [];
    buttons: Button[];
    gameMode: GameMode;
    playerOne: Player;
    playerTwo: Player;
    playerOneMove: boolean;
    selectedId?: number;
    score: number;
    winner?: Player;
    _playerOneStartIds: number[] = [16, 20, 21, 22, 23, 24, 25];
    _playerTwoStartIds: number[] = [1, 2, 3, 4, 5, 6, 10];

    constructor(gameMode: GameMode) {
        this.board = [];
        this.buttons = [];
        this.gameMode = gameMode;
        this.playerOne = new Player(PlayerName.playerOne, 0, false)
        this.playerTwo = new Player(PlayerName.playerTwo, 0, false)
        this.playerOneMove = true;
        this.score = 0;

        if (gameMode === GameMode.PvAI) {
            this.playerTwo.isAI = true;
        } else if (gameMode === GameMode.AIvAI) {
            this.playerOne.isAI = true;
            this.playerTwo.isAI = true;
        }

        let id = 1;
        for (var i: number = 0; i < 5; i++) {
            this.board[i] = [];

            for (var j: number = 0; j < 5; j++) {
                this.board[i][j] = id;
                if (this._playerOneStartIds.includes(id)) {
                    this.buttons.push(new Button(id, true))
                } else if (this._playerTwoStartIds.includes(id)) {
                    this.buttons.push(new Button(id, false))
                }

                id++;
            }
        }
    }

    getMovableButtonIds(player: Player): number[] {
        let buttonIds = []
        let buttons = player === this.playerOne ? 
            JSON.parse(JSON.stringify(this.playerOneButtons())) :
            JSON.parse(JSON.stringify(this.playerTwoButtons()));

        for (const button of buttons) {
            // if button has zero IDs where to move then remove it from list.
            if (this.getButtonMoves(button).length > 0) {
                buttonIds.push(button.id);
            }

        }

        return buttonIds;
    }

    // 0 if draw
    // +3 if playerOne gets his button to final position
    // +1 if playerTwo button is blocked
    // -1 if playerOne button is blocked
    // -3 if playerTwo gets his button to final position
    updateScore() {
        this.score = 0;

        if (this.winner === this.playerOne) {
            this.score = Infinity;
        } else if (this.winner === this.playerTwo) {
            this.score = -Infinity;
        } else {
            let playerOneMovableButtonIds = this.getMovableButtonIds(this.playerOne);
            let playerTwoMovableButtonIds = this.getMovableButtonIds(this.playerTwo);
            for (const button of this.playerOneButtons()) {
                if (this._playerTwoStartIds.includes(button.id)) {
                    this.score += 10;
                }

                if (!playerOneMovableButtonIds.includes(button.id)) {
                    this.score -= 1;
                }
            }

            for (const button of this.playerTwoButtons()) {
                if (this._playerOneStartIds.includes(button.id)) {
                    this.score -= 10;
                }
                if (!playerTwoMovableButtonIds.includes(button.id)) {
                    this.score += 1;
                }
            }

        }

        return;
    }

    // Move button. Return true if moved, false otherwise.
    moveButton(targetId: number, currentId: number): boolean {
        if (this.isValidMove(targetId, this.getButton(currentId)!) && targetId !== currentId) {
            this.getButton(currentId).id = targetId;

            this.updateScore();

            let checkWinner = this.checkWin();

            if (checkWinner === false) {
                this.playerOneMove = !this.playerOneMove;
            }

            this.selectedId = undefined;

            this.boardStates.push(this.getBoardState());

            return true;
        }

        return false;
    }

    // Check for win
    checkWin(): boolean {
        let playerOneButtonIds = this.playerOneButtons().map(x => x.id);
        let playerTwoButtonIds = this.playerTwoButtons().map(x => x.id);

        if (this.getMovableButtonIds(this.playerTwo).length === 0 || 
            playerOneButtonIds.sort().toString() === this._playerTwoStartIds.sort().toString()) {
                this.winner = this.playerOne;
                return true;
        } else if (
            this.getMovableButtonIds(this.playerOne).length === 0 ||
            playerTwoButtonIds.sort().toString() === this._playerOneStartIds.sort().toString()) {
                this.winner = this.playerTwo;
                return true;
        }

        return false;
    }

    isButton(id: number): boolean {
        let buttons = [...this.playerOneButtons(), ...this.playerTwoButtons()]
        for (const button of buttons) {
            if (button.id === id) {
                return true
            }
        }

        return false;
    }

    // Check if move is valid to target ID.
    isValidMove(targetId: number, button: Button): boolean {
        if (!this.getButtonMoves(button).includes(targetId)) {
            return false;
        }

        return true;
    }

    // Check if Board square is found by ID or by row and col.
    isBoard(id: number): boolean;
    isBoard(row: number, col: number): boolean;
    isBoard(rowOrId: number, col?: number): boolean {
        if (typeof col === "undefined") {
            if (rowOrId < 1 || rowOrId > 25) {
                return false
            }
        } else if (rowOrId < 0 || rowOrId > 4 || col < 0 || col > 4) {
            return false
        }

        return true;
    }

    playerOneButtons(): Button[] {
        let buttons = [];
        for (const button of this.buttons) {
            if (button.isPlayerOne) {
                buttons.push(button);
            }
        }

        return buttons;
    }

    playerTwoButtons(): Button[] {
        let buttons = [];
        for (const button of this.buttons) {
            if (!button.isPlayerOne) {
                buttons.push(button);
            }
        }

        return buttons;
    }

    // Get all available ID-s where player can move with button.
    getButtonMoves(button: Button): number[] {
        let row = this.getRowCol(button.id).row;
        let col = this.getRowCol(button.id).col;
        let ids: number[] = [];

        if (this.isBoard(row - 1, col - 1) && !this.isButton(this.board[row - 1][col - 1])) {
            ids.push(this.board[row - 1][col - 1])
        }

        if (this.isBoard(row - 1, col + 1) && !this.isButton(this.board[row - 1][col + 1])) {
            ids.push(this.board[row - 1][col + 1])
        }
        
        if (this.isBoard(row + 1, col - 1) && !this.isButton(this.board[row + 1][col - 1])) {
            ids.push(this.board[row + 1][col - 1])
        }
        
        if (this.isBoard(row + 1, col + 1) && !this.isButton(this.board[row + 1][col + 1])) {
            ids.push(this.board[row + 1][col + 1])
        }

        return ids;
    }

    getButton(id: number): Button {
        let buttons = [...this.playerOneButtons(), ... this.playerTwoButtons()]

        for (const button of buttons) {
            if (button.id === id) {
                return button;
            }
        }

        throw new Error("\nInvalid argument exception!");
    }

    getBoardState(): string {
        return this.playerOneButtons().map(x => x.id).sort().toString() + 
               this.playerTwoButtons().map(x => x.id).sort().toString()

    }

    getRowCol(id: number) {
        const row = Math.floor((id - 1) / 5);
        const col = ((id - 1) % 5);
        return {row: row, col: col }
    }
}