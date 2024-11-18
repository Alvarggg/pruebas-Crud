let img;
let playerImg; // Imagen del jugador principal
let otherPlayerImg; // Imagen de otros jugadores
let posX = 100; // Valores iniciales temporales
let posY = 100;
const squareSize = 40; // Aumentar el tamaño del sprite (ancho y alto)
const moveAmount = 5;
let characterId;

let keys = {};
let updateInterval;
let otherPlayers = {}; // Almacena las posiciones de otros jugadores
let characterData = {}; // Datos del personaje principal

const socket = io(); // Conectar al servidor de sockets

// Solicitar posición del servidor al cargar
function preload() {
    fetchCharacterData();
    img = loadImage('/images/dia.jpg');
    // Cargar la imagen en función del tipo de arma
  if (characterData.tipoArma === "Pistola") {
    playerImage = loadImage('/images/Pistola.png'); // Ruta de la imagen de la pistola
  } else if (characterData.tipoArma === "Escopeta") {
    playerImage = loadImage('/images/Escopeta.png'); // Ruta de la imagen de la espada
  } else {
    console.warn('Tipo de arma no reconocida, usando imagen predeterminada');
    playerImage = loadImage('/images/default.png'); // Imagen predeterminada si no coincide
  }
    fetchCharacterData(); // Llama a la función para obtener los datos del personaje
}

// Configuración inicial del lienzo y actualización automática de fondo
function setup() {
    getCharacterIdFromSession().then(() => {
        // Ahora que tenemos characterId, cargamos los datos del personaje
        fetchCharacterData();

        // Configurar el lienzo
        const overlay = createCanvas(windowWidth, 600);
        overlay.parent('map');
        overlay.class('overlay');
        noFill();
        setInterval(updateBackgroundAutomatically, 60000); // Cambiar el fondo cada minuto
    }).catch(error => {
        console.error('Error al obtener el ID del personaje:', error);
        // Aquí podrías manejar el error, por ejemplo, mostrando un mensaje al usuario
    });
}

// Dibuja el personaje y controla el movimiento
function draw() {
    image(img, 0, 0, width, height);
    
    // Dibuja el personaje del usuario con la imagen del GIF
    image(playerImg, posX, posY, squareSize, squareSize); // Usar la imagen cargada con tamaño aumentado

    // Dibuja el nombre del personaje principal encima de la imagen
    fill(255); // Color del texto (blanco)
    textAlign(CENTER);
    text(characterData.name || 'Player', posX + squareSize / 2, posY - 5); // Mostrar el nombre

    // Dibuja otros jugadores
    for (let id in otherPlayers) {
        const playerPos = otherPlayers[id];
        image(otherPlayerImg, playerPos.x, playerPos.y, squareSize, squareSize); // Usar la imagen de otros jugadores con tamaño aumentado
        
        // Dibuja el nombre de otros jugadores
        text(otherPlayers[id].name || 'Player', playerPos.x + squareSize / 2, playerPos.y - 5);
    }

    // Control del movimiento del personaje
    if (keys[LEFT_ARROW]) {
        posX = max(0, posX - moveAmount);
        sendPosition();
    }
    if (keys[RIGHT_ARROW]) {
        posX = min(width - squareSize, posX + moveAmount);
        sendPosition();
    }
    if (keys[UP_ARROW]) {
        posY = max(0, posY - moveAmount);
        sendPosition();
    }
    if (keys[DOWN_ARROW]) {
        posY = min(height - squareSize, posY + moveAmount);
        sendPosition();
    }
}

// Cambia el fondo de acuerdo a la selección del usuario
function changeBackground() {
    const selector = document.getElementById('backgroundSelector');
    const selectedValue = selector.value;

    if (selectedValue === 'automatic') {
        updateBackgroundAutomatically();
    } else {
        let imagePath;
        switch (selectedValue) {
            case 'night':
                imagePath = '/images/noche.jpg';
                break;
            default:
                imagePath = '/images/dia.jpg';
                break;
        }
        img = loadImage(imagePath); // Cambia la imagen de fondo
    }
}

// Función para enviar la posición al servidor
function sendPosition() {
    socket.emit('updatePosition', {
        id: characterId,
        position: { x: posX, y: posY },
        name: characterData.name // Enviar el nombre junto con la posición
    });
}

// Función para recibir actualizaciones de posición de otros jugadores
socket.on('positionUpdated', (data) => {
    otherPlayers[data.id] = {
        x: data.position.x,
        y: data.position.y,
        name: data.name // Almacenar el nombre del jugador
    }; // Actualiza la posición de otros jugadores
});

// Función para manejar la desconexión de otros jugadores
socket.on('playerDisconnected', (id) => {
    delete otherPlayers[id]; // Eliminar al jugador desconectado de la lista
});

// Función para obtener los datos iniciales desde el servidor
function fetchCharacterData() {
    fetch(`/characters/${characterId}/getPositions`)
        .then(response => response.json())
        .then(data => {
            if (data.position) {
                posX = data.position.x;
                posY = data.position.y;
                characterData = data; // Guardar todos los datos del personaje
            }
        })
        .catch(error => {
            console.error('Error al obtener los datos del personaje:', error);
        });
}

// Función para enviar la posición actual al servidor
function updatePositionOnServer(posX, posY, characterId) {
    fetch(`/characters/${characterId}/updatePosition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: { x: posX, y: posY } })
    }).then(response => {
        if (!response.ok) {
            console.error('Error al actualizar la posición en el servidor');
        }
    }).catch(error => {
        console.error('Error en la conexión:', error);
    });
}

// Inicia la actualización de posición en intervalos
function startUpdatingPosition() {
    if (!updateInterval) {
        updateInterval = setInterval(() => {
            updatePositionOnServer(posX, posY, characterId);
        }, 100); // Actualizar cada 100ms
    }
}

// Detiene la actualización de posición
function stopUpdatingPosition() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    updatePositionOnServer(posX, posY, characterId); // Envía la posición final al soltar la tecla
}

// Controla cuando una tecla se presiona para iniciar el movimiento
function keyPressed() {
    keys[keyCode] = true;
    startUpdatingPosition();
}

// Controla cuando una tecla se suelta para detener el movimiento
function keyReleased() {
    keys[keyCode] = false;
    stopUpdatingPosition();
}

// Cambia el fondo automáticamente según la hora del día
function updateBackgroundAutomatically() {
    const currentHour = new Date().getHours();
    let imagePath;

    if (currentHour >= 9 && currentHour < 20) {
        imagePath = '/images/dia.jpg';
    }else {
        imagePath = '/images/noche.jpg';
    }
    img = loadImage(imagePath); // Cambiar la imagen de fondo
}

function getCharacterIdFromSession() {
    return fetch('/characterId') // Llamada al endpoint para obtener el ID del personaje
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo obtener el ID del personaje');
            }
            return response.json();
        })
        .then(data => {
            if (data.id) {
                characterId = data.id; // Asignar el ID del personaje a la variable global
            } else {
                console.error('No se encontró un ID de personaje válido');
            }
        })
        .catch(error => {
            console.error('Error al obtener el ID del personaje:', error);
        });
}
