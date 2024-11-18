const characterModel = require('../models/characterModel');
const gameModel = require('../models/gameModel');

// Mostrar la página de selección de personajes
exports.select = (req, res) => {
    const userId = req.session.userId;
    const characters = characterModel.getAllCharacters().filter(c => c.userId === userId);
    res.render('characters/select', { characters });
};

// Manejar la selección de un personaje para el juego
exports.chooseCharacter = (req, res) => {
    const userId = req.session.userId;
    let gameState = gameModel.getGameState(userId); // Obtener el estado del juego para el usuario

    // Si no existe un estado del juego para el usuario, crea uno nuevo
    if (!gameState) {
        gameState = { userId: userId, characterId: null };
    }

    gameState.characterId = parseInt(req.body.characterId, 10);
    gameModel.saveGameState(userId, gameState); // Guardar el estado del juego para el usuario
    res.redirect('/game');
};

// Mostrar la vista del juego
exports.view = (req, res) => {
    const userId = req.session.userId;
    const gameState = gameModel.getGameState(userId); // Obtener el estado del juego para el usuario

    // Si no hay estado del juego, redirige a la selección de personaje
    if (!gameState || !gameState.characterId) {
        return res.redirect('/characters');
    }

    const character = characterModel.findCharacterById(gameState.characterId);
    const user = req.session.user || { username: 'Invitado' }; // Si no hay usuario en sesión, usa un valor por defecto

    res.render('game', { character, user });
};

// Actualizar el nivel de vida (REST API)
exports.updateEnergy = (req, res) => {
    const userId = req.session.userId;
    const gameState = gameModel.getGameState(userId); // Obtener el estado del juego para el usuario

    if (!gameState || !gameState.characterId) {
        return res.status(400).json({ message: 'No se ha seleccionado un personaje' });
    }

    const character = characterModel.findCharacterById(gameState.characterId);
    if (!character) {
        return res.status(404).json({ message: 'Personaje no encontrado' });
    }

    const { action } = req.body;
    switch (action) {
        case 'feed': // Recargar energía
            character.energyLevel = Math.min(100, character.energyLevel + 1);
            break;
        case 'play': // Disminuir energía por uso
            character.energyLevel = Math.max(0, character.energyLevel - 1);
            break;
        default:
            return res.status(400).json({ message: 'Acción no válida' });
    }

    characterModel.saveCharacter(character); // Guardar cambios en el personaje
    res.json({ energyLevel: character.energyLevel });
};