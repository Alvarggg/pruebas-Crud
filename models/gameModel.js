const fs = require('fs');
const path = require('path');

const gameStateFilePath = path.join(__dirname, '../data/gameState.json');


// Obtener el estado del juego de un usuario
exports.getGameState = (userId) => {
    const gameStates = JSON.parse(fs.readFileSync(gameStateFilePath, 'utf8'));
    return gameStates.find(state => state.userId === userId);
};

exports.saveGameState = (userId, gameState) => {
    const gameStates = JSON.parse(fs.readFileSync(gameStateFilePath, 'utf8'));
    
    const existingStateIndex = gameStates.findIndex(state => state.userId === userId);
    if (existingStateIndex !== -1) {
        gameStates[existingStateIndex] = gameState;
    } else {
        gameStates.push(gameState);
    }

    fs.writeFileSync(gameStateFilePath, JSON.stringify(gameStates, null, 2), 'utf8');
};