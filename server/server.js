    const express = require("express");
    const http = require("http");
    const { Server } = require("socket.io");
    const path = require("path");

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);

    const PORT = process.env.PORT || 3000;

    // =====================================
    // GAME SETTINGS
    // =====================================

    const MAX_PLAYERS = 8;

    const BOMB_DURATION = 30;

    // Distance between players required for bomb pass
    const BOMB_PASS_DISTANCE = 8;

    // Prevent instant repeated bomb passing
    const BOMB_PASS_COOLDOWN = 1000;

    // Player movement speed
    const PLAYER_SPEED = 1.5;

    // Server game tick
    const GAME_TICK = 100;

    // Game state broadcast interval
    const GAME_UPDATE_RATE = 50;

    // =====================================
    // STATIC FILES
    // =====================================

    app.use(
        express.static(
            path.join(__dirname, "../client")
        )
    );

    // =====================================
    // ROOMS
    // =====================================

    const rooms = new Map();

    // =====================================
    // ROOM CODE GENERATOR
    // =====================================

    function generateRoomCode() {

        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        let code = "";

        for (let i = 0; i < 5; i++) {

            code += characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

        }

        return code;
    }

    // =====================================
    // DISTANCE
    // =====================================

    function getDistance(player1, player2) {

        const dx =
            player1.x - player2.x;

        const dy =
            player1.y - player2.y;

        return Math.sqrt(
            dx * dx + dy * dy
        );
    }

    // =====================================
    // ALIVE PLAYERS
    // =====================================

    function getAlivePlayers(room) {

        return room.players.filter(
            player =>
                player.alive !== false
        );
    }

    // =====================================
    // ROOM UPDATE
    // =====================================

    function sendRoomUpdate(roomCode) {

        const room =
            rooms.get(roomCode);

        if (!room) return;

        io.to(roomCode).emit(
            "roomUpdated",
            {
                roomCode,

                players:
                    room.players.map(
                        player => ({
                            id: player.id,
                            name: player.name,
                            isHost: player.isHost,
                            ready: player.ready,
                            score: player.score,
                            alive: player.alive
                        })
                    )
            }
        );
    }

    // =====================================
    // GAME STATE
    // =====================================

    function sendGameState(roomCode) {

        const room =
            rooms.get(roomCode);

        if (!room) return;

        io.to(roomCode).emit(
            "gameState",
            {

                players:
                    room.players.map(
                        player => ({
                            id: player.id,
                            name: player.name,
                            x: player.x,
                            y: player.y,
                            alive: player.alive,
                            score: player.score,
                            isHost: player.isHost === true
                        })
                    ),

                bomb:
                    room.bomb
                        ? {
                            holderId:
                                room.bomb.holderId,

                            timeLeft:
                                Math.max(
                                    0,
                                    room.bomb.timeLeft
                                ),

                            active:
                                room.bomb.active
                        }
                        : null,

                round:
                    room.round,

                gameOver:
                    room.gameOver
            }
        );
    }

    // =====================================
    // START BOMB ROUND
    // =====================================

    function startBombRound(roomCode) {

        const room =
            rooms.get(roomCode);

        if (!room) return;

        if (!room.gameStarted) return;

        const alivePlayers =
            getAlivePlayers(room);

        if (alivePlayers.length < 2) {

            endGame(roomCode);

            return;
        }

        // Choose random alive player

        const randomIndex =
            Math.floor(
                Math.random() *
                alivePlayers.length
            );

        const holder =
            alivePlayers[randomIndex];

        room.bomb = {

            holderId:
                holder.id,

            timeLeft:
                BOMB_DURATION,

            active:
                true,

            lastPassTime:
                Date.now()

        };

        console.log(
            `💣 Bomb assigned to ${holder.name} in ${roomCode}`
        );

        io.to(roomCode).emit(
            "bombAssigned",
            {
                holderId:
                    holder.id,

                timeLeft:
                    BOMB_DURATION
            }
        );

        sendGameState(roomCode);
    }

    // =====================================
    // PASS BOMB
    // =====================================

    function passBomb(
        roomCode,
        fromPlayer,
        toPlayer
    ) {

        const room =
            rooms.get(roomCode);

        if (!room) return;

        if (!room.bomb) return;

        if (!room.bomb.active) return;

        room.bomb.holderId =
            toPlayer.id;

        room.bomb.lastPassTime =
            Date.now();

        console.log(
            `💣 Bomb passed from ${fromPlayer.name} to ${toPlayer.name}`
        );

        io.to(roomCode).emit(
            "bombPassed",
            {

                fromId:
                    fromPlayer.id,

                toId:
                    toPlayer.id,

                timeLeft:
                    room.bomb.timeLeft
            }
        );
    }

    // =====================================
    // AUTOMATIC BOMB PASS CHECK
    // =====================================

    function checkBombPass(roomCode) {

        const room =
            rooms.get(roomCode);

        if (!room) return;

        if (!room.gameStarted) return;

        if (!room.bomb) return;

        if (!room.bomb.active) return;

        const holder =
            room.players.find(
                player =>
                    player.id ===
                    room.bomb.holderId
            );

        if (!holder) {

            startBombRound(roomCode);

            return;
        }

        if (holder.alive === false) {

            startBombRound(roomCode);

            return;
        }

        // Cooldown

        if (
            Date.now() -
            room.bomb.lastPassTime <
            BOMB_PASS_COOLDOWN
        ) {

            return;
        }

        // Find nearest alive player

        const nearbyPlayers =
            getAlivePlayers(room)

                .filter(
                    player =>
                        player.id !==
                        holder.id
                )

                .map(
                    player => ({

                        player,

                        distance:
                            getDistance(
                                holder,
                                player
                            )

                    })
                )

                .filter(
                    item =>
                        item.distance <=
                        BOMB_PASS_DISTANCE
                )

                .sort(
                    (a, b) =>
                        a.distance -
                        b.distance
                );

        if (
            nearbyPlayers.length === 0
        ) {

            return;
        }

        const target =
            nearbyPlayers[0].player;

        passBomb(
            roomCode,
            holder,
            target
        );
    }

    // =====================================
    // EXPLODE BOMB
    // =====================================

    function explodeBomb(roomCode) {

        const room =
            rooms.get(roomCode);

        if (!room) return;

        if (!room.bomb) return;

        if (!room.bomb.active) return;

        const holder =
            room.players.find(
                player =>
                    player.id ===
                    room.bomb.holderId
            );

        if (!holder) {

            startBombRound(roomCode);

            return;
        }

        // Stop bomb

        room.bomb.active =
            false;

        room.bomb.timeLeft =
            0;

        console.log(
            `💥 Bomb exploded on ${holder.name} in ${roomCode}`
        );

        // Eliminate player

        holder.alive =
            false;

        // Tell clients

        io.to(roomCode).emit(
            "bombExploded",
            {
                playerId:
                    holder.id,

                playerName:
                    holder.name
            }
        );

        const alivePlayers =
            getAlivePlayers(room);

        // =================================
        // GAME OVER
        // =================================

        if (
            alivePlayers.length <= 1
        ) {

            if (
                alivePlayers.length === 1
            ) {

                const winner =
                    alivePlayers[0];

                winner.score += 1;
            }

            endGame(roomCode);

            return;
        }

        // =================================
        // NEXT ROUND
        // =================================

        room.round += 1;

        room.bomb = null;

        sendGameState(roomCode);

        setTimeout(
            () => {

                const currentRoom =
                    rooms.get(roomCode);

                if (!currentRoom) return;

                if (
                    !currentRoom.gameStarted
                ) {

                    return;
                }

                startBombRound(
                    roomCode
                );

            },
            2000
        );
    }

    // =====================================
    // END GAME
    // =====================================

    function endGame(roomCode) {

        const room =
            rooms.get(roomCode);

        if (!room) return;

        room.gameStarted =
            false;

        room.gameOver =
            true;

        if (room.bomb) {

            room.bomb.active =
                false;
        }

        const alivePlayers =
            getAlivePlayers(room);

        let winner = null;

        if (
            alivePlayers.length === 1
        ) {

            winner =
                alivePlayers[0];
        }

        const finalPlayers =
            room.players.map(
                player => ({

                    id:
                        player.id,

                    name:
                        player.name,

                    score:
                        player.score,

                    alive:
                        player.alive
                })
            );

        io.to(roomCode).emit(
            "gameOver",
            {

                winner:
                    winner
                        ? {

                            id:
                                winner.id,

                            name:
                                winner.name,

                            score:
                                winner.score

                        }
                        : null,

                players:
                    finalPlayers
            }
        );

        console.log(
            `🏆 Game over in ${roomCode}`
        );

        sendGameState(roomCode);
    }

    // =====================================
    // RESET GAME
    // =====================================

    function resetGame(room) {

        room.gameStarted =
            false;

        room.gameOver =
            false;

        room.round =
            1;

        room.bomb =
            null;

        room.players.forEach(
            player => {

                player.ready =
                    false;

                player.alive =
                    true;

                player.score =
                    0;

                player.x =
                    undefined;

                player.y =
                    undefined;

            }
        );
    }

    // =====================================
    // STARTING POSITIONS
    // =====================================

    function setStartingPositions(room) {

        const positions = [

            { x: 20, y: 20 },

            { x: 80, y: 20 },

            { x: 20, y: 80 },

            { x: 80, y: 80 },

            { x: 50, y: 20 },

            { x: 50, y: 80 },

            { x: 20, y: 50 },

            { x: 80, y: 50 }

        ];

        room.players.forEach(
            (player, index) => {

                const position =
                    positions[
                        index %
                        positions.length
                    ];

                player.x =
                    position.x;

                player.y =
                    position.y;

                player.alive =
                    true;
            }
        );
    }

    // =====================================
    // SOCKET CONNECTION
    // =====================================

    io.on(
        "connection",
        socket => {

            console.log(
                "🟢 Player connected:",
                socket.id
            );

            // =================================
            // CREATE ROOM
            // =================================

            socket.on(
                "createRoom",
                ({ name }) => {

                    if (
                        !name ||
                        !name.trim()
                    ) {

                        return;
                    }

                    let roomCode;

                    do {

                        roomCode =
                            generateRoomCode();

                    } while (
                        rooms.has(roomCode)
                    );

                    const player = {

                        id:
                            socket.id,

                        name:
                            name.trim(),

                        isHost:
                            true,

                        ready:
                            false,

                        score:
                            0,

                        alive:
                            true
                    };

                    const room = {

                        hostId:
                            socket.id,

                        players:
                            [player],

                        gameStarted:
                            false,

                        gameOver:
                            false,

                        birthdaySurpriseActive:
                            false,

                        round:
                            1,

                        bomb:
                            null
                    };

                    rooms.set(
                        roomCode,
                        room
                    );

                    socket.join(
                        roomCode
                    );

                    socket.data.roomCode =
                        roomCode;

                    socket.emit(
                        "roomCreated",
                        {

                            roomCode,

                            players:
                                [player]
                        }
                    );

                    console.log(
                        `🏠 Room ${roomCode} created by ${name}`
                    );
                }
            );

            // =================================
            // JOIN ROOM
            // =================================

            socket.on(
                "joinRoom",
                ({ name, roomCode }) => {

                    if (
                        !name ||
                        !name.trim()
                    ) {

                        return;
                    }

                    if (!roomCode) {

                        socket.emit(
                            "roomError",
                            {
                                message:
                                    "Please enter a room code."
                            }
                        );

                        return;
                    }

                    roomCode =
                        roomCode
                            .toUpperCase()
                            .trim();

                    const room =
                        rooms.get(roomCode);

                    if (!room) {

                        socket.emit(
                            "roomError",
                            {
                                message:
                                    "Room not found."
                            }
                        );

                        return;
                    }

                    if (
                        room.gameStarted
                    ) {

                        socket.emit(
                            "roomError",
                            {
                                message:
                                    "Game already started."
                            }
                        );

                        return;
                    }

                    if (
                        room.players.length >=
                        MAX_PLAYERS
                    ) {

                        socket.emit(
                            "roomError",
                            {
                                message:
                                    "Room is full."
                            }
                        );

                        return;
                    }

                    const player = {

                        id:
                            socket.id,

                        name:
                            name.trim(),

                        isHost:
                            false,

                        ready:
                            false,

                        score:
                            0,

                        alive:
                            true
                    };

                    room.players.push(
                        player
                    );

                    socket.join(
                        roomCode
                    );

                    socket.data.roomCode =
                        roomCode;

                    sendRoomUpdate(
                        roomCode
                    );

                    console.log(
                        `👤 ${name} joined ${roomCode}`
                    );
                }
            );

            // =================================
            // READY / NOT READY
            // =================================

            socket.on(
                "toggleReady",
                () => {

                    const roomCode =
                        socket.data.roomCode;

                    if (!roomCode) return;

                    const room =
                        rooms.get(roomCode);

                    if (!room) return;

                    if (
                        room.gameStarted
                    ) {

                        return;
                    }

                    const player =
                        room.players.find(
                            p =>
                                p.id ===
                                socket.id
                        );

                    if (!player) return;

                    // Host does not need ready

                    if (
                        player.isHost
                    ) {

                        return;
                    }

                    player.ready =
                        !player.ready;

                    sendRoomUpdate(
                        roomCode
                    );

                    console.log(
                        `${player.name} ready: ${player.ready}`
                    );
                }
            );

            // =================================
            // START GAME
            // =================================

            socket.on(
                "startGame",
                () => {

                    const roomCode =
                        socket.data.roomCode;

                    if (!roomCode) return;

                    const room =
                        rooms.get(roomCode);

                    if (!room) return;

                    // Host only

                    if (
                        room.hostId !==
                        socket.id
                    ) {

                        socket.emit(
                            "roomError",
                            {
                                message:
                                    "Only the host can start the game."
                            }
                        );

                        return;
                    }

                    // Minimum players

                    if (
                        room.players.length < 2
                    ) {

                        socket.emit(
                            "roomError",
                            {
                                message:
                                    "At least 2 players are required."
                            }
                        );

                        return;
                    }

                    // Everyone except host must be ready

                    const everyoneReady =
                        room.players
                            .filter(
                                player =>
                                    !player.isHost
                            )
                            .every(
                                player =>
                                    player.ready
                            );

                    if (!everyoneReady) {

                        socket.emit(
                            "roomError",
                            {
                                message:
                                    "Everyone must be ready first."
                            }
                        );

                        return;
                    }

                    // Initialize game

                    room.gameStarted =
                        true;

                    room.gameOver =
                        false;

                    room.birthdaySurpriseActive =
                        false;

                    room.round =
                        1;

                    room.bomb =
                        null;

                    room.players.forEach(
                        player => {

                            player.alive =
                                true;

                            player.score =
                                0;
                        }
                    );

                    setStartingPositions(
                        room
                    );

                    console.log(
                        `🚀 Game started in ${roomCode}`
                    );

                    io.to(roomCode).emit(
                        "gameStarting"
                    );

                    sendGameState(
                        roomCode
                    );

                    // Give countdown time

                    setTimeout(
                        () => {

                            const currentRoom =
                                rooms.get(
                                    roomCode
                                );

                            if (!currentRoom) return;

                            if (
                                !currentRoom.gameStarted
                            ) {

                                return;
                            }

                            startBombRound(
                                roomCode
                            );

                        },
                        3000
                    );
                }
            );
                    // =================================
            // 🎂 SECRET BIRTHDAY SURPRISE
            // =================================

            socket.on(
                "birthdaySurprise",
                () => {

                    const roomCode =
                        socket.data.roomCode;

                    if (!roomCode) {
                        return;
                    }

                    const room =
                        rooms.get(roomCode);

                    if (!room) {
                        return;
                    }

                    // Only the host can trigger the birthday sequence.
                    if (
                        room.hostId !==
                        socket.id
                    ) {

                        console.log(
                            "⚠️ Birthday surprise denied: not the host."
                        );

                        return;
                    }

                    room.birthdaySurpriseActive =
                        true;

                    console.log(
                        `🎂 BIRTHDAY SURPRISE TRIGGERED in ${roomCode}`
                    );

                    // Everyone sees the cinematic sequence.
                    io.to(roomCode).emit(
                        "birthdaySurprise"
                    );

                    // Only the host and the player named Subha receive
                    // permission to press the final mail button.
                    room.players.forEach(
                        player => {

                            const isSubha =
                                String(player.name || "")
                                    .trim()
                                    .toLowerCase() ===
                                "subha";

                            const canOpen =
                                player.id === room.hostId ||
                                isSubha;

                            io.to(player.id).emit(
                                "birthdayRevealPermission",
                                {
                                    canOpen
                                }
                            );

                        }
                    );

                }
            );


            // =================================
            // 💌 OPEN FINAL BIRTHDAY REVEAL
            // =================================

            socket.on(
                "birthdayRevealOpen",
                () => {

                    const roomCode =
                        socket.data.roomCode;

                    if (!roomCode) {
                        return;
                    }

                    const room =
                        rooms.get(roomCode);

                    if (!room) {
                        return;
                    }

                    if (!room.birthdaySurpriseActive) {
                        return;
                    }

                    const player =
                        room.players.find(
                            p =>
                                p.id ===
                                socket.id
                        );

                    if (!player) {
                        return;
                    }

                    const isSubha =
                        String(player.name || "")
                            .trim()
                            .toLowerCase() ===
                        "subha";

                    const authorized =
                        player.id === room.hostId ||
                        isSubha;

                    if (!authorized) {

                        console.log(
                            `⚠️ Birthday reveal denied for ${player.name}`
                        );

                        return;
                    }

                    console.log(
                        `💌 Birthday reveal opened by ${player.name} in ${roomCode}`
                    );

                    // One authorized click reveals the final birthday screen
                    // for everyone in the room.
                    io.to(roomCode).emit(
                        "birthdayRevealOpen"
                    );

                }
            );


            // =================================
            // PLAYER MOVEMENT
            // =================================

            socket.on(
                "playerMove",
                ({ dx, dy }) => {

                    const roomCode =
                        socket.data.roomCode;

                    if (!roomCode) return;

                    const room =
                        rooms.get(roomCode);

                    if (!room) return;

                    if (
                        !room.gameStarted
                    ) {

                        return;
                    }

                    const player =
                        room.players.find(
                            p =>
                                p.id ===
                                socket.id
                        );

                    if (!player) return;

                    // Dead players cannot move

                    if (
                        player.alive === false
                    ) {

                        return;
                    }

                    dx =
                        Number(dx) || 0;

                    dy =
                        Number(dy) || 0;

                    // Limit input

                    dx =
                        Math.max(
                            -1,
                            Math.min(
                                1,
                                dx
                            )
                        );

                    dy =
                        Math.max(
                            -1,
                            Math.min(
                                1,
                                dy
                            )
                        );

                    if (
                        player.x === undefined
                    ) {

                        player.x =
                            50;

                        player.y =
                            50;
                    }

                    player.x +=
                        dx *
                        PLAYER_SPEED;

                    player.y +=
                        dy *
                        PLAYER_SPEED;

                    // Arena boundaries

                    player.x =
                        Math.max(
                            5,
                            Math.min(
                                95,
                                player.x
                            )
                        );

                    player.y =
                        Math.max(
                            5,
                            Math.min(
                                95,
                                player.y
                            )
                        );
                }
            );

            // =================================
            // MANUAL PASS REQUEST
            // =================================

            socket.on(
                "passBomb",
                () => {

                    const roomCode =
                        socket.data.roomCode;

                    if (!roomCode) return;

                    const room =
                        rooms.get(roomCode);

                    if (!room) return;

                    if (
                        !room.gameStarted
                    ) {

                        return;
                    }

                    if (!room.bomb) return;

                    if (
                        !room.bomb.active
                    ) {

                        return;
                    }

                    if (
                        room.bomb.holderId !==
                        socket.id
                    ) {

                        return;
                    }

                    checkBombPass(
                        roomCode
                    );
                }
            );

            // =================================
            // DISCONNECT
            // =================================

            socket.on(
                "disconnect",
                () => {

                    console.log(
                        "🔴 Player disconnected:",
                        socket.id
                    );

                    const roomCode =
                        socket.data.roomCode;

                    if (!roomCode) return;

                    const room =
                        rooms.get(roomCode);

                    if (!room) return;

                    const leavingPlayer =
                        room.players.find(
                            player =>
                                player.id ===
                                socket.id
                        );

                    const wasBombHolder =
                        room.bomb &&
                        room.bomb.holderId ===
                        socket.id;

                    const wasHost =
                        room.hostId ===
                        socket.id;

                    // Remove player

                    room.players =
                        room.players.filter(
                            player =>
                                player.id !==
                                socket.id
                        );

                    // Empty room

                    if (
                        room.players.length === 0
                    ) {

                        rooms.delete(
                            roomCode
                        );

                        console.log(
                            `🗑️ Room ${roomCode} deleted`
                        );

                        return;
                    }

                    // =================================
                    // HOST TRANSFER
                    // =================================

                    if (wasHost) {

                        const newHost =
                            room.players[0];

                        if (newHost) {

                            room.hostId =
                                newHost.id;

                            newHost.isHost =
                                true;

                            newHost.ready =
                                false;

                            console.log(
                                `${newHost.name} is now host of ${roomCode}`
                            );
                        }
                    }

                    // =================================
                    // BOMB HOLDER LEFT
                    // =================================

                    if (
                        room.gameStarted &&
                        wasBombHolder
                    ) {

                        console.log(
                            `💣 Bomb holder ${leavingPlayer?.name || "unknown"} disconnected`
                        );

                        room.bomb =
                            null;

                        setTimeout(
                            () => {

                                const currentRoom =
                                    rooms.get(
                                        roomCode
                                    );

                                if (!currentRoom)
                                    return;

                                if (
                                    !currentRoom.gameStarted
                                )
                                    return;

                                startBombRound(
                                    roomCode
                                );

                            },
                            500
                        );
                    }

                    // =================================
                    // CHECK GAME
                    // =================================

                    if (
                        room.gameStarted
                    ) {

                        const alivePlayers =
                            getAlivePlayers(
                                room
                            );

                        if (
                            alivePlayers.length <= 1
                        ) {

                            endGame(
                                roomCode
                            );

                            return;
                        }
                    }

                    sendRoomUpdate(
                        roomCode
                    );

                    sendGameState(
                        roomCode
                    );
                }
            );
        }
    );

    // =====================================
    // GAME LOOP
    // =====================================

    let lastTick =
        Date.now();

    setInterval(
        () => {

            const now =
                Date.now();

            const delta =
                (now - lastTick) /
                1000;

            lastTick =
                now;

            rooms.forEach(
                (room, roomCode) => {

                    if (
                        !room.gameStarted
                    ) {

                        return;
                    }

                    if (
                        !room.bomb ||
                        !room.bomb.active
                    ) {

                        return;
                    }

                    // Countdown

                    room.bomb.timeLeft -=
                        delta;

                    // Automatic pass

                    checkBombPass(
                        roomCode
                    );

                    // Explosion

                    if (
                        room.bomb &&
                        room.bomb.timeLeft <=
                        0
                    ) {

                        room.bomb.timeLeft =
                            0;

                        explodeBomb(
                            roomCode
                        );
                    }
                }
            );

        },
        GAME_TICK
    );

    // =====================================
    // GAME STATE BROADCAST
    // =====================================

    setInterval(
        () => {

            rooms.forEach(
                (room, roomCode) => {

                    if (
                        !room.gameStarted
                    ) {

                        return;
                    }

                    sendGameState(
                        roomCode
                    );
                }
            );

        },
        GAME_UPDATE_RATE
    );

    // =====================================
    // SERVER START
    // =====================================

    server.listen(
        PORT,
        () => {

            console.log(
                `🎮 Chaos Party running at http://localhost:${PORT}`
            );

        }
    );
