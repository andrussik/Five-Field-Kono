import { GameEngine } from './GameEngine'
import { GameMode } from './GameMode';
import { Player } from './Player';

let game: GameEngine;
let aiCounter = 0;
createMenu();
startNewGame(GameMode.PvP);

function createMenu() {
    let menu = document.getElementById("menu");

    let newGameSpan = document.createElement("span");
    newGameSpan.id = "start-new-game";
    newGameSpan.innerHTML = "START NEW GAME:"
    menu?.appendChild(newGameSpan);

    let playerVsPlayer = document.createElement("span");
    playerVsPlayer.id = "player-vs-player";
    playerVsPlayer.className = "menu-button"
    playerVsPlayer.innerHTML = "player vs player"
    playerVsPlayer.onclick = () => startNewGame(GameMode.PvP);
    menu?.appendChild(playerVsPlayer);

    let playerVsComputer = document.createElement("span");
    playerVsComputer.id = "player-vs-computer";
    playerVsComputer.className = "menu-button"
    playerVsComputer.innerHTML = "player vs computer"
    playerVsComputer.onclick = () => startNewGame(GameMode.PvAI);
    menu?.appendChild(playerVsComputer);

    let computerVsComputer = document.createElement("span");
    computerVsComputer.id = "computer-vs-computer";
    computerVsComputer.className = "menu-button"
    computerVsComputer.innerHTML = "computer vs computer"
    computerVsComputer.onclick = () => startNewGame(GameMode.AIvAI);
    menu?.appendChild(computerVsComputer);
}

function startNewGame(gameMode: GameMode) {
    game = new GameEngine(gameMode)
    drawNewBoard();
    updateStatus();
    checkNextMove();
}

function leftClickAction(event: Event) {
    let target = event.target as HTMLInputElement;
    if (target.classList.contains("button")) {
        target = target.parentElement as HTMLInputElement;
    }
    const targetId = Number(target.id);
    const currentId = game.selectedId;

    if (!currentId && game.isButton(targetId) && 
        game.getButton(targetId)?.isPlayerOne === game.playerOneMove) {
        game.selectedId = targetId;
        target.children[0].classList.add("selected");
    } else if (currentId) {
        let buttonMoved = game.moveButton(targetId, currentId);

        if (currentId === targetId) {
            game.selectedId = undefined;
            document.getElementById(currentId.toString())?.children[0]
            .classList
            .remove("selected");
        } else if (buttonMoved) {
            moveButton(targetId, currentId);
        }
    }

    checkNextMove();
}

async function checkNextMove() {
    await new Promise(r => setTimeout(r, 5));

    if (!game.winner) {
        if (game.playerOneMove && game.playerOne.isAI ||
            !game.playerOneMove && game.playerTwo.isAI) {
            document.getElementById("board")?.removeEventListener("click", leftClickAction)
            aiMove();
        } else {
            document.getElementById("board")?.addEventListener("click", leftClickAction);
        }
    }

}

function drawNewBoard() {
    document.getElementById("board")?.remove();
    let app = document.getElementById("app");
    let board = document.createElement("div");
    board.id = "board";

    let id = 1;
    for (let i = 0; i < 5; i++) {
        let rowDiv = document.createElement("div");
        rowDiv.className = "row";
        for (let j = 0; j < 5; j++) {
            let square = document.createElement("div");
            square.id = id.toString();
            square.className = "square";

            let button = document.createElement("div");
            if (game.isButton(id) && game.getButton(id)?.isPlayerOne) {
                button.className = "button player-one";
            } else if (game.isButton(id) && !game.getButton(id)?.isPlayerOne) {
                button.className = "button player-two";
            } else {
                button.className = "button empty";
            }

            square.appendChild(button);
            rowDiv.appendChild(square);
            id++;
        }

        board.appendChild(rowDiv);
        app?.appendChild(board);
    }
}

function updateStatus() {
    let statusText = document.getElementById("status-text")!;

    if (game.winner === game.playerOne) {
        statusText.className = "player-one-status"
        statusText.innerHTML = "Player 1 won the game!"
    } else if (game.winner === game.playerTwo) {
        statusText.className = "player-two-status"
        statusText.innerHTML = "Player 2 won the game!"
    } else if (game.playerOneMove) {
        statusText.className = "player-one-status"
        statusText.innerHTML = "Player 1 move"
    } else if (!game.playerOneMove) {
        statusText.className = "player-two-status"
        statusText.innerHTML = "Player 2 move"
    }
}

function moveButton(targetId: number, currentId: number) {
    let playerClass = game.getButton(targetId)!.isPlayerOne ? "player-one" : "player-two";

    document.getElementById(game.getButton(targetId)!.id.toString())?.children[0]
    .setAttribute("class", "button " + playerClass);

    document.getElementById(currentId.toString())?.children[0].setAttribute("class", "button empty");

    updateStatus();
    console.log("game score: " + game.score);
}

function aiMove() {
    let bestMove = game.playerOneMove ? 
                   minimaxRoot(game, 3, true) : 
                   minimaxRoot(game, 1, false);
    
    game.moveButton(bestMove.targetId, bestMove.currentId)
    moveButton(bestMove.targetId, bestMove.currentId);

    checkNextMove();
}

function isRepeatingMoves(boardState: string): boolean {
    let originalBoardState: string[] = JSON.parse(JSON.stringify(game.boardStates));
    for (let i = 0; i < 40; i++) {
        const state = originalBoardState.pop();
        if (state === boardState) {
            return true;
        }
    }

    return false;
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

function minimaxRoot(game: GameEngine, depth: number, isMaximizing: boolean) {
    let player = isMaximizing ? game.playerOne : game.playerTwo;
    let result: any = {
        score: isMaximizing ? -Infinity : Infinity
    }

    let movableButtons = game.getMovableButtonIds(player);

    for (const buttonId of movableButtons) {
        let button = game.getButton(buttonId);
        const moveIds = game.getButtonMoves(button);
        for (const moveId of moveIds) {
            let gameCopy = deepCopy(game)
            gameCopy.moveButton(moveId, buttonId);
            let score = minimax(gameCopy, depth, -Infinity, Infinity, isMaximizing);

            let a = gameCopy.boardStates.pop()

            if (isMaximizing && score > result.score && !isRepeatingMoves(a)) {
                result.score = score;
                result.targetId = moveId;
                result.currentId = buttonId;
            } else if (!isMaximizing && score < result.score && !isRepeatingMoves(a)) {
                result.score = score;
                result.targetId = moveId;
                result.currentId = buttonId;
            }
        }
    }

    return result;
}

function minimax(game: GameEngine, depth: number, alpha:number, beta:number, isMaximizing: boolean) {
    let player: Player = isMaximizing ? game.playerOne : game.playerTwo;
    if (depth === 0 || game.winner) {
        if (game.winner === game.playerOne) {
            return Infinity;
        } else if (game.winner == game.playerTwo) {
            return -Infinity;
        }

        return game.score;
    }
    if (isMaximizing) {
        let bestScore: number = -Infinity
        let movableButtons = game.getMovableButtonIds(player);

        for (const buttonId of movableButtons) {
            let button = game.getButton(buttonId);
            const moveIds = game.getButtonMoves(button);
            for (const moveId of moveIds) {
                let gameCopy = deepCopy(game)
                gameCopy.moveButton(moveId, buttonId);
                let score: number = minimax(gameCopy, depth - 1, alpha, beta, false);

                let a: string = gameCopy.boardStates.pop()
                if (score > bestScore && !isRepeatingMoves(a)) {
                    bestScore = score;
                }

                alpha = Math.max(alpha, bestScore);
                if (alpha >= beta) {
                    break;
                }
            }
        }

        return bestScore;
    } else {
        let bestScore: number = Infinity;
        let movableButtons = game.getMovableButtonIds(player);

        for (const buttonId of movableButtons) {
            let button = game.getButton(buttonId);
            const moveIds = game.getButtonMoves(button);
            for (const moveId of moveIds) {
                let gameCopy = deepCopy(game)
                gameCopy.moveButton(moveId, buttonId);
                let score: number = minimax(gameCopy, depth - 1, alpha, beta, true);

                let a: string = gameCopy.boardStates.pop()
                if (score < bestScore && !isRepeatingMoves(a)) {
                    bestScore = score;
                }

                beta = Math.min(beta, bestScore);
                if (alpha >= beta) {
                    break;
                }
            }
        }

        return bestScore;
    }
}

function deepCopy(game: GameEngine) {
    let newGame = new GameEngine(game.gameMode);
    let clone = Object.assign(newGame, JSON.parse(JSON.stringify(game)));

    return clone;
}