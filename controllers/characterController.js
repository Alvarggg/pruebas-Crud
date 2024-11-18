const fs = require('fs');
const path = require('path');
const characterModel = require('../models/characterModel');
const charactersFilePath = path.join(__dirname, '../data/characters.json');

// Cargar personajes desde el archivo JSON
const loadCharacters = () => {
    if (fs.existsSync(charactersFilePath)) {
        const data = fs.readFileSync(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    }
    return [];
};

// Guardar personajes en el archivo JSON
const saveCharacters = (characters) => {
    fs.writeFileSync(charactersFilePath, JSON.stringify(characters, null, 2));
};

// Listar personajes de un usuario
exports.index = (req, res) => {
    const characters = loadCharacters();
    const userCharacters = characters.filter(character => character.userId === req.session.userId);
    res.render('characters/index', { characters: userCharacters, loadIndexCss: true });
};

// Mostrar formulario para crear un personaje
exports.create = (req, res) => {
    res.render('characters/create', { loadFormCss: true });
};

// Crear y almacenar un nuevo personaje
exports.store = (req, res) => {
    const characters = loadCharacters();
    const newCharacter = {
        id: characters.length > 0 ? characters[characters.length - 1].id + 1 : 1,
        name: req.body.name,
        energyLevel: parseInt(req.body.energyLevel, 10),
        lifePoints: parseInt(req.body.lifePoints, 10),
        tipoArma: req.body.tipoArma,
        userId: req.session.userId,
        position: { x: 0, y: 0 }
    };

    characters.push(newCharacter);
    saveCharacters(characters);
    res.redirect('/characters');
};

// Editar personaje existente
exports.edit = (req, res) => {
    const character = characterModel.findCharacterById(parseInt(req.params.id));
    if (!character || character.userId !== req.session.userId) {
        return res.status(403).send('No tienes permiso para editar este personaje.');
    }
    res.render('characters/edit', { character, loadFormCss: true });
};

// Actualizar personaje existente
exports.update = (req, res) => {
    const characters = loadCharacters();
    const characterIndex = characters.findIndex(c => c.id === parseInt(req.params.id));

    if (characterIndex >= 0 && characters[characterIndex].userId === req.session.userId) {
        characters[characterIndex] = {
            ...characters[characterIndex],
            name: req.body.name,
            energyLevel: parseInt(req.body.energyLevel, 10),
            lifePoints: parseInt(req.body.lifePoints, 10),
            tipoArma: req.body.tipoArma
        };
        saveCharacters(characters);
    }
    res.redirect('/characters');
};

// Eliminar un personaje
exports.delete = (req, res) => {
    let characters = loadCharacters();
    const characterIndex = characters.findIndex(c => c.id === parseInt(req.params.id));

    if (characterIndex >= 0 && characters[characterIndex].userId === req.session.userId) {
        characters = characters.filter(c => c.id !== parseInt(req.params.id));
        saveCharacters(characters);
    }
    res.redirect('/characters');
};

// Mostrar la tabla de jugadores con personajes y usuarios
exports.showPlayerTable = (req, res) => {
    const characters = loadCharacters();
    const userCharacters = characters.filter(character => character.userId === req.session.userId);
    
    // Leer datos de usuarios
    const usersFilePath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

    res.render('characters/playerTable', { characters: userCharacters, users, loadTableCss: true });
};

// Actualizar posición de un personaje
exports.updatePosition = (req, res) => {
    const characters = loadCharacters();
    const characterIndex = characters.findIndex(c => c.id === parseInt(req.params.id));

    if (characterIndex >= 0 && characters[characterIndex].userId === req.session.userId) {
        characters[characterIndex].position = req.body.position;
        saveCharacters(characters);
        return res.json({ success: true });
    }

    return res.status(403).json({ success: false, message: 'No tienes permiso para actualizar este personaje.' });
};

// Obtener posiciones de un personaje
exports.getPositions = (req, res) => {
    const characters = loadCharacters();
    const character = characters.find(c => c.id === parseInt(req.params.id));

    if (character) {
        res.json({ position: character.position });
    } else {
        res.status(404).json({ error: 'Personaje no encontrado' });
    }
};
