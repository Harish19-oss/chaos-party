                    // =====================================
                    // CHAOS PARTY - GAME CLIENT
                    // =====================================

                    console.log("🎮 Chaos Party game.js loaded");

                    // =====================================
                    // DOM ELEMENTS
                    // =====================================

                    const arena =
                        document.getElementById("arena");

                    const gameTimer =
                        document.getElementById("gameTimer");



                    // =====================================
                    // GAME VARIABLES
                    // =====================================

                    const gamePlayers =
                        new Map();

                    let gameRunning = false;

                    let currentBomb = null;

                    let lastPlayers = [];

                    let explosionTimeout = null;

                    // =====================================
                    // 🎂 BIRTHDAY REVEAL PERMISSIONS
                    // =====================================

                    let birthdayRevealCanOpen = false;
                    let birthdayRevealStarted = false;
                    let birthdayRevealOpenHandler = null;
                    let birthdayMailButtonRef = null;

                    // =====================================
                    // KEYBOARD STATE
                    // =====================================

                    // =====================================
                    // PLAYER COLORS
                    // =====================================

                    const playerColors = [
                        "player-red",
                        "player-blue",
                        "player-green",
                        "player-yellow",
                        "player-purple",
                        "player-orange",
                        "player-pink",
                        "player-cyan"
                    ];

                    // =====================================
                    // 📱 HIDDEN MOBILE HOST CONTROL
                    // Only the HOST receives the hidden touch control.
                    // The server still validates the birthdaySurprise event.
                    // Long-press the invisible hotspot for 1.2 seconds.
                    // =====================================

                    let mobileHostControl = null;
                    let mobileHostPressTimer = null;
                    let mobileHostPressActive = false;

                    function isMobileDevice() {
                        return (
                            window.matchMedia &&
                            window.matchMedia("(pointer: coarse)").matches
                        ) ||
                        /Android|iPhone|iPad|iPod|Mobile/i.test(
                            navigator.userAgent || ""
                        );
                    }

                    function createMobileHostControl() {

                        if (!isMobileDevice()) {
                            return;
                        }

                        if (mobileHostControl) {
                            return;
                        }

                        const style = document.createElement("style");
                        style.id = "mobileHostSecretControlStyle";
                        style.textContent = `
                            #mobileHostSecretControl {
                                position: fixed;
                                top: 18px;
                                right: 18px;
                                width: 54px;
                                height: 54px;
                                z-index: 2147483646;
                                border: 1px solid rgba(255,255,255,0.18);
                                border-radius: 50%;
                                background:
                                    radial-gradient(
                                        circle at 35% 30%,
                                        rgba(255,255,255,0.22),
                                        rgba(18,18,28,0.92)
                                    );
                                color: #ffffff;
                                font-size: 26px;
                                line-height: 1;
                                display: none;
                                align-items: center;
                                justify-content: center;
                                padding: 0;
                                margin: 0;
                                box-shadow:
                                    0 8px 30px rgba(0,0,0,0.45),
                                    inset 0 1px 0 rgba(255,255,255,0.15);
                                backdrop-filter: blur(14px);
                                -webkit-backdrop-filter: blur(14px);
                                touch-action: none;
                                -webkit-tap-highlight-color: transparent;
                                outline: none;
                                transition:
                                    transform 0.2s ease,
                                    box-shadow 0.2s ease,
                                    opacity 0.2s ease;
                            }

                            #mobileHostSecretControl::after {
                                content: "";
                                position: absolute;
                                inset: -5px;
                                border-radius: 50%;
                                border: 1px solid rgba(155,124,255,0.25);
                                opacity: 0.7;
                                animation:
                                    moonSecretPulse 2.4s ease-in-out infinite;
                            }

                            #mobileHostSecretControl.active {
                                transform: scale(0.88);
                                background:
                                    radial-gradient(
                                        circle,
                                        rgba(155,124,255,0.55),
                                        rgba(18,18,28,0.95)
                                    );
                                box-shadow:
                                    0 0 20px rgba(155,124,255,0.65),
                                    0 0 50px rgba(89,227,255,0.25),
                                    inset 0 1px 0 rgba(255,255,255,0.25);
                            }

                            @keyframes moonSecretPulse {
                                0%, 100% {
                                    transform: scale(1);
                                    opacity: 0.25;
                                }
                                50% {
                                    transform: scale(1.15);
                                    opacity: 0.75;
                                }
                            }

                            @media (max-width: 600px) {
                                #mobileHostSecretControl {
                                    width: 50px;
                                    height: 50px;
                                    top: 12px;
                                    right: 12px;
                                    font-size: 24px;
                                }
                            }
                        `;
                        document.head.appendChild(style);

                        mobileHostControl =
                            document.createElement("button");

                        mobileHostControl.id =
                            "mobileHostSecretControl";

                        mobileHostControl.type = "button";
                        mobileHostControl.textContent = "🌙";

                        mobileHostControl.setAttribute(
                            "aria-label",
                            "Host secret birthday control"
                        );

                        mobileHostControl.title =
                            "Hold for 1.2 seconds";

                        const startPress = event => {

                            event.preventDefault();
                            event.stopPropagation();

                            mobileHostPressActive = true;
                            mobileHostControl.classList.add("active");

                            clearTimeout(mobileHostPressTimer);

                            mobileHostPressTimer =
                                setTimeout(() => {

                                    if (!mobileHostPressActive) {
                                        return;
                                    }

                                    mobileHostPressActive = false;
                                    mobileHostControl.classList.remove("active");

                                    console.log(
                                        "🎂 Mobile host birthday control activated"
                                    );

                                    unlockBirthdayMusic();

                                    if (
                                        typeof socket !== "undefined" &&
                                        socket.connected
                                    ) {
                                        socket.emit("birthdaySurprise");
                                    } else {
                                        console.warn(
                                            "⚠️ Birthday surprise not sent: socket is not connected."
                                        );
                                    }

                                }, 1200);
                        };

                        const cancelPress = event => {

                            if (event) {
                                event.preventDefault();
                                event.stopPropagation();
                            }

                            mobileHostPressActive = false;
                            clearTimeout(mobileHostPressTimer);
                            mobileHostControl.classList.remove("active");
                        };

                        mobileHostControl.addEventListener(
                            "touchstart",
                            startPress,
                            { passive: false }
                        );

                        mobileHostControl.addEventListener(
                            "touchend",
                            cancelPress,
                            { passive: false }
                        );

                        mobileHostControl.addEventListener(
                            "touchcancel",
                            cancelPress,
                            { passive: false }
                        );

                        mobileHostControl.addEventListener(
                            "contextmenu",
                            event => {
                                event.preventDefault();
                            }
                        );

                        document.body.appendChild(
                            mobileHostControl
                        );
                    }

                    function updateMobileHostControl(players) {

                        if (!isMobileDevice()) {
                            return;
                        }

                        createMobileHostControl();

                        if (!mobileHostControl) {
                            return;
                        }

                        const amIHost =
                            Array.isArray(players) &&
                            players.some(
                                player =>
                                    player &&
                                    player.id === socket.id &&
                                    player.isHost === true
                            );

                        // The moon control is visible only to the host.
                        mobileHostControl.style.display =
                            amIHost ? "flex" : "none";
                    }

                    // =====================================
                    // 🎮 UNIFIED KEYBOARD + TOUCH MOVEMENT INPUT
                    // =====================================

                    // ONE movement state is used by both PC keyboard
                    // and phone touch buttons. This prevents the two
                    // control systems from getting out of sync.
                    const movementKeys = new Set();

                    function normalizeMovementKey(key) {

                        if (!key) {
                            return null;
                        }

                        const value =
                            String(key).toLowerCase();

                        if (
                            value === "w" ||
                            value === "arrowup"
                        ) {
                            return "up";
                        }

                        if (
                            value === "s" ||
                            value === "arrowdown"
                        ) {
                            return "down";
                        }

                        if (
                            value === "a" ||
                            value === "arrowleft"
                        ) {
                            return "left";
                        }

                        if (
                            value === "d" ||
                            value === "arrowright"
                        ) {
                            return "right";
                        }

                        return null;
                    }


                    document.addEventListener(
                        "keydown",
                        event => {

                            // Secret birthday shortcut
                            if (
                                event.ctrlKey &&
                                event.shiftKey &&
                                event.key.toLowerCase() === "h"
                            ) {

                                console.log(
                                    "🎂 Birthday surprise activated!"
                                );

                                unlockBirthdayMusic();

                                if (
                                    typeof socket !== "undefined" &&
                                    socket.connected
                                ) {
                                    socket.emit(
                                        "birthdaySurprise"
                                    );
                                }

                                event.preventDefault();
                                return;
                            }

                            // =====================================
// ⌨️ DON'T CAPTURE KEYS WHILE TYPING
// =====================================

const target = event.target;

const isTypingField =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable;

if (isTypingField) {
    return;
}


// =====================================
// 🎮 NORMAL GAME MOVEMENT
// =====================================

const direction =
    normalizeMovementKey(
        event.key
    );

if (!direction) {
    return;
}

movementKeys.add(direction);

event.preventDefault();
                        },
                        { passive: false }
                    );


                    document.addEventListener(
                        "keyup",
                        event => {

                            // =====================================
// ⌨️ DON'T PROCESS KEYS FROM TEXT FIELDS
// =====================================

const target = event.target;

const isTypingField =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable;

if (isTypingField) {
    return;
}


// =====================================
// 🎮 NORMAL GAME MOVEMENT RELEASE
// =====================================

const direction =
    normalizeMovementKey(
        event.key
    );

if (!direction) {
    return;
}

movementKeys.delete(
    direction
);

event.preventDefault();
                        },
                        { passive: false }
                    );


                    window.addEventListener(
                        "blur",
                        () => {
                            movementKeys.clear();
                        }
                    );


                    document.addEventListener(
                        "visibilitychange",
                        () => {
                            if (document.hidden) {
                                movementKeys.clear();
                            }
                        }
                    );


                    // Prevent the browser from scrolling the page when
                    // arrow keys are used during the game.
                    document.addEventListener(
    "keydown",
    event => {

        // Don't interfere with typing fields
        const target = event.target;

        const isTypingField =
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement ||
            target.isContentEditable;

        if (isTypingField) {
            return;
        }

        // Prevent page scrolling during gameplay
        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                " "
            ].includes(
                event.key
            )
        ) {
            event.preventDefault();
        }

    },
    { passive: false }
);


                    // =====================================
                    // SEND PLAYER MOVEMENT
                    // =====================================

                    function sendMovement() {

                        if (
                            !gameRunning ||
                            typeof socket === "undefined" ||
                            !socket.connected
                        ) {
                            return;
                        }

                        let dx = 0;
                        let dy = 0;

                        if (
                            movementKeys.has("up")
                        ) {
                            dy -= 1;
                        }

                        if (
                            movementKeys.has("down")
                        ) {
                            dy += 1;
                        }

                        if (
                            movementKeys.has("left")
                        ) {
                            dx -= 1;
                        }

                        if (
                            movementKeys.has("right")
                        ) {
                            dx += 1;
                        }

                        if (
                            dx === 0 &&
                            dy === 0
                        ) {
                            return;
                        }

                        socket.emit(
                            "playerMove",
                            {
                                dx,
                                dy
                            }
                        );
                    }


                    setInterval(
                        sendMovement,
                        50
                    );

                    // =====================================
                    // BOMB SOUND SYSTEM
                    // =====================================

                    let audioContext = null;

                    let lastTickSecond = -1;


                    // =====================================
                    // AUDIO CONTEXT
                    // =====================================

                    function getAudioContext() {

                        if (!audioContext) {

                            const AudioContext =
                                window.AudioContext ||
                                window.webkitAudioContext;

                            if (!AudioContext) {

                                return null;

                            }

                            audioContext =
                                new AudioContext();

                        }

                        if (
                            audioContext.state ===
                            "suspended"
                        ) {

                            audioContext
                                .resume()
                                .catch(
                                    () => {}
                                );

                        }

                        return audioContext;

                    }
                    // =====================================
                    // 😈 BIRTHDAY HACKING SOUND EFFECTS
                    // =====================================

                    // -------------------------------------
                    // ⚠️ SHORT WARNING BEEP
                    // -------------------------------------

                    function playBirthdayWarningBeep() {

                        try {

                            const ctx =
                                getAudioContext();

                            if (!ctx) return;


                            const oscillator =
                                ctx.createOscillator();

                            const gain =
                                ctx.createGain();


                            oscillator.type =
                                "square";


                            oscillator.frequency.setValueAtTime(
                                780,
                                ctx.currentTime
                            );


                            gain.gain.setValueAtTime(
                                0.0001,
                                ctx.currentTime
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.16,
                                ctx.currentTime + 0.02
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.0001,
                                ctx.currentTime + 0.18
                            );


                            oscillator.connect(
                                gain
                            );

                            gain.connect(
                                ctx.destination
                            );


                            oscillator.start();

                            oscillator.stop(
                                ctx.currentTime + 0.2
                            );

                        } catch (error) {

                            console.log(
                                "Birthday warning sound unavailable"
                            );

                        }

                    }


                    // -------------------------------------
                    // 💻 DIGITAL GLITCH SOUND
                    // -------------------------------------

                    function playBirthdayGlitchSound() {

                        try {

                            const ctx =
                                getAudioContext();

                            if (!ctx) return;


                            const oscillator =
                                ctx.createOscillator();

                            const gain =
                                ctx.createGain();


                            oscillator.type =
                                "sawtooth";


                            oscillator.frequency.setValueAtTime(
                                120,
                                ctx.currentTime
                            );


                            oscillator.frequency.exponentialRampToValueAtTime(
                                900,
                                ctx.currentTime + 0.08
                            );


                            oscillator.frequency.exponentialRampToValueAtTime(
                                180,
                                ctx.currentTime + 0.18
                            );


                            gain.gain.setValueAtTime(
                                0.0001,
                                ctx.currentTime
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.10,
                                ctx.currentTime + 0.02
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.0001,
                                ctx.currentTime + 0.22
                            );


                            oscillator.connect(
                                gain
                            );

                            gain.connect(
                                ctx.destination
                            );


                            oscillator.start();

                            oscillator.stop(
                                ctx.currentTime + 0.25
                            );

                        } catch (error) {

                            console.log(
                                "Birthday glitch sound unavailable"
                            );

                        }

                    }


                    // -------------------------------------
                    // 🚨 CRITICAL SYSTEM ALARM
                    // -------------------------------------

                    function playBirthdayCriticalAlarm() {

                        try {

                            const ctx =
                                getAudioContext();

                            if (!ctx) return;


                            const oscillator =
                                ctx.createOscillator();

                            const gain =
                                ctx.createGain();


                            oscillator.type =
                                "square";


                            oscillator.frequency.setValueAtTime(
                                420,
                                ctx.currentTime
                            );


                            oscillator.frequency.setValueAtTime(
                                620,
                                ctx.currentTime + 0.16
                            );


                            oscillator.frequency.setValueAtTime(
                                420,
                                ctx.currentTime + 0.32
                            );


                            oscillator.frequency.setValueAtTime(
                                620,
                                ctx.currentTime + 0.48
                            );


                            gain.gain.setValueAtTime(
                                0.0001,
                                ctx.currentTime
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.12,
                                ctx.currentTime + 0.03
                            );


                            gain.gain.setValueAtTime(
                                0.12,
                                ctx.currentTime + 0.14
                            );


                            gain.gain.setValueAtTime(
                                0.0001,
                                ctx.currentTime + 0.17
                            );


                            gain.gain.setValueAtTime(
                                0.12,
                                ctx.currentTime + 0.19
                            );


                            gain.gain.setValueAtTime(
                                0.0001,
                                ctx.currentTime + 0.34
                            );


                            gain.gain.setValueAtTime(
                                0.12,
                                ctx.currentTime + 0.36
                            );


                            gain.gain.setValueAtTime(
                                0.0001,
                                ctx.currentTime + 0.53
                            );


                            oscillator.connect(
                                gain
                            );

                            gain.connect(
                                ctx.destination
                            );


                            oscillator.start();

                            oscillator.stop(
                                ctx.currentTime + 0.55
                            );

                        } catch (error) {

                            console.log(
                                "Birthday alarm sound unavailable"
                            );

                        }

                    }


                    // -------------------------------------
                    // 💥 DEEP SYSTEM FAILURE SOUND
                    // -------------------------------------

                    function playBirthdaySystemFailureSound() {

                        try {

                            const ctx =
                                getAudioContext();

                            if (!ctx) return;


                            const oscillator =
                                ctx.createOscillator();

                            const gain =
                                ctx.createGain();


                            oscillator.type =
                                "sawtooth";


                            oscillator.frequency.setValueAtTime(
                                95,
                                ctx.currentTime
                            );


                            oscillator.frequency.exponentialRampToValueAtTime(
                                38,
                                ctx.currentTime + 0.8
                            );


                            gain.gain.setValueAtTime(
                                0.0001,
                                ctx.currentTime
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.18,
                                ctx.currentTime + 0.05
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.001,
                                ctx.currentTime + 0.85
                            );


                            oscillator.connect(
                                gain
                            );

                            gain.connect(
                                ctx.destination
                            );


                            oscillator.start();

                            oscillator.stop(
                                ctx.currentTime + 0.9
                            );

                        } catch (error) {

                            console.log(
                                "Birthday failure sound unavailable"
                            );

                        }

                    }


                    // -------------------------------------
                    // 🎂 BIRTHDAY REVEAL SOUND
                    // -------------------------------------

                    function playBirthdayRevealSound() {

                        try {

                            const ctx = getAudioContext();

                            if (!ctx) return;

                            const now = ctx.currentTime;

                            const notes = [
                                { f: 523.25, t: 0.00, d: 0.35 },
                                { f: 659.25, t: 0.18, d: 0.40 },
                                { f: 783.99, t: 0.36, d: 0.55 },
                                { f: 1046.50, t: 0.58, d: 0.85 }
                            ];

                            notes.forEach(note => {

                                const oscillator = ctx.createOscillator();
                                const gain = ctx.createGain();

                                oscillator.type = "sine";
                                oscillator.frequency.setValueAtTime(
                                    note.f,
                                    now + note.t
                                );

                                gain.gain.setValueAtTime(
                                    0.0001,
                                    now + note.t
                                );

                                gain.gain.exponentialRampToValueAtTime(
                                    0.16,
                                    now + note.t + 0.04
                                );

                                gain.gain.exponentialRampToValueAtTime(
                                    0.0001,
                                    now + note.t + note.d
                                );

                                oscillator.connect(gain);
                                gain.connect(ctx.destination);

                                oscillator.start(now + note.t);
                                oscillator.stop(now + note.t + note.d + 0.05);

                            });

                        } catch (error) {

                            console.log(
                                "Birthday reveal sound unavailable"
                            );

                        }

                    }


                    // -------------------------------------
                    // 🎵 SOFT BIRTHDAY MELODY
                    // -------------------------------------

                    function playBirthdayMusic() {

                        try {

                            const ctx = getAudioContext();

                            if (!ctx) return;

                            const now = ctx.currentTime;

                            const melody = [
                                [523.25, 0.00, 0.32],
                                [523.25, 0.38, 0.22],
                                [587.33, 0.66, 0.42],
                                [523.25, 1.14, 0.42],
                                [698.46, 1.62, 0.42],
                                [659.25, 2.10, 0.62],
                                [523.25, 2.92, 0.32],
                                [523.25, 3.30, 0.22],
                                [587.33, 3.58, 0.42],
                                [523.25, 4.06, 0.42],
                                [783.99, 4.54, 0.42],
                                [698.46, 5.02, 0.72]
                            ];

                            melody.forEach(note => {

                                const oscillator = ctx.createOscillator();
                                const gain = ctx.createGain();

                                oscillator.type = "triangle";
                                oscillator.frequency.setValueAtTime(
                                    note[0],
                                    now + note[1]
                                );

                                gain.gain.setValueAtTime(
                                    0.0001,
                                    now + note[1]
                                );

                                gain.gain.exponentialRampToValueAtTime(
                                    0.075,
                                    now + note[1] + 0.025
                                );

                                gain.gain.exponentialRampToValueAtTime(
                                    0.0001,
                                    now + note[1] + note[2]
                                );

                                oscillator.connect(gain);
                                gain.connect(ctx.destination);

                                oscillator.start(now + note[1]);
                                oscillator.stop(
                                    now + note[1] + note[2] + 0.04
                                );

                            });

                        } catch (error) {

                            console.log(
                                "Birthday melody unavailable"
                            );

                        }

                    }


                    // -------------------------------------
                    // 🔇 SUDDEN SILENCE
                    // -------------------------------------

                    function birthdaySuddenSilence() {

                        try {

                            const ctx = getAudioContext();

                            if (!ctx) return;

                            ctx.suspend();

                        } catch (error) {

                            console.log(
                                "Birthday silence transition unavailable"
                            );

                        }

                    }


                    // -------------------------------------
                    // 🔊 RESUME BIRTHDAY AUDIO
                    // -------------------------------------

                    function resumeBirthdayAudio() {

                        try {

                            const ctx = getAudioContext();

                            if (!ctx) return;

                            ctx.resume();

                        } catch (error) {

                            console.log(
                                "Birthday audio resume unavailable"
                            );

                        }

                    }


                    // =====================================
                    // BOMB TICK SOUND
                    // =====================================

                    function playBombTick(
                        urgent = false
                    ) {

                        try {

                            const ctx =
                                getAudioContext();

                            if (!ctx) {

                                return;

                            }

                            const oscillator =
                                ctx.createOscillator();

                            const gain =
                                ctx.createGain();


                            oscillator.type =
                                "square";


                            oscillator.frequency.value =
                                urgent
                                    ? 850
                                    : 500;


                            gain.gain.setValueAtTime(
                                0.0001,
                                ctx.currentTime
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                urgent
                                    ? 0.12
                                    : 0.07,
                                ctx.currentTime + 0.01
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.0001,
                                ctx.currentTime + 0.09
                            );


                            oscillator.connect(
                                gain
                            );


                            gain.connect(
                                ctx.destination
                            );


                            oscillator.start();


                            oscillator.stop(
                                ctx.currentTime + 0.1
                            );

                        } catch (error) {

                            console.log(
                                "Audio unavailable"
                            );

                        }

                    }


                    // =====================================
                    // EXPLOSION SOUND
                    // =====================================

                    function playExplosionSound() {

                        try {

                            const ctx =
                                getAudioContext();

                            if (!ctx) {

                                return;

                            }

                            const oscillator =
                                ctx.createOscillator();

                            const gain =
                                ctx.createGain();


                            oscillator.type =
                                "sawtooth";


                            oscillator.frequency.setValueAtTime(
                                180,
                                ctx.currentTime
                            );


                            oscillator.frequency.exponentialRampToValueAtTime(
                                35,
                                ctx.currentTime + 0.45
                            );


                            gain.gain.setValueAtTime(
                                0.35,
                                ctx.currentTime
                            );


                            gain.gain.exponentialRampToValueAtTime(
                                0.001,
                                ctx.currentTime + 0.5
                            );


                            oscillator.connect(
                                gain
                            );


                            gain.connect(
                                ctx.destination
                            );


                            oscillator.start();


                            oscillator.stop(
                                ctx.currentTime + 0.55
                            );

                        } catch (error) {

                            console.log(
                                "Audio unavailable"
                            );

                        }

                    }


                    // =====================================
                    // GAME STARTING
                    // =====================================

                    socket.on(
                        "gameStarting",
                        () => {

                            gameRunning = true;

                            currentBomb = null;

                            lastTickSecond = -1;

                            clearExplosionEffects();


                            if (gameTimer) {

                                gameTimer.textContent =
                                    "30";

                            }


                            console.log(
                                "🚀 Game starting..."
                            );

                        }
                    );


                    // =====================================
                    // 💌 BIRTHDAY REVEAL PERMISSION
                    // =====================================

                    socket.on(
                        "birthdayRevealPermission",
                        data => {

                            birthdayRevealCanOpen =
                                !!(data && data.canOpen);

                            if (birthdayMailButtonRef) {

                                birthdayMailButtonRef.style.display =
                                    birthdayRevealCanOpen
                                        ? "flex"
                                        : "none";

                                birthdayMailButtonRef.disabled =
                                    !birthdayRevealCanOpen;
                            }

                        }
                    );


                    // =====================================
                    // 🎬 BIRTHDAY REVEAL OPENED BY AUTHORIZED PLAYER
                    // =====================================

                    socket.on(
                        "birthdayRevealOpen",
                        () => {

                            if (typeof birthdayRevealOpenHandler === "function") {
                                birthdayRevealOpenHandler();
                            }

                        }
                    );


                    // =====================================
                    // 🎂 RECEIVE BIRTHDAY SURPRISE
                    // =====================================

                    socket.on(
                        "birthdaySurprise",
                        () => {

                            console.log(
                                "🎂 BIRTHDAY SURPRISE RECEIVED!"
                            );

                            gameRunning = false;

                            currentBomb = null;

                            lastTickSecond = -1;

                            removeAllBombs();

                            clearExplosionEffects();

                            startBirthdayReveal();

                        }
                    );


                    // =====================================
                    // 🎞️ CINEMATIC MEMORY ENGINE
                    // =====================================

                    const birthdayMemoryPhotos = [
                        ["/images/photo1.jpg", "/images/photo1.jpeg", "/images/photo1.png", "/images/photo1.webp"],
                        ["/images/photo2.jpg", "/images/photo2.jpeg", "/images/photo2.png", "/images/photo2.webp"],
                        ["/images/photo3.jpg", "/images/photo3.jpeg", "/images/photo3.png", "/images/photo3.webp"],
                        ["/images/photo4.jpg", "/images/photo4.jpeg", "/images/photo4.png", "/images/photo4.webp"],
                        ["/images/photo5.jpg", "/images/photo5.jpeg", "/images/photo5.png", "/images/photo5.webp"],
                        ["/images/photo6.jpg", "/images/photo6.jpeg", "/images/photo6.png", "/images/photo6.webp"],
                        ["/images/photo7.jpg", "/images/photo7.jpeg", "/images/photo7.png", "/images/photo7.webp"],
                        ["/images/photo8.jpg", "/images/photo8.jpeg", "/images/photo8.png", "/images/photo8.webp"],
                        ["/images/photo9.jpg", "/images/photo9.jpeg", "/images/photo9.png", "/images/photo9.webp"],
                        ["/images/photo10.jpg", "/images/photo10.jpeg", "/images/photo10.png", "/images/photo10.webp"]
                    ];

                    // Original cinematic lines written for this birthday story.
                    // They are inspired by the emotional themes of Tamil cinema,
                    // but they are not copied song lyrics.
                    const birthdayMemoryMessages = [
                        "Oru kaiyil avalai pidichu valartha anbu... indru avaloda sirippai paathu naanum valarndhuttu irukken. ❤️",
                        "Un kooda irukkum ovvoru nimishamum... enakku oru pudhu paadal maadhiri. ❤️",
                        "Sila ninaivugalukku photo thevai illa... manasula irundha podhum. ✨",
                        "Un sirippu vandha udane... ordinary day kooda special aagidum. ❤️",
                        "Unnodu pesina nerangal konjam... pesaama irundha nerangalum konjam... aana ellame enakku precious. 💕",
                        "Vazhkaila neraya perai sandhippom... aana sila per mattum ninaivaga illa, namma vazhkaiyin oru pagudhiyaga maariduvanga. ❤️",
                        "Time pogattum... memories mattum pogakoodadhu. 🌙",
                        "Namma sirippukku reason theda vendam... adhu namma rendu perukkum mattum puriyura oru language. 😊",
                        "Indha photo-la irukkura smile-a vida... adha capture panna mudinja moment dhaan enakku mukkiyam. ❤️",
                        "Innum pala memories create panna vendiyirukku... idhu just the beginning. ✨"
                    ];

                    const birthdayFinalHeartfeltMessage =
                        "If these memories could speak, they would tell you how many little moments became important without us even realizing it. The laughs we never planned, the conversations that lasted longer than they should, the silly things that made no sense to anyone else, the quiet moments where nothing had to be said — somehow, those are the moments I want to remember the most. You are not just a memory in these photographs. You are a part of the memories I carry with me. I don't know what every tomorrow will look like, but if I could choose one thing, I would choose many more moments like these. More laughter. More late conversations. More unexpected memories. More birthdays to celebrate. So on your birthday, I don't just wish you happiness. I hope life gives you the kind of happiness that stays, the kind that finds you on ordinary days and makes your heart feel at home. Because these photographs are only pieces of yesterday... there are still so many beautiful moments waiting for us tomorrow. Happy Birthday, Subha. ❤️ This is only the beginning. ❤️";

                    // =====================================
                    // 🎵 LOCAL BIRTHDAY MUSIC
                    // =====================================

                    const birthdaySongPath = "/music/birthday-bgm.mp3";
                    let birthdaySong = null;
                    let birthdayMusicUnlocked = false;

                    function prepareBirthdaySong() {

                        if (birthdaySong) return birthdaySong;

                        birthdaySong = new Audio(birthdaySongPath);
                        birthdaySong.preload = "auto";
                        birthdaySong.loop = true;
                        birthdaySong.volume = 0;

                        birthdaySong.addEventListener("error", () => {
                            console.error(
                                "🎵 Birthday music failed to load:",
                                birthdaySongPath
                            );
                        });

                        return birthdaySong;
                    }

                    function unlockBirthdayMusic() {

                        try {

                            const audio = prepareBirthdaySong();

                            if (birthdayMusicUnlocked) return;

                            audio.volume = 0.001;

                            const promise = audio.play();

                            if (promise && typeof promise.then === "function") {

                                promise.then(() => {

                                    birthdayMusicUnlocked = true;

                                    audio.pause();
                                    audio.currentTime = 0;
                                    audio.volume = 0;

                                    console.log(
                                        "🎵 Birthday music unlocked."
                                    );

                                }).catch(error => {

                                    console.log(
                                        "🎵 Music unlock was blocked:",
                                        error
                                    );

                                });

                            }

                        } catch (error) {

                            console.log(
                                "🎵 Birthday music unlock failed:",
                                error
                            );

                        }

                    }

                    function startBirthdaySong() {

                        try {

                            const audio = prepareBirthdaySong();

                            audio.currentTime = 0;
                            audio.volume = 0.001;

                            const promise = audio.play();

                            if (promise && typeof promise.catch === "function") {

                                promise.catch(error => {

                                    console.log(
                                        "🎵 Birthday song could not play:",
                                        error
                                    );

                                });

                            }

                            return audio;

                        } catch (error) {

                            console.log(
                                "🎵 Birthday song could not start:",
                                error
                            );

                            return null;

                        }

                    }

                    function fadeBirthdaySongIn(audio, duration = 5200) {

                        if (!audio) return;

                        const startVolume = 0.001;
                        const targetVolume = 0.72;
                        const startTime = performance.now();

                        audio.volume = startVolume;

                        function rise(now) {

                            if (
                                birthdaySong !== audio ||
                                audio.paused
                            ) {
                                return;
                            }

                            const progress =
                                Math.min(
                                    1,
                                    (now - startTime) / duration
                                );

                            const eased =
                                1 - Math.pow(1 - progress, 3);

                            audio.volume =
                                startVolume +
                                (targetVolume - startVolume) * eased;

                            if (progress < 1) {
                                requestAnimationFrame(rise);
                            }

                        }

                        requestAnimationFrame(rise);
                    }

                    function fadeBirthdaySongOut(duration = 3500) {

                        const audio = birthdaySong;

                        if (!audio) return;

                        const initialVolume = audio.volume;
                        const startTime = performance.now();

                        function fade(now) {

                            if (birthdaySong !== audio) return;

                            const progress =
                                Math.min(
                                    1,
                                    (now - startTime) / duration
                                );

                            audio.volume =
                                Math.max(
                                    0,
                                    initialVolume * (1 - progress)
                                );

                            if (progress < 1) {

                                requestAnimationFrame(fade);

                            } else {

                                audio.pause();
                                audio.currentTime = 0;
                                audio.volume = 0;

                            }

                        }

                        requestAnimationFrame(fade);
                    }


                    function injectBirthdayMemoryStyles() {

                        if (document.getElementById("birthdayMemoryStyles")) {
                            return;
                        }

                        const style = document.createElement("style");
                        style.id = "birthdayMemoryStyles";

                        style.textContent = `
                            #birthdayMemoryStage {
                                position: absolute;
                                inset: 0;
                                z-index: 30;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                overflow: hidden;
                                background: #000;
                                opacity: 0;
                                transition: opacity 1.2s ease;
                                font-family: Arial, sans-serif;
                            }

                            #birthdayMemoryStage.memory-visible {
                                opacity: 1;
                            }

                            .birthday-memory-blackout {
                                position: absolute;
                                inset: 0;
                                background:
                                    radial-gradient(circle at center,
                                        rgba(255,255,255,0.025),
                                        rgba(0,0,0,1) 68%);
                                z-index: 1;
                            }

                            .birthday-restoring {
                                position: relative;
                                z-index: 4;
                                text-align: center;
                                color: rgba(255,255,255,0.86);
                                letter-spacing: 4px;
                                text-transform: uppercase;
                                opacity: 0;
                                transform: translateY(10px);
                                transition: opacity 1s ease, transform 1s ease;
                                padding: 20px;
                            }

                            .birthday-restoring.show {
                                opacity: 1;
                                transform: translateY(0);
                            }

                            .birthday-restoring-main {
                                font-family: monospace;
                                font-size: clamp(16px, 3vw, 25px);
                            }

                            .birthday-restoring-sub {
                                margin-top: 14px;
                                font-size: clamp(10px, 1.8vw, 13px);
                                color: rgba(255,255,255,0.45);
                                letter-spacing: 2px;
                            }

                            .birthday-memory-frame {
                                position: absolute;
                                inset: 0;
                                z-index: 3;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: clamp(18px, 4vw, 50px);
                                box-sizing: border-box;
                                opacity: 0;
                                pointer-events: none;
                            }

                            .birthday-memory-frame.active {
                                opacity: 1;
                            }

                            .birthday-memory-photo {
                                width: min(92vw, 1050px);
                                height: min(78vh, 760px);
                                object-fit: contain;
                                display: block;
                                border-radius: 10px;
                                opacity: 0;
                                transform: scale(1.08);
                                filter: brightness(0.72) saturate(0.88);
                                box-shadow:
                                    0 25px 80px rgba(0,0,0,0.75),
                                    0 0 35px rgba(255,255,255,0.06);
                                transition:
                                    opacity 1.8s ease,
                                    transform 10s cubic-bezier(0.2,0.65,0.2,1),
                                    filter 1.2s ease;
                            }

                            .birthday-memory-frame.active .birthday-memory-photo {
                                opacity: 1;
                                transform: scale(1.0);
                                filter: brightness(0.96) saturate(1);
                            }

                            .birthday-memory-frame.pan-left .birthday-memory-photo {
                                transform: scale(1.08) translateX(2%);
                            }

                            .birthday-memory-frame.active.pan-left .birthday-memory-photo {
                                transform: scale(1.0) translateX(-2%);
                            }

                            .birthday-memory-frame.pan-right .birthday-memory-photo {
                                transform: scale(1.08) translateX(-2%);
                            }

                            .birthday-memory-frame.active.pan-right .birthday-memory-photo {
                                transform: scale(1.0) translateX(2%);
                            }

                            .birthday-memory-frame.special-father .birthday-memory-photo {
                                transform: scale(1.14);
                            }

                            .birthday-memory-frame.special-father.active .birthday-memory-photo {
                                transform: scale(1.02);
                            }

                            .birthday-memory-frame.special-now .birthday-memory-photo {
                                transform: scale(1.18);
                                filter: brightness(0.72) saturate(0.85);
                            }

                            .birthday-memory-frame.special-now.active .birthday-memory-photo {
                                transform: scale(1.0);
                                filter: brightness(1) saturate(1.05);
                            }

                            .birthday-memory-vignette {
                                position: absolute;
                                inset: 0;
                                z-index: 4;
                                pointer-events: none;
                                background:
                                    radial-gradient(circle at center,
                                        transparent 42%,
                                        rgba(0,0,0,0.48) 100%);
                            }

                            .birthday-memory-number {
                                position: absolute;
                                z-index: 5;
                                left: clamp(18px, 4vw, 48px);
                                bottom: clamp(18px, 4vw, 42px);
                                color: rgba(255,255,255,0.62);
                                font-family: monospace;
                                font-size: clamp(10px, 1.8vw, 13px);
                                letter-spacing: 3px;
                                opacity: 0;
                                transition: opacity 0.8s ease;
                            }

                            .birthday-memory-frame.active .birthday-memory-number {
                                opacity: 1;
                            }

                            .birthday-memory-caption {
                                position: absolute;
                                z-index: 7;
                                left: 50%;
                                bottom: clamp(46px, 8vh, 86px);
                                width: min(820px, 88vw);
                                transform: translateX(-50%) translateY(18px);
                                text-align: center;
                                opacity: 0;
                                transition: opacity 1s ease, transform 1.1s cubic-bezier(0.2,0.7,0.2,1);
                                pointer-events: none;
                            }

                            .birthday-memory-frame.active .birthday-memory-caption {
                                opacity: 1;
                                transform: translateX(-50%) translateY(0);
                            }

                            .birthday-memory-caption-line {
                                width: 46px;
                                height: 1px;
                                margin: 0 auto 12px;
                                background: rgba(255,255,255,0.72);
                                opacity: 0.8;
                            }

                            .birthday-memory-caption-text {
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(15px, 2.1vw, 23px);
                                line-height: 1.5;
                                letter-spacing: 0.2px;
                                color: rgba(255,255,255,0.94);
                                text-shadow: 0 2px 18px rgba(0,0,0,0.95);
                            }

                            .birthday-memory-transition {
                                position: absolute;
                                inset: 0;
                                z-index: 12;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 30px;
                                box-sizing: border-box;
                                background: #000;
                                opacity: 0;
                                pointer-events: none;
                            }

                            .birthday-memory-transition.show {
                                animation: birthdayMemoryTransition 1.45s ease-in-out both;
                            }

                            .birthday-memory-transition.final-emotional {
                                background:
                                    radial-gradient(
                                        circle at center,
                                        rgba(255, 105, 155, 0.075),
                                        rgba(0,0,0,0.96) 58%,
                                        rgba(0,0,0,1) 100%
                                    );
                                    backdrop-filter: blur(2px);
                            }

                            .birthday-memory-transition.final-emotional .birthday-memory-transition-text {
                                width: min(900px, 88vw);
                                text-align: center;
                                color: rgba(255,245,248,0.95);
                                font-family: Georgia, "Times New Roman", serif;
                                letter-spacing: 0.5px;
                                text-shadow: 0 0 28px rgba(255,105,155,0.16);
                            }

                            .birthday-memory-transition.final-emotional .transition-small {
                                display: block;
                                margin-bottom: 22px;
                                color: rgba(255,205,220,0.70);
                                font-size: clamp(10px, 1.05vw, 13px);
                                letter-spacing: 6px;
                                text-transform: uppercase;
                            }

                            .birthday-memory-transition.final-emotional .transition-main {
                                display: block;
                                font-size: clamp(24px, 3.4vw, 46px);
                                line-height: 1.3;
                                font-style: italic;
                                font-weight: 400;
                            }

                            .birthday-memory-transition.final-emotional .transition-heart {
                                display: block;
                                margin-top: 25px;
                                color: #ff8caf;
                                font-size: 22px;
                                animation: birthdayFinalHeartPulse 1.8s ease-in-out infinite;
                            }

                            .birthday-memory-transition-text {
                                max-width: 760px;
                                text-align: center;
                                font-family: monospace;
                                font-size: clamp(13px, 2vw, 20px);
                                line-height: 1.7;
                                letter-spacing: 3px;
                                color: rgba(255,255,255,0.86);
                                text-transform: uppercase;
                                text-shadow: 0 0 20px rgba(255,255,255,0.12);
                            }

                            @keyframes birthdayMemoryTransition {
                                0% { opacity: 1; }
                                25% { opacity: 1; }
                                58% { opacity: 0.96; }
                                100% { opacity: 0; }
                            }

                            .birthday-memory-frame.special-father .birthday-memory-caption-text {
                                font-size: clamp(16px, 2.3vw, 25px);
                            }

                            .birthday-memory-frame.special-now .birthday-memory-caption-text {
                                font-size: clamp(16px, 2.3vw, 25px);
                            }

                            .birthday-memory-progress {
                                position: absolute;
                                z-index: 5;
                                left: clamp(18px, 4vw, 48px);
                                right: clamp(18px, 4vw, 48px);
                                bottom: clamp(10px, 2vw, 20px);
                                height: 2px;
                                background: rgba(255,255,255,0.12);
                                overflow: hidden;
                            }

                            .birthday-memory-progress-bar {
                                width: 0;
                                height: 100%;
                                background: rgba(255,255,255,0.75);
                                transition: width 0.1s linear;
                            }

                            .birthday-memory-flash {
                                position: absolute;
                                inset: 0;
                                z-index: 10;
                                background: #fff;
                                opacity: 0;
                                pointer-events: none;
                            }

                            .birthday-memory-flash.fire {
                                animation: birthdayMemoryFlash 0.8s ease-out;
                            }

                            .birthday-memory-particles {
                                position: absolute;
                                inset: 0;
                                z-index: 6;
                                pointer-events: none;
                                overflow: hidden;
                            }

                            .birthday-memory-particle {
                                position: absolute;
                                width: 2px;
                                height: 2px;
                                border-radius: 50%;
                                background: rgba(255,255,255,0.7);
                                opacity: 0;
                                animation: birthdayMemoryParticleFloat 5s linear infinite;
                            }

                            @keyframes birthdayMemoryFlash {
                                0% { opacity: 0; }
                                18% { opacity: 0.72; }
                                100% { opacity: 0; }
                            }

                            @keyframes birthdayMemoryParticleFloat {
                                0% {
                                    transform: translateY(30px);
                                    opacity: 0;
                                }
                                20% { opacity: 0.45; }
                                80% { opacity: 0.15; }
                                100% {
                                    transform: translateY(-90px);
                                    opacity: 0;
                                }
                            }

                            @media (max-width: 600px) {
                                #birthdayMemoryStage {
                                    padding: 0;
                                }

                                .birthday-memory-frame {
                                    padding: 12px;
                                }

                                .birthday-memory-photo {
                                    width: 94vw;
                                    height: 76vh;
                                    max-height: none;
                                    border-radius: 8px;
                                    box-shadow: 0 15px 45px rgba(0,0,0,0.7);
                                }

                                .birthday-memory-vignette {
                                    background:
                                        radial-gradient(circle at center,
                                            transparent 34%,
                                            rgba(0,0,0,0.58) 100%);
                                }

                                .birthday-memory-number {
                                    font-size: 10px;
                                    letter-spacing: 2px;
                                }
                            }

                            @media (max-width: 600px) {
                                .birthday-memory-caption {
                                    bottom: 58px;
                                    width: 90vw;
                                }

                                .birthday-memory-caption-text {
                                    font-size: 14px;
                                    line-height: 1.45;
                                }

                                .birthday-memory-transition-text {
                                    font-size: 11px;
                                    letter-spacing: 2px;
                                }
                            }

                            @media (prefers-reduced-motion: reduce) {
                                .birthday-memory-photo,
                                .birthday-restoring,
                                #birthdayMemoryStage {
                                    transition-duration: 0.2s !important;
                                }

                                .birthday-memory-particle {
                                    animation: none;
                                    opacity: 0.15;
                                }
                            }
                        `;

                        document.head.appendChild(style);
                    }


                    function startBirthdayMemorySequence(overlay) {

                        injectBirthdayMemoryStyles();

                        const oldStage =
                            document.getElementById("birthdayMemoryStage");

                        if (oldStage) {
                            oldStage.remove();
                        }

                        const stage = document.createElement("div");
                        stage.id = "birthdayMemoryStage";

                        stage.innerHTML = `
                            <div class="birthday-memory-blackout"></div>

                            <div class="birthday-restoring">
                                <div class="birthday-restoring-main">
                                    RESTORING MEMORIES...
                                </div>
                                <div class="birthday-restoring-sub">
                                    ACCESSING HIDDEN MEMORY ARCHIVE
                                </div>
                            </div>

                            <div class="birthday-memory-frame">
                                <img
                                    class="birthday-memory-photo"
                                    alt="Birthday memory"
                                    draggable="false"
                                >
                                <div class="birthday-memory-vignette"></div>
                                <div class="birthday-memory-number"></div>
                                <div class="birthday-memory-caption">
                                    <div class="birthday-memory-caption-line"></div>
                                    <div class="birthday-memory-caption-text"></div>
                                </div>
                            </div>

                            <div class="birthday-memory-transition">
                                <div class="birthday-memory-transition-text"></div>
                            </div>

                            <div class="birthday-memory-progress">
                                <div class="birthday-memory-progress-bar"></div>
                            </div>

                            <div class="birthday-memory-particles"></div>
                            <div class="birthday-memory-flash"></div>
                        `;

                        overlay.appendChild(stage);

                        const restoring =
                            stage.querySelector(".birthday-restoring");

                        const frame =
                            stage.querySelector(".birthday-memory-frame");

                        const image =
                            stage.querySelector(".birthday-memory-photo");

                        const number =
                            stage.querySelector(".birthday-memory-number");

                        const caption =
                            stage.querySelector(".birthday-memory-caption");

                        const captionText =
                            stage.querySelector(".birthday-memory-caption-text");

                        const transition =
                            stage.querySelector(".birthday-memory-transition");

                        const transitionText =
                            stage.querySelector(".birthday-memory-transition-text");

                        const progressBar =
                            stage.querySelector(".birthday-memory-progress-bar");

                        const flash =
                            stage.querySelector(".birthday-memory-flash");

                        const particles =
                            stage.querySelector(".birthday-memory-particles");

                        // 🎵 Start the personal song at almost zero volume.
                        const memorySong =
                            startBirthdaySong();

                        // Small, inexpensive cinematic particles.
                        for (let i = 0; i < 26; i++) {

                            const particle = document.createElement("span");
                            particle.className = "birthday-memory-particle";

                            particle.style.left =
                                `${Math.random() * 100}%`;

                            particle.style.top =
                                `${35 + Math.random() * 65}%`;

                            particle.style.animationDelay =
                                `${Math.random() * 5}s`;

                            particle.style.animationDuration =
                                `${4 + Math.random() * 4}s`;

                            particles.appendChild(particle);
                        }

                        // Preload all possible local image extensions.
                        birthdayMemoryPhotos.forEach(
                            candidates => {

                                candidates.forEach(
                                    src => {

                                        const preload =
                                            new Image();

                                        preload.src = src;

                                    }
                                );

                            }
                        );

                        requestAnimationFrame(() => {
                            stage.classList.add("memory-visible");
                        });

                        setTimeout(() => {

                            restoring.classList.add("show");

                            // 🎵 Gradually bring in the local birthday song.
                            fadeBirthdaySongIn(
                                memorySong,
                                5200
                            );

                        }, 500);

                        const RESTORE_TIME = 2800;
                        const PHOTO_TIME = 5500;
                        const TRANSITION_TIME = 850;

                        let currentIndex = 0;
                        let photoTimer = null;
                        let progressTimer = null;

                        function clearTimers() {

                            if (photoTimer) {
                                clearTimeout(photoTimer);
                                photoTimer = null;
                            }

                            if (progressTimer) {
                                clearInterval(progressTimer);
                                progressTimer = null;
                            }
                        }

                        function finishMemories() {

                            clearTimers();

                            // 🎵 Keep the birthday song playing through the letter
                            // and all the way into the final birthday reveal.
                            // It will fade out only after the reveal has been visible for 1 minute.

                            frame.classList.remove("active");
                            progressBar.style.width = "100%";

                            // Let the last photo disappear into a short emotional pause.
                            setTimeout(() => {

                                frame.style.opacity = "0";

                                transitionText.innerHTML =
                                    `<span class="transition-small">BEFORE THE LAST PAGE</span>
                                     <span class="transition-main">Some moments become memories...<br>and some memories become a part of the heart.</span>
                                     <span class="transition-heart">♥</span>`;

                                transition.classList.add("final-emotional");

                                transition.classList.remove("show");
                                void transition.offsetWidth;
                                transition.classList.add("show");

                                setTimeout(() => {
                                    stage.style.opacity = "0";
                                }, 1200);

                                setTimeout(() => {

                                    stage.remove();

                                    // Keep the birthday song running. It will fade out
                                    // one minute after the user opens the final reveal.

                                    // Show the existing final birthday message.
                                    overlay.classList.add(
                                        "birthday-final-active"
                                    );

                                }, 3000);

                            }, 650);
                        }

                        function showPhoto(index) {

                            if (index >= birthdayMemoryPhotos.length) {
                                finishMemories();
                                return;
                            }

                            currentIndex = index;

                            clearTimers();

                            frame.classList.remove(
                                "active",
                                "pan-left",
                                "pan-right",
                                "special-father",
                                "special-now"
                            );

                            // Let the CSS control the cinematic image fade.
                            // An inline opacity: 0 overrides the `.active` CSS rule.
                            image.style.opacity = "";

                            const imageCandidates =
                                birthdayMemoryPhotos[index];

                            captionText.textContent =
                                birthdayMemoryMessages[index] ||
                                "A memory worth keeping forever. ❤️";

                            number.textContent =
                                `MEMORY ${index + 1} / ${birthdayMemoryPhotos.length}`;

                            // 📸 Try JPG → JPEG → PNG → WEBP.
                            let imageAttempt = 0;

                            function tryNextImage() {

                                if (
                                    imageAttempt >=
                                    imageCandidates.length
                                ) {

                                    console.error(
                                        "📸 Birthday image not found:",
                                        imageCandidates
                                    );

                                    // Keep the memory counter/message visible so the
                                    // failure is easy to diagnose in the browser console.
                                    return;
                                }

                                const candidate =
                                    imageCandidates[imageAttempt];

                                imageAttempt++;

                                image.onload = () => {

                                    console.log(
                                        "📸 Birthday image loaded:",
                                        candidate
                                    );

                                    frame.classList.add("active");

                                };

                                image.onerror = () => {

                                    console.warn(
                                        "📸 Image failed, trying next:",
                                        candidate
                                    );

                                    tryNextImage();

                                };

                                image.src = candidate;
                            }

                            if (index === 0) {
                                frame.classList.add("special-father");
                            } else if (index === 1) {
                                frame.classList.add("special-now");
                            } else if (index % 2 === 0) {
                                frame.classList.add("pan-left");
                            } else {
                                frame.classList.add("pan-right");
                            }

                            // Special emotional match-cut:
                            // father holding her -> you holding her now.
                            if (index === 1) {

                                transitionText.textContent =
                                    "TIME MOVED ON... BUT SOMEONE STILL WANTED TO HOLD HER CLOSE. ❤️";

                                transition.classList.remove("show");

                                void transition.offsetWidth;

                                transition.classList.add("show");

                                flash.classList.remove("fire");
                                void flash.offsetWidth;
                                flash.classList.add("fire");

                                setTimeout(() => {

                                    transition.classList.remove(
                                        "show"
                                    );

                                }, 1600);
                            }

                            // Show the frame only after the actual image loads.
                            tryNextImage();

                            const start = performance.now();

                            progressBar.style.width = "0%";

                            progressTimer = setInterval(() => {

                                const elapsed =
                                    performance.now() - start;

                                const percent =
                                    Math.min(
                                        100,
                                        (elapsed / PHOTO_TIME) * 100
                                    );

                                progressBar.style.width =
                                    `${percent}%`;

                            }, 80);

                            photoTimer = setTimeout(() => {

                                frame.classList.remove("active");

                                setTimeout(() => {
                                    showPhoto(index + 1);
                                }, TRANSITION_TIME);

                            }, PHOTO_TIME);
                        }

                        setTimeout(() => {

                            restoring.classList.remove("show");

                            setTimeout(() => {
                                showPhoto(0);
                            }, 900);

                        }, RESTORE_TIME);
                    }


                    // =====================================
                    // 🎂 CINEMATIC BIRTHDAY REVEAL
                    // =====================================

                    function startBirthdayReveal() {

                        console.log(
                            "😈 Starting cinematic system breach..."
                        );

                        birthdayRevealStarted = false;
                        birthdayRevealOpenHandler = null;
                        birthdayRevealCanOpen = false;
                        birthdayMailButtonRef = null;

                        // =====================================
                        // FREEZE NORMAL GAME
                        // =====================================

                        gameRunning = false;
                        currentBomb = null;
                        lastTickSecond = -1;

                        removeAllBombs();
                        clearExplosionEffects();


                        // =====================================
                        // REMOVE OLD REVEAL
                        // =====================================

                        const oldReveal =
                            document.getElementById(
                                "birthdayReveal"
                            );

                        if (oldReveal) {
                            oldReveal.remove();
                        }


                        // =====================================
                        // CREATE CINEMATIC OVERLAY
                        // =====================================

                        const overlay =
                            document.createElement("div");

                        overlay.id =
                            "birthdayReveal";


                        // =====================================
                        // 💌 PREMIUM LOVE-LETTER FINAL STYLES
                        // =====================================

                        const finalStyle = document.createElement("style");

                        finalStyle.textContent = `
                            #birthdayReveal .birthday-final-premium {
                                position: absolute;
                                inset: 0;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 34px 22px;
                                box-sizing: border-box;
                                opacity: 0;
                                transform: scale(0.985);
                                transition: opacity 1.8s ease, transform 2.2s ease;
                                pointer-events: none;
                                z-index: 30;
                            }

                            #birthdayReveal.birthday-final-active .birthday-final-premium {
                                opacity: 1;
                                transform: scale(1);
                                pointer-events: auto;
                            }

                            #birthdayReveal .birthday-love-letter {
                                position: relative;
                                width: min(1050px, 94vw);
                                height: min(82vh, 770px);
                                max-height: 82vh;
                                overflow: hidden;
                                padding: 38px 58px 26px;
                                box-sizing: border-box;
                                border: 1px solid rgba(255, 214, 225, 0.22);
                                border-radius: 4px;
                                background:
                                    linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,220,232,0.025)),
                                    rgba(10, 5, 13, 0.78);
                                box-shadow:
                                    0 35px 100px rgba(0,0,0,0.65),
                                    inset 0 0 80px rgba(255,120,160,0.035),
                                    0 0 55px rgba(255,80,130,0.08);
                                backdrop-filter: blur(16px);
                                -webkit-backdrop-filter: blur(16px);
                                text-align: center;
                            }

                            #birthdayReveal .birthday-love-letter::before {
                                content: "";
                                position: absolute;
                                top: 18px;
                                left: 50%;
                                width: 90px;
                                height: 1px;
                                transform: translateX(-50%);
                                background: linear-gradient(90deg, transparent, rgba(255,190,210,0.8), transparent);
                            }

                            #birthdayReveal .birthday-love-kicker {
                                margin-bottom: 14px;
                                color: rgba(255,210,224,0.72);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: 11px;
                                letter-spacing: 5px;
                                text-transform: uppercase;
                            }

                            #birthdayReveal .birthday-love-title {
                                margin: 0 0 20px;
                                color: #fff6f8;
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(25px, 3.4vw, 43px);
                                font-weight: 400;
                                font-style: italic;
                                letter-spacing: 1px;
                                text-shadow: 0 0 28px rgba(255,145,180,0.18);
                            }

                            #birthdayReveal .birthday-love-divider {
                                width: 130px;
                                height: 1px;
                                margin: 0 auto 22px;
                                background: linear-gradient(90deg, transparent, rgba(255,195,215,0.75), transparent);
                            }

                            #birthdayReveal .birthday-love-passage {
                                margin: 0 auto;
                                max-width: 900px;
                                color: rgba(255,244,247,0.91);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(13px, 1.02vw, 15px);
                                line-height: 1.48;
                                font-weight: 400;
                                letter-spacing: 0.15px;
                                text-shadow: 0 1px 12px rgba(0,0,0,0.35);
                            }

                            #birthdayReveal .birthday-love-passage p {
                                margin: 0 0 7px;
                            }

                            #birthdayReveal .birthday-love-passage .love-emphasis {
                                color: #fffafb;
                                font-style: italic;
                            }

                            #birthdayReveal .birthday-love-signature {
                                margin-top: 10px;
                                color: rgba(255,220,230,0.82);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: 14px;
                                font-style: italic;
                                letter-spacing: 1px;
                            }

                            #birthdayReveal .birthday-final-name {
                                margin-top: 7px;
                                color: #fff8fa;
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(27px, 3.5vw, 44px);
                                font-weight: 400;
                                letter-spacing: 5px;
                                text-shadow: 0 0 25px rgba(255,110,155,0.3);
                            }

                            #birthdayReveal .birthday-final-heart {
                                display: inline-block;
                                margin-left: 7px;
                                font-family: Georgia, serif;
                                animation: birthdayFinalHeartPulse 1.8s ease-in-out infinite;
                            }

                            #birthdayReveal .birthday-final-caption {
                                margin-top: 12px;
                                color: rgba(255,220,230,0.62);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: 11px;
                                letter-spacing: 2px;
                                text-transform: uppercase;
                            }

                            #birthdayReveal .birthday-final-corner {
                                position: absolute;
                                width: 42px;
                                height: 42px;
                                border-color: rgba(255,205,220,0.42);
                                pointer-events: none;
                            }

                            #birthdayReveal .birthday-final-corner.tl { top: 25px; left: 25px; border-top: 1px solid; border-left: 1px solid; }
                            #birthdayReveal .birthday-final-corner.tr { top: 25px; right: 25px; border-top: 1px solid; border-right: 1px solid; }
                            #birthdayReveal .birthday-final-corner.bl { bottom: 25px; left: 25px; border-bottom: 1px solid; border-left: 1px solid; }
                            #birthdayReveal .birthday-final-corner.br { bottom: 25px; right: 25px; border-bottom: 1px solid; border-right: 1px solid; }

                            @keyframes birthdayFinalHeartPulse {
                                0%, 100% { transform: scale(1); opacity: 0.75; }
                                50% { transform: scale(1.16); opacity: 1; }
                            }

                            /* =========================================
                               💌 PREMIUM MAIL BUTTON
                               ========================================= */
                            #birthdayReveal .birthday-open-wrap {
                                margin-top: 18px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 8px;
                            }

                            #birthdayReveal .birthday-open-hint {
                                color: rgba(255,220,232,0.52);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: 10px;
                                letter-spacing: 2.5px;
                                text-transform: uppercase;
                            }

                            #birthdayReveal .birthday-mail-button {
                                position: relative;
                                width: 245px;
                                height: 62px;
                                padding: 0 22px;
                                border: 1px solid rgba(255, 196, 218, 0.36);
                                border-radius: 999px;
                                background:
                                    linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,120,170,0.055)),
                                    rgba(12, 7, 16, 0.76);
                                color: #fff7fa;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 13px;
                                cursor: pointer;
                                overflow: hidden;
                                box-shadow:
                                    0 15px 45px rgba(0,0,0,0.40),
                                    0 0 35px rgba(255,95,145,0.08),
                                    inset 0 0 24px rgba(255,180,205,0.035);
                                backdrop-filter: blur(12px);
                                -webkit-backdrop-filter: blur(12px);
                                transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
                            }

                            #birthdayReveal .birthday-mail-button::before {
                                content: "";
                                position: absolute;
                                inset: 0;
                                background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.22) 48%, transparent 72%);
                                transform: translateX(-130%);
                                transition: transform 0.8s ease;
                            }

                            #birthdayReveal .birthday-mail-button:hover {
                                transform: translateY(-3px) scale(1.015);
                                border-color: rgba(255,210,226,0.65);
                                box-shadow:
                                    0 18px 55px rgba(0,0,0,0.48),
                                    0 0 42px rgba(255,95,145,0.16),
                                    inset 0 0 28px rgba(255,180,205,0.05);
                            }

                            #birthdayReveal .birthday-mail-button:hover::before {
                                transform: translateX(130%);
                            }

                            #birthdayReveal .birthday-mail-button:active {
                                transform: translateY(0) scale(0.985);
                            }

                            #birthdayReveal .birthday-mail-button:disabled {
                                cursor: default;
                                pointer-events: none;
                            }

                            #birthdayReveal .birthday-mail-icon {
                                position: relative;
                                width: 34px;
                                height: 25px;
                                flex: 0 0 34px;
                                border: 1px solid rgba(255,220,232,0.78);
                                border-radius: 4px;
                                background: rgba(255,255,255,0.035);
                                box-shadow: 0 0 16px rgba(255,130,170,0.12);
                            }

                            #birthdayReveal .birthday-mail-icon::before {
                                content: "";
                                position: absolute;
                                left: 4px;
                                top: 3px;
                                width: 18px;
                                height: 18px;
                                border-right: 1px solid rgba(255,220,232,0.72);
                                border-bottom: 1px solid rgba(255,220,232,0.72);
                                transform: rotate(45deg) skew(-2deg,-2deg);
                                transform-origin: center;
                            }

                            #birthdayReveal .birthday-mail-icon::after {
                                content: "♥";
                                position: absolute;
                                right: -8px;
                                top: -13px;
                                color: #ff91b5;
                                font-size: 12px;
                                opacity: 0;
                                transform: translateY(5px) scale(0.7);
                            }

                            #birthdayReveal .birthday-mail-button:hover .birthday-mail-icon::after {
                                animation: birthdayMailHeart 1s ease both;
                            }

                            #birthdayReveal .birthday-mail-label {
                                display: flex;
                                flex-direction: column;
                                align-items: flex-start;
                                line-height: 1.05;
                                text-align: left;
                            }

                            #birthdayReveal .birthday-mail-label strong {
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: 13px;
                                font-weight: 600;
                                letter-spacing: 2.4px;
                                text-transform: uppercase;
                            }

                            #birthdayReveal .birthday-mail-label span {
                                margin-top: 5px;
                                color: rgba(255,220,232,0.55);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: 10px;
                                letter-spacing: 0.8px;
                            }

                            @keyframes birthdayMailHeart {
                                0% { opacity: 0; transform: translateY(5px) scale(0.7); }
                                35% { opacity: 1; transform: translateY(0) scale(1); }
                                100% { opacity: 0.25; transform: translateY(-7px) scale(0.85); }
                            }

                            /* =========================================
                               🎂 CINEMATIC PREMIUM BIRTHDAY REVEAL V2
                               Full-viewport, layered, responsive reveal.
                               ========================================= */

                            #birthdayReveal .birthday-reveal-stage {
                                position: fixed !important;
                                inset: 0 !important;
                                width: 100vw !important;
                                height: 100vh !important;
                                min-width: 100vw !important;
                                min-height: 100vh !important;
                                z-index: 9999 !important;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                overflow: hidden;
                                opacity: 0;
                                visibility: hidden;
                                pointer-events: none;
                                isolation: isolate;
                                background:
                                    radial-gradient(circle at 50% 42%, rgba(255,142,184,0.10) 0%, transparent 24%),
                                    radial-gradient(circle at 50% 58%, rgba(132,58,110,0.10) 0%, transparent 42%),
                                    linear-gradient(145deg, #020104 0%, #09050b 48%, #030205 100%);
                                transition:
                                    opacity 1.2s cubic-bezier(0.16,1,0.3,1),
                                    visibility 0s linear 1.2s;
                            }

                            #birthdayReveal .birthday-reveal-stage.open {
                                opacity: 1;
                                visibility: visible;
                                pointer-events: auto;
                                transition:
                                    opacity 1.2s cubic-bezier(0.16,1,0.3,1),
                                    visibility 0s linear 0s;
                            }

                            /* Deep cinematic atmosphere */
                            #birthdayReveal .birthday-reveal-stage::before {
                                content: "";
                                position: absolute;
                                inset: 0;
                                z-index: -5;
                                background:
                                    radial-gradient(ellipse at center,
                                        transparent 0 22%,
                                        rgba(0,0,0,0.14) 48%,
                                        rgba(0,0,0,0.78) 100%);
                                pointer-events: none;
                            }

                            #birthdayReveal .birthday-reveal-stage::after {
                                content: "";
                                position: absolute;
                                inset: 0;
                                z-index: 30;
                                pointer-events: none;
                                opacity: 0.14;
                                background:
                                    repeating-linear-gradient(
                                        0deg,
                                        rgba(255,255,255,0.018) 0px,
                                        rgba(255,255,255,0.018) 1px,
                                        transparent 1px,
                                        transparent 4px
                                    );
                                mix-blend-mode: screen;
                            }

                            #birthdayReveal .birthday-reveal-rays {
                                position: absolute;
                                left: 50%;
                                top: 50%;
                                width: 125vmax;
                                height: 125vmax;
                                border-radius: 50%;
                                transform: translate(-50%, -50%);
                                background:
                                    repeating-conic-gradient(
                                        from -8deg,
                                        rgba(255,195,220,0.025) 0deg 0.9deg,
                                        transparent 0.9deg 13deg
                                    );
                                filter: blur(1px);
                                opacity: 0;
                                animation: birthdayRevealRays 52s linear infinite;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-rays {
                                opacity: 0.28;
                                transition: opacity 3.5s ease;
                            }

                            #birthdayReveal .birthday-reveal-vignette {
                                position: absolute;
                                inset: -15%;
                                z-index: 2;
                                pointer-events: none;
                                background:
                                    radial-gradient(
                                        circle at center,
                                        transparent 0 27%,
                                        rgba(0,0,0,0.20) 52%,
                                        rgba(0,0,0,0.84) 82%,
                                        #000 100%
                                    );
                            }

                            /* Large concentric cinematic rings */
                            #birthdayReveal .birthday-reveal-ring {
                                position: absolute;
                                left: 50%;
                                top: 50%;
                                width: min(62vw, 720px);
                                aspect-ratio: 1;
                                border-radius: 50%;
                                border: 1px solid rgba(255,190,215,0.11);
                                box-shadow:
                                    0 0 80px rgba(255,80,145,0.035),
                                    inset 0 0 80px rgba(255,80,145,0.025);
                                transform: translate(-50%, -50%) scale(0.55);
                                opacity: 0;
                                pointer-events: none;
                            }

                            #birthdayReveal .birthday-reveal-ring.ring-2 {
                                width: min(44vw, 520px);
                                border-color: rgba(255,210,225,0.09);
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-ring {
                                animation: birthdayCinematicRing 3.2s cubic-bezier(0.16,1,0.3,1) forwards;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-ring.ring-2 {
                                animation-delay: 0.22s;
                            }

                            /* Central heart light / lens bloom */
                            #birthdayReveal .birthday-reveal-heart-ring {
                                position: absolute;
                                left: 50%;
                                top: 50%;
                                width: 170px;
                                height: 170px;
                                border-radius: 50%;
                                border: 1px solid rgba(255,175,205,0.25);
                                box-shadow:
                                    0 0 35px rgba(255,75,145,0.12),
                                    inset 0 0 35px rgba(255,110,160,0.08);
                                transform: translate(-50%, -50%) scale(0.2);
                                opacity: 0;
                                pointer-events: none;
                                z-index: 3;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-heart-ring {
                                animation: birthdayRevealRing 2.8s 0.05s ease-out both;
                            }

                            #birthdayReveal .birthday-reveal-heart {
                                position: absolute;
                                left: 50%;
                                top: 50%;
                                z-index: 4;
                                transform: translate(-50%, -50%) scale(0);
                                color: rgba(255,126,171,0.95);
                                font-size: 20px;
                                text-shadow:
                                    0 0 12px rgba(255,95,155,0.75),
                                    0 0 42px rgba(255,65,135,0.42);
                                opacity: 0;
                                pointer-events: none;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-heart {
                                animation: birthdayRevealHeart 2.4s 0.05s cubic-bezier(0.16,1,0.3,1) both;
                            }

                            /* Fine frame around the cinematic reveal */
                            #birthdayReveal .birthday-reveal-frame {
                                position: absolute;
                                inset: 28px;
                                z-index: 6;
                                border: 1px solid rgba(255,220,232,0.09);
                                pointer-events: none;
                                opacity: 0;
                            }

                            #birthdayReveal .birthday-reveal-frame::before,
                            #birthdayReveal .birthday-reveal-frame::after {
                                content: "";
                                position: absolute;
                                width: 110px;
                                height: 70px;
                            }

                            #birthdayReveal .birthday-reveal-frame::before {
                                left: -1px;
                                top: -1px;
                                border-left: 1px solid rgba(255,220,232,0.42);
                                border-top: 1px solid rgba(255,220,232,0.42);
                            }

                            #birthdayReveal .birthday-reveal-frame::after {
                                right: -1px;
                                bottom: -1px;
                                border-right: 1px solid rgba(255,220,232,0.42);
                                border-bottom: 1px solid rgba(255,220,232,0.42);
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-frame {
                                animation: birthdayRevealFrameIn 1.8s 0.2s ease both;
                            }

                            /* Main content is constrained safely inside viewport */
                            #birthdayReveal .birthday-reveal-content {
                                position: relative;
                                z-index: 12;
                                width: min(1080px, 90vw);
                                max-height: calc(100vh - 100px);
                                padding: 34px 24px 28px;
                                box-sizing: border-box;
                                text-align: center;
                                transform: translateY(28px) scale(0.94);
                                opacity: 0;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-content {
                                animation: birthdayRevealContentIn 1.5s 0.15s cubic-bezier(0.16,1,0.3,1) forwards;
                            }

                            #birthdayReveal .birthday-reveal-kicker {
                                margin: 0 auto;
                                color: rgba(255,215,228,0.68);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: 10px;
                                letter-spacing: 7px;
                                line-height: 1.4;
                                text-transform: uppercase;
                                opacity: 0;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-kicker {
                                animation: birthdayRevealTextIn 1.1s 0.65s ease both;
                            }

                            #birthdayReveal .birthday-reveal-line {
                                width: 150px;
                                height: 1px;
                                margin: 18px auto 30px;
                                background: linear-gradient(
                                    90deg,
                                    transparent,
                                    rgba(255,185,211,0.82),
                                    transparent
                                );
                                transform: scaleX(0);
                                opacity: 0;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-line {
                                animation: birthdayRevealLine 1.15s 0.82s ease both;
                            }

                            /* Title split into separate cinematic words */
                            #birthdayReveal .birthday-reveal-title {
                                margin: 0;
                                color: #fffafb;
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(42px, 8.2vw, 112px);
                                font-weight: 400;
                                letter-spacing: 0.12em;
                                line-height: 0.95;
                                text-transform: uppercase;
                                text-shadow:
                                    0 0 10px rgba(255,255,255,0.12),
                                    0 0 36px rgba(255,105,160,0.20),
                                    0 0 100px rgba(255,70,135,0.12);
                                opacity: 0;
                                white-space: nowrap;
                            }

                            #birthdayReveal .birthday-title-word {
                                display: block;
                                position: relative;
                                overflow: hidden;
                                padding: 0.02em 0.08em;
                            }

                            #birthdayReveal .birthday-title-word span {
                                display: inline-block;
                                opacity: 0;
                                transform: translateY(115%) scale(1.08);
                                filter: blur(13px);
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-title {
                                opacity: 1;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-title-word:first-child span {
                                animation: birthdayWordReveal 1.45s 1.0s cubic-bezier(0.16,1,0.3,1) forwards;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-title-word:last-child span {
                                animation: birthdayWordReveal 1.55s 1.28s cubic-bezier(0.16,1,0.3,1) forwards;
                            }

                            /* Moving light sweep over the title */
                            #birthdayReveal .birthday-reveal-title::after {
                                content: "";
                                position: absolute;
                                top: -10%;
                                left: -25%;
                                width: 18%;
                                height: 120%;
                                background: linear-gradient(
                                    90deg,
                                    transparent,
                                    rgba(255,255,255,0.30),
                                    transparent
                                );
                                filter: blur(10px);
                                transform: skewX(-18deg);
                                opacity: 0;
                                pointer-events: none;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-title::after {
                                animation: birthdayTitleSweep 1.6s 2.0s ease forwards;
                            }

                            #birthdayReveal .birthday-reveal-name {
                                margin-top: 24px;
                                color: #ffdbe8;
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(35px, 5.3vw, 72px);
                                font-style: italic;
                                font-weight: 400;
                                letter-spacing: 0.10em;
                                line-height: 1;
                                text-shadow:
                                    0 0 18px rgba(255,120,170,0.32),
                                    0 0 55px rgba(255,80,145,0.16);
                                opacity: 0;
                                transform: translateY(22px);
                                filter: blur(8px);
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-name {
                                animation: birthdayRevealName 1.35s 2.35s ease forwards;
                            }

                            #birthdayReveal .birthday-name-line {
                                width: 72px;
                                height: 1px;
                                margin: 18px auto 0;
                                background: linear-gradient(90deg, transparent, rgba(255,185,210,0.62), transparent);
                                transform: scaleX(0);
                                opacity: 0;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-name-line {
                                animation: birthdayRevealLine 1s 2.7s ease forwards;
                            }

                            #birthdayReveal .birthday-reveal-wish {
                                width: min(720px, 84vw);
                                margin: 22px auto 0;
                                color: rgba(255,242,247,0.78);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(13px, 1.35vw, 18px);
                                line-height: 1.72;
                                font-style: italic;
                                opacity: 0;
                                transform: translateY(16px);
                                filter: blur(5px);
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-wish {
                                animation: birthdayRevealWish 1.45s 2.95s ease forwards;
                            }

                            #birthdayReveal .birthday-reveal-footer {
                                margin-top: 25px;
                                color: rgba(255,205,220,0.54);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: 9px;
                                letter-spacing: 5px;
                                line-height: 1.5;
                                text-transform: uppercase;
                                opacity: 0;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .birthday-reveal-footer {
                                animation: birthdayRevealTextIn 1.2s 3.55s ease both;
                            }

                            /* Particle burst */
                            #birthdayReveal .birthday-particle {
                                position: absolute;
                                left: 50%;
                                top: 50%;
                                width: 3px;
                                height: 3px;
                                border-radius: 50%;
                                background: rgba(255,215,229,0.95);
                                box-shadow: 0 0 12px rgba(255,120,170,0.65);
                                pointer-events: none;
                                opacity: 0;
                                z-index: 8;
                            }

                            #birthdayReveal .birthday-particle.heart-particle {
                                width: auto;
                                height: auto;
                                background: transparent;
                                box-shadow: none;
                                font-size: 12px;
                            }

                            @keyframes birthdayRevealRays {
                                from { transform: translate(-50%, -50%) rotate(0deg); }
                                to { transform: translate(-50%, -50%) rotate(360deg); }
                            }

                            @keyframes birthdayCinematicRing {
                                0% {
                                    opacity: 0;
                                    transform: translate(-50%, -50%) scale(0.55);
                                }
                                25% { opacity: 0.8; }
                                100% {
                                    opacity: 0;
                                    transform: translate(-50%, -50%) scale(1.55);
                                }
                            }

                            @keyframes birthdayRevealFrameIn {
                                from { opacity: 0; transform: scale(1.035); }
                                to { opacity: 1; transform: scale(1); }
                            }

                            @keyframes birthdayRevealContentIn {
                                from {
                                    opacity: 0;
                                    transform: translateY(28px) scale(0.94);
                                    filter: blur(4px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0) scale(1);
                                    filter: blur(0);
                                }
                            }

                            @keyframes birthdayRevealTextIn {
                                from {
                                    opacity: 0;
                                    transform: translateY(12px);
                                    filter: blur(3px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                    filter: blur(0);
                                }
                            }

                            @keyframes birthdayRevealLine {
                                from { transform: scaleX(0); opacity: 0; }
                                to { transform: scaleX(1); opacity: 1; }
                            }

                            @keyframes birthdayWordReveal {
                                0% {
                                    opacity: 0;
                                    transform: translateY(115%) scale(1.08);
                                    filter: blur(13px);
                                }
                                55% {
                                    opacity: 1;
                                    filter: blur(0);
                                }
                                100% {
                                    opacity: 1;
                                    transform: translateY(0) scale(1);
                                    filter: blur(0);
                                }
                            }

                            @keyframes birthdayTitleSweep {
                                0% {
                                    left: -25%;
                                    opacity: 0;
                                }
                                20% { opacity: 0.8; }
                                100% {
                                    left: 115%;
                                    opacity: 0;
                                }
                            }

                            @keyframes birthdayRevealName {
                                from {
                                    opacity: 0;
                                    transform: translateY(22px);
                                    filter: blur(8px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                    filter: blur(0);
                                }
                            }

                            @keyframes birthdayRevealWish {
                                from {
                                    opacity: 0;
                                    transform: translateY(16px);
                                    filter: blur(5px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                    filter: blur(0);
                                }
                            }

                            @keyframes birthdayRevealRing {
                                0% {
                                    opacity: 0;
                                    transform: translate(-50%, -50%) scale(0.2);
                                }
                                35% { opacity: 0.8; }
                                100% {
                                    opacity: 0;
                                    transform: translate(-50%, -50%) scale(7);
                                }
                            }

                            @keyframes birthdayRevealHeart {
                                0% {
                                    opacity: 0;
                                    transform: translate(-50%, -50%) scale(0.1);
                                }
                                25% {
                                    opacity: 1;
                                    transform: translate(-50%, -50%) scale(1.2);
                                }
                                55% {
                                    opacity: 0.95;
                                    transform: translate(-50%, -50%) scale(0.95);
                                }
                                100% {
                                    opacity: 0;
                                    transform: translate(-50%, -50%) scale(2.5);
                                }
                            }

                            @keyframes birthdayParticleBurst {
                                0% {
                                    opacity: 0;
                                    transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
                                }
                                12% { opacity: 1; }
                                100% {
                                    opacity: 0;
                                    transform:
                                        translate(
                                            calc(-50% + var(--px)),
                                            calc(-50% + var(--py))
                                        )
                                        scale(1)
                                        rotate(220deg);
                                }
                            }

                            #birthdayReveal .birthday-love-letter.birthday-letter-opening {
                                animation: birthdayLetterOpen 1.05s cubic-bezier(0.16,0.78,0.22,1) forwards;
                            }

                            @keyframes birthdayLetterOpen {
                                0% {
                                    opacity: 1;
                                    transform: scale(1) rotateX(0deg);
                                    filter: blur(0);
                                }
                                45% {
                                    transform: scale(0.98) rotateX(8deg);
                                    filter: blur(0.3px);
                                }
                                100% {
                                    opacity: 0;
                                    transform: scale(0.88) translateY(-12px) rotateX(14deg);
                                    filter: blur(7px);
                                }
                            }

                            /* =========================================
                               💎 V10 — CINEMATIC FINAL MESSAGE SYSTEM
                               ========================================= */
                            #birthdayReveal .birthday-reveal-stage {
                                overflow: hidden;
                                padding: 24px;
                                box-sizing: border-box;
                            }

                            #birthdayReveal .birthday-reveal-content {
                                width: min(1120px, 94vw);
                                max-height: calc(100vh - 48px);
                                padding: clamp(24px, 4vh, 46px) clamp(18px, 4vw, 52px) 28px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                box-sizing: border-box;
                            }

                            #birthdayReveal .birthday-reveal-title {
                                font-size: clamp(48px, 8vw, 108px);
                                line-height: .92;
                                letter-spacing: .09em;
                            }

                            #birthdayReveal .birthday-reveal-name {
                                font-size: clamp(38px, 5vw, 70px);
                                margin-top: clamp(14px, 2vh, 24px);
                            }

                            #birthdayReveal .birthday-reveal-wish.birthday-reveal-story {
                                width: min(820px, 88vw);
                                max-height: min(31vh, 285px);
                                margin-top: clamp(16px, 2.5vh, 26px);
                                padding: 0 12px;
                                overflow-y: auto;
                                overflow-x: hidden;
                                text-align: center;
                                scrollbar-width: thin;
                                scrollbar-color: rgba(255,190,215,.28) transparent;
                                -webkit-overflow-scrolling: touch;
                            }

                            #birthdayReveal .birthday-reveal-wish.birthday-reveal-story::-webkit-scrollbar { width: 3px; }
                            #birthdayReveal .birthday-reveal-wish.birthday-reveal-story::-webkit-scrollbar-thumb {
                                background: rgba(255,190,215,.28);
                                border-radius: 999px;
                            }

                            #birthdayReveal .reveal-story-line {
                                margin: 0 auto 12px;
                                color: rgba(255,242,247,.78);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(13px, 1.18vw, 17px);
                                line-height: 1.55;
                                font-style: italic;
                                opacity: 0;
                                transform: translateY(12px);
                                filter: blur(4px);
                            }

                            #birthdayReveal .reveal-story-line strong {
                                color: #ffe4ee;
                                font-weight: 500;
                                text-shadow: 0 0 18px rgba(255,120,170,.18);
                            }

                            #birthdayReveal .birthday-reveal-stage.open .line-1 { animation: birthdayRevealTextIn 1.05s 3.0s ease both; }
                            #birthdayReveal .birthday-reveal-stage.open .line-2 { animation: birthdayRevealTextIn 1.05s 3.65s ease both; }
                            #birthdayReveal .birthday-reveal-stage.open .line-3 { animation: birthdayRevealTextIn 1.05s 4.3s ease both; }
                            #birthdayReveal .birthday-reveal-stage.open .line-4 { animation: birthdayRevealTextIn 1.05s 4.95s ease both; }
                            #birthdayReveal .birthday-reveal-stage.open .line-5 { animation: birthdayRevealTextIn 1.05s 5.6s ease both; }
                            #birthdayReveal .birthday-reveal-stage.open .line-6 { animation: birthdayRevealTextIn 1.05s 6.25s ease both; }

                            #birthdayReveal .birthday-reveal-footer {
                                width: min(850px, 90vw);
                                margin-top: 14px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 7px;
                                text-align: center;
                            }

                            #birthdayReveal .birthday-reveal-footer span {
                                opacity: 0;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .reveal-footer-main {
                                animation: birthdayRevealTextIn 1s 7.0s ease both;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .reveal-footer-sub {
                                animation: birthdayRevealTextIn 1s 7.45s ease both;
                            }

                            #birthdayReveal .birthday-reveal-stage.open .reveal-footer-final {
                                animation: birthdayFinalLineReveal 1.4s 8.0s cubic-bezier(.16,1,.3,1) both;
                            }

                            #birthdayReveal .reveal-footer-main {
                                color: #ffe3ed;
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(18px, 2vw, 28px);
                                font-style: italic;
                            }

                            #birthdayReveal .reveal-footer-sub {
                                max-width: 680px;
                                color: rgba(255,215,228,.58);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(10px, .9vw, 13px);
                                line-height: 1.45;
                            }

                            #birthdayReveal .reveal-footer-final {
                                color: rgba(255,195,218,.82);
                                font-family: Georgia, "Times New Roman", serif;
                                font-size: clamp(9px, .8vw, 12px);
                                letter-spacing: clamp(2px, .45vw, 5px);
                                text-transform: uppercase;
                                text-shadow: 0 0 20px rgba(255,100,160,.28);
                            }

                            @keyframes birthdayFinalLineReveal {
                                from { opacity: 0; transform: translateY(14px) scale(.92); filter: blur(8px); }
                                to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                            }

                            @media (max-width: 650px) {
                                #birthdayReveal .birthday-reveal-stage {
                                    padding: 10px;
                                }

                                #birthdayReveal .birthday-reveal-frame {
                                    inset: 14px;
                                }

                                #birthdayReveal .birthday-reveal-content {
                                    width: 94vw;
                                    max-height: calc(100vh - 60px);
                                    padding: 24px 12px;
                                }

                                #birthdayReveal .birthday-reveal-kicker {
                                    font-size: 8px;
                                    letter-spacing: 4px;
                                }

                                #birthdayReveal .birthday-reveal-line {
                                    width: 90px;
                                    margin: 13px auto 22px;
                                }

                                #birthdayReveal .birthday-reveal-title {
                                    font-size: clamp(31px, 10.8vw, 54px);
                                    letter-spacing: 0.045em;
                                    line-height: 0.98;
                                    white-space: normal;
                                }

                                #birthdayReveal .birthday-reveal-name {
                                    margin-top: 20px;
                                    font-size: clamp(32px, 11vw, 52px);
                                    letter-spacing: 0.06em;
                                }

                                #birthdayReveal .birthday-reveal-wish {
                                    width: 88vw;
                                    font-size: 13px;
                                    line-height: 1.65;
                                    margin-top: 20px;
                                }

                                #birthdayReveal .birthday-reveal-footer {
                                    font-size: 8px;
                                    letter-spacing: 3px;
                                    margin-top: 20px;
                                }

                                #birthdayReveal .birthday-reveal-ring {
                                    width: 88vw;
                                }

                                #birthdayReveal .birthday-reveal-ring.ring-2 {
                                    width: 64vw;
                                }

                                #birthdayReveal .birthday-love-letter {
                                    width: 92vw;
                                    height: 88vh;
                                    max-height: 88vh;
                                    padding: 38px 24px 26px;
                                    overflow: hidden;
                                }

                                #birthdayReveal .birthday-love-passage {
                                    font-size: 13px;
                                    line-height: 1.45;
                                }

                                #birthdayReveal .birthday-love-passage p {
                                    margin-bottom: 7px;
                                }

                                #birthdayReveal .birthday-love-title {
                                    font-size: 27px;
                                    margin-bottom: 16px;
                                }

                                #birthdayReveal .birthday-love-signature {
                                    margin-top: 12px;
                                }
                            }

                                #birthdayReveal .birthday-mail-button {
                                    width: min(245px, 82vw);
                                    height: 58px;
                                }

                                #birthdayReveal .birthday-reveal-title {
                                    font-size: clamp(34px, 11vw, 56px);
                                    letter-spacing: 4px;
                                }

                                #birthdayReveal .birthday-reveal-name {
                                    font-size: clamp(32px, 10vw, 50px);
                                }

                                #birthdayReveal .birthday-reveal-wish {
                                    font-size: 13px;
                                    line-height: 1.65;
                                }

                                #birthdayReveal .birthday-love-letter {
                                    width: 92vw;
                                    height: 88vh;
                                    max-height: 88vh;
                                    padding: 38px 24px 26px;
                                    overflow: hidden;
                                }

                                #birthdayReveal .birthday-love-passage {
                                    font-size: 13px;
                                    line-height: 1.45;
                                }

                                #birthdayReveal .birthday-love-passage p {
                                    margin-bottom: 7px;
                                }

                                #birthdayReveal .birthday-love-title {
                                    font-size: 27px;
                                    margin-bottom: 16px;
                                }

                                #birthdayReveal .birthday-love-signature {
                                    margin-top: 12px;
                                }
                            }

                            /* =========================================
                               📱 MOBILE LOVE LETTER — FULL, READABLE, NATURAL
                               ========================================= */
                            #birthdayReveal .birthday-love-letter {
                                display: flex;
                                flex-direction: column;
                            }

                            #birthdayReveal .birthday-love-passage {
                                flex: 1 1 auto;
                                min-height: 0;
                                overflow-y: auto;
                                overflow-x: hidden;
                                padding: 0 8px 4px 2px;
                                scrollbar-width: thin;
                                scrollbar-color: rgba(255,190,215,0.35) transparent;
                                -webkit-overflow-scrolling: touch;
                            }

                            #birthdayReveal .birthday-love-passage::-webkit-scrollbar {
                                width: 4px;
                            }

                            #birthdayReveal .birthday-love-passage::-webkit-scrollbar-track {
                                background: transparent;
                            }

                            #birthdayReveal .birthday-love-passage::-webkit-scrollbar-thumb {
                                background: rgba(255,190,215,0.32);
                                border-radius: 999px;
                            }

                            #birthdayReveal .birthday-open-wrap {
                                flex: 0 0 auto;
                                padding-top: 10px;
                                padding-bottom: 2px;
                            }

                            @media (max-width: 650px) {
                                #birthdayReveal .birthday-final-premium {
                                    padding: 14px 10px;
                                    align-items: center;
                                }

                                #birthdayReveal .birthday-love-letter {
                                    width: min(94vw, 520px);
                                    height: min(91vh, 820px);
                                    max-height: 91vh;
                                    padding: 28px 17px 16px;
                                    border-radius: 12px;
                                    background:
                                        linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,205,225,0.018)),
                                        rgba(12, 7, 15, 0.92);
                                    box-shadow:
                                        0 24px 70px rgba(0,0,0,0.72),
                                        inset 0 0 55px rgba(255,120,160,0.028);
                                }

                                #birthdayReveal .birthday-final-corner {
                                    width: 28px;
                                    height: 28px;
                                }

                                #birthdayReveal .birthday-final-corner.tl { top: 17px; left: 17px; }
                                #birthdayReveal .birthday-final-corner.tr { top: 17px; right: 17px; }
                                #birthdayReveal .birthday-final-corner.bl { bottom: 17px; left: 17px; }
                                #birthdayReveal .birthday-final-corner.br { bottom: 17px; right: 17px; }

                                #birthdayReveal .birthday-love-kicker {
                                    margin-bottom: 9px;
                                    font-size: 9px;
                                    letter-spacing: 3.5px;
                                }

                                #birthdayReveal .birthday-love-title {
                                    font-size: clamp(24px, 7.5vw, 31px);
                                    line-height: 1.12;
                                    margin-bottom: 12px;
                                }

                                #birthdayReveal .birthday-love-divider {
                                    width: 90px;
                                    margin-bottom: 14px;
                                }

                                #birthdayReveal .birthday-love-passage {
                                    font-size: 14px;
                                    line-height: 1.62;
                                    text-align: left;
                                    padding: 0 8px 6px 3px;
                                }

                                #birthdayReveal .birthday-love-passage p {
                                    margin: 0 0 13px;
                                }

                                #birthdayReveal .birthday-love-signature {
                                    text-align: center;
                                    font-size: 13px;
                                    line-height: 1.55;
                                    margin-top: 4px;
                                    padding-bottom: 4px;
                                }

                                #birthdayReveal .birthday-open-wrap {
                                    margin-top: 7px;
                                    gap: 6px;
                                }

                                #birthdayReveal .birthday-open-hint {
                                    font-size: 8px;
                                    letter-spacing: 1.8px;
                                }

                                #birthdayReveal .birthday-mail-button {
                                    width: min(245px, 82vw);
                                    height: 54px;
                                    padding: 0 15px;
                                }

                                #birthdayReveal .birthday-mail-label strong {
                                    font-size: 13px;
                                }

                                #birthdayReveal .birthday-mail-label span {
                                    font-size: 9px;
                                }
                            }

                            /* V10 final mobile/desktop fit overrides */
                            @media (min-width: 651px) {
                                #birthdayReveal .birthday-reveal-wish.birthday-reveal-story {
                                    max-height: 30vh;
                                }
                            }

                            @media (max-width: 650px) {
                                #birthdayReveal .birthday-reveal-content {
                                    width: 96vw;
                                    max-height: calc(100dvh - 24px);
                                    padding: 18px 10px 16px;
                                }

                                #birthdayReveal .birthday-reveal-kicker {
                                    font-size: 7px;
                                    letter-spacing: 3px;
                                }

                                #birthdayReveal .birthday-reveal-line {
                                    margin: 9px auto 16px;
                                    width: 70px;
                                }

                                #birthdayReveal .birthday-reveal-title {
                                    font-size: clamp(34px, 11.5vw, 58px);
                                    letter-spacing: .035em;
                                    line-height: .94;
                                }

                                #birthdayReveal .birthday-reveal-name {
                                    font-size: clamp(34px, 11vw, 52px);
                                    margin-top: 14px;
                                }

                                #birthdayReveal .birthday-reveal-wish.birthday-reveal-story {
                                    width: 90vw;
                                    max-height: 27vh;
                                    margin-top: 14px;
                                    padding: 0 7px;
                                }

                                #birthdayReveal .reveal-story-line {
                                    font-size: 12px;
                                    line-height: 1.48;
                                    margin-bottom: 9px;
                                }

                                #birthdayReveal .birthday-reveal-footer {
                                    width: 90vw;
                                    margin-top: 9px;
                                    gap: 4px;
                                }

                                #birthdayReveal .reveal-footer-main {
                                    font-size: 17px;
                                }

                                #birthdayReveal .reveal-footer-sub {
                                    font-size: 8px;
                                    line-height: 1.35;
                                    max-width: 340px;
                                }

                                #birthdayReveal .reveal-footer-final {
                                    font-size: 7px;
                                    letter-spacing: 2px;
                                }
                            }



                            /* =====================================================
                               🌌 V11 ULTRA PREMIUM BIRTHDAY NIGHT SCENE
                               ===================================================== */
                            #birthdayReveal .birthday-premium-sky {
                                position:absolute; inset:0; overflow:hidden; z-index:0;
                                background:
                                    radial-gradient(circle at 74% 20%, rgba(255,194,140,.20), transparent 16%),
                                    radial-gradient(circle at 28% 34%, rgba(160,78,255,.20), transparent 24%),
                                    radial-gradient(circle at 50% 70%, rgba(255,75,155,.11), transparent 34%),
                                    linear-gradient(180deg,#020613 0%,#07061c 42%,#170b2a 72%,#070812 100%);
                            }
                            #birthdayReveal .birthday-premium-sky::before {
                                content:""; position:absolute; inset:0;
                                background-image:
                                  radial-gradient(circle,rgba(255,255,255,.95) 0 1px,transparent 1.5px),
                                  radial-gradient(circle,rgba(255,214,240,.72) 0 1px,transparent 1.4px);
                                background-size: 137px 113px, 211px 167px;
                                background-position: 11px 7px, 47px 29px;
                                opacity:.78;
                                animation:birthdayStarDrift 22s linear infinite;
                            }
                            #birthdayReveal .birthday-premium-sky::after {
                                content:""; position:absolute; inset:-10%;
                                background:radial-gradient(ellipse at center,transparent 42%,rgba(0,0,0,.78) 100%);
                                pointer-events:none;
                            }
                            @keyframes birthdayStarDrift { from{transform:translate3d(0,0,0)} to{transform:translate3d(-40px,25px,0)} }

                            #birthdayReveal .birthday-premium-moon {
                                position:absolute; z-index:2; right:8.5%; top:7%;
                                width:clamp(150px,18vw,290px); aspect-ratio:1;
                                border-radius:50%;
                                background:
                                  radial-gradient(circle at 32% 30%,rgba(255,255,255,.92) 0 3%,transparent 4%),
                                  radial-gradient(circle at 67% 66%,rgba(124,91,71,.18) 0 5%,transparent 6%),
                                  radial-gradient(circle at 40% 68%,rgba(123,88,65,.22) 0 7%,transparent 8%),
                                  radial-gradient(circle at 55% 43%,#fff5dc 0%,#ffdcae 48%,#d89f78 100%);
                                box-shadow:0 0 28px rgba(255,221,171,.7),0 0 90px rgba(255,171,110,.30),0 0 170px rgba(255,135,220,.13);
                                animation:birthdayMoonFloat 7s ease-in-out infinite;
                            }
                            #birthdayReveal .birthday-premium-moon::after {
                                content:""; position:absolute; inset:-12%; border-radius:50%;
                                background:radial-gradient(circle,rgba(255,220,170,.20),transparent 62%);
                                filter:blur(14px); z-index:-1;
                            }
                            @keyframes birthdayMoonFloat { 0%,100%{transform:translateY(0)}50%{transform:translateY(7px)} }

                            #birthdayReveal .birthday-premium-clouds {
                                position:absolute; z-index:3; left:0; right:0; top:27%; height:28%;
                                background:
                                  radial-gradient(ellipse at 18% 50%,rgba(62,38,92,.72) 0 8%,transparent 20%),
                                  radial-gradient(ellipse at 34% 65%,rgba(46,34,82,.72) 0 9%,transparent 22%),
                                  radial-gradient(ellipse at 72% 56%,rgba(53,35,90,.78) 0 10%,transparent 23%),
                                  radial-gradient(ellipse at 88% 70%,rgba(38,30,69,.80) 0 10%,transparent 22%);
                                filter:blur(3px); opacity:.9;
                            }

                            #birthdayReveal .birthday-premium-lake {
                                position:absolute; z-index:2; left:0; right:0; bottom:0; height:38%;
                                background:
                                  linear-gradient(180deg,rgba(15,18,43,.05),rgba(3,6,18,.82)),
                                  repeating-linear-gradient(180deg,rgba(255,164,210,.09) 0 1px,transparent 1px 9px);
                                transform:perspective(500px) rotateX(3deg);
                                opacity:.92;
                            }
                            #birthdayReveal .birthday-premium-lake::after {
                                content:""; position:absolute; left:36%; top:8%; width:28%; height:78%;
                                background:linear-gradient(180deg,rgba(255,224,186,.30),rgba(255,137,202,.10),transparent);
                                filter:blur(7px); opacity:.65;
                                animation:birthdayLakeGlow 3.5s ease-in-out infinite;
                            }
                            @keyframes birthdayLakeGlow {0%,100%{opacity:.45}50%{opacity:.85}}

                            #birthdayReveal .birthday-premium-horizon {
                                position:absolute; z-index:4; left:0; right:0; bottom:28%; height:13%;
                                background:
                                  linear-gradient(170deg,transparent 0 20%,rgba(8,8,23,.95) 21% 38%,transparent 39%),
                                  linear-gradient(190deg,transparent 0 35%,rgba(6,7,19,.98) 36% 57%,transparent 58%);
                                filter:blur(1px); opacity:.9;
                            }

                            #birthdayReveal .birthday-premium-canvas {
                                position:absolute; inset:0; z-index:6; width:100%; height:100%; pointer-events:none;
                            }

                            #birthdayReveal .birthday-premium-balloon {
                                position:absolute; z-index:15; width:clamp(34px,4.5vw,74px); aspect-ratio:.78;
                                border-radius:50% 50% 45% 45%;
                                background:radial-gradient(circle at 30% 24%,rgba(255,255,255,.75),transparent 13%),linear-gradient(135deg,#ff9fc7,#c62f78 70%,#70133e);
                                box-shadow:0 10px 28px rgba(255,45,150,.25),inset -10px -14px 18px rgba(60,0,30,.22);
                                animation:birthdayBalloonFloat 5.5s ease-in-out infinite;
                            }
                            #birthdayReveal .birthday-premium-balloon::after {
                                content:""; position:absolute; left:50%; top:99%; width:1px; height:150px;
                                background:linear-gradient(rgba(255,205,225,.7),rgba(255,205,225,.05));
                            }
                            #birthdayReveal .birthday-premium-balloon::before {
                                content:""; position:absolute; left:47%; bottom:-6px; width:7px; height:9px;
                                background:#8b2453; clip-path:polygon(0 0,100% 0,50% 100%);
                            }
                            .birthday-balloon-a{left:4%;top:38%;animation-delay:-1s}.birthday-balloon-b{left:8%;top:55%;transform:scale(.8);animation-delay:-3s}.birthday-balloon-c{right:4%;top:34%;animation-delay:-2s}.birthday-balloon-d{right:9%;top:53%;transform:scale(.78);animation-delay:-4s}.birthday-balloon-heart{left:1.5%;top:48%;border-radius:0;background:#b83278;clip-path:path("M36 66 L8 38 C-8 20 8 -2 27 9 C36 14 36 14 36 14 C36 14 36 14 45 9 C64 -2 80 20 64 38 Z");}
                            @keyframes birthdayBalloonFloat {0%,100%{margin-top:0;transform:translateY(0) rotate(-2deg)}50%{margin-top:-13px;transform:translateY(-8px) rotate(3deg)}}

                            #birthdayReveal .birthday-premium-lantern {
                                position:absolute; z-index:14; top:0; width:28px; height:46px; border-radius:45% 45% 35% 35%;
                                background:linear-gradient(90deg,#7a3b1f,#ffd98d 45%,#8e4322); box-shadow:0 0 22px rgba(255,185,80,.65);
                                animation:birthdayLantern 3.8s ease-in-out infinite;
                            }
                            #birthdayReveal .birthday-premium-lantern::before{content:"";position:absolute;left:50%;top:-25px;width:1px;height:25px;background:rgba(255,220,160,.5)}
                            #birthdayReveal .birthday-premium-lantern::after{content:"";position:absolute;inset:8px 5px;border:1px solid rgba(255,241,190,.6);border-radius:40%;box-shadow:inset 0 0 14px rgba(255,207,102,.7)}
                            .birthday-lantern-a{left:14%}.birthday-lantern-b{left:25%;top:5%;transform:scale(.75);animation-delay:-1.5s}.birthday-lantern-c{right:15%;animation-delay:-.7s}.birthday-lantern-d{right:26%;top:7%;transform:scale(.72);animation-delay:-2.3s}
                            @keyframes birthdayLantern{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(9px) rotate(2deg)}}

                            #birthdayReveal .birthday-premium-petal {
                                position:absolute; z-index:16; width:9px; height:16px; border-radius:90% 10% 90% 10%;
                                background:linear-gradient(135deg,#ffb2cb,#c52d68); opacity:.85;
                                animation:birthdayPetalFall 8s linear infinite;
                            }
                            @keyframes birthdayPetalFall {0%{transform:translate3d(0,-15vh,0) rotate(0);opacity:0}12%{opacity:.85}50%{transform:translate3d(45px,50vh,0) rotate(160deg)}100%{transform:translate3d(-65px,112vh,0) rotate(330deg);opacity:0}}

                            #birthdayReveal .birthday-premium-shooting-star{position:absolute;z-index:5;width:130px;height:2px;background:linear-gradient(90deg,transparent,#fff,#ff9ed0,transparent);filter:drop-shadow(0 0 7px #ffb6dc);transform:rotate(-25deg);opacity:0;animation:birthdayShootingStar 5.5s linear infinite}
                            .birthday-shoot-a{left:18%;top:18%}.birthday-shoot-b{left:55%;top:10%;animation-delay:2.2s}.birthday-shoot-c{right:7%;top:25%;animation-delay:3.8s}
                            @keyframes birthdayShootingStar{0%,55%{opacity:0;transform:translate3d(0,0,0) rotate(-25deg)}60%{opacity:1}75%{opacity:0;transform:translate3d(230px,130px,0) rotate(-25deg)}100%{opacity:0}}

                            #birthdayReveal .birthday-premium-flower-glow{position:absolute;z-index:13;bottom:0;width:22vw;height:22vh;background:radial-gradient(circle at 50% 100%,rgba(255,88,145,.20),transparent 62%);filter:blur(12px);pointer-events:none}
                            .birthday-flower-left{left:0}.birthday-flower-right{right:0}

                            #birthdayReveal .birthday-reveal-content { z-index:30; }
                            #birthdayReveal .birthday-reveal-kicker { text-shadow:0 0 14px rgba(255,206,230,.65); }
                            #birthdayReveal .birthday-reveal-title { text-shadow:0 0 8px rgba(255,220,190,.8),0 0 30px rgba(255,108,180,.28),0 0 70px rgba(255,170,220,.18); }
                            #birthdayReveal .birthday-reveal-name { text-shadow:0 0 10px #ff91c2,0 0 34px rgba(255,71,159,.55),0 0 75px rgba(255,160,215,.3); }
                            #birthdayReveal .birthday-reveal-footer { text-shadow:0 0 18px rgba(255,190,220,.25); }

                            @media(max-width:700px){
                                #birthdayReveal .birthday-premium-moon{right:5%;top:10%;width:125px;opacity:.88}
                                #birthdayReveal .birthday-premium-clouds{top:25%;height:25%}
                                #birthdayReveal .birthday-premium-lake{height:31%}
                                #birthdayReveal .birthday-premium-horizon{bottom:25%}
                                #birthdayReveal .birthday-premium-lantern{transform:scale(.7)}
                                #birthdayReveal .birthday-premium-balloon{width:34px}
                                #birthdayReveal .birthday-premium-balloon::after{height:90px}
                            }

                            /* =====================================================
                               🌕 V13 PHOTOREAL PREMIUM MOON + 🎈 BALLOON SYSTEM
                               Layered CSS lighting, crater texture, glass highlights,
                               3D sway and pointer parallax. No external assets.
                               ===================================================== */
                            #birthdayReveal .birthday-premium-moon {
                                --moon-px: 0px;
                                --moon-py: 0px;
                                width: clamp(185px, 20vw, 330px);
                                background:
                                    radial-gradient(circle at 29% 27%, rgba(255,255,255,.82) 0 1.7%, transparent 2.5%),
                                    radial-gradient(circle at 64% 24%, rgba(128,92,73,.19) 0 4.5%, transparent 5.8%),
                                    radial-gradient(circle at 72% 51%, rgba(112,78,64,.22) 0 6%, transparent 7.4%),
                                    radial-gradient(circle at 40% 63%, rgba(118,83,67,.25) 0 7%, transparent 8.3%),
                                    radial-gradient(circle at 58% 76%, rgba(135,96,73,.16) 0 4%, transparent 5.2%),
                                    radial-gradient(circle at 23% 52%, rgba(129,91,72,.14) 0 3.5%, transparent 4.7%),
                                    radial-gradient(circle at 50% 45%, #fff8e6 0%, #f7dfb2 45%, #e2b486 72%, #a86f63 100%);
                                box-shadow:
                                    0 0 22px rgba(255,240,205,.9),
                                    0 0 70px rgba(255,210,155,.55),
                                    0 0 150px rgba(255,145,210,.23),
                                    inset -24px -18px 42px rgba(103,61,67,.23),
                                    inset 16px 10px 30px rgba(255,255,255,.20);
                                filter: saturate(.92) contrast(1.06);
                                transform: translate3d(var(--moon-px),var(--moon-py),0);
                                animation: birthdayMoonFloatPremium 8s ease-in-out infinite;
                                will-change: transform, filter;
                            }

                            #birthdayReveal .birthday-premium-moon::before {
                                content:"";
                                position:absolute;
                                inset:0;
                                border-radius:50%;
                                background:
                                    radial-gradient(circle at 38% 33%, rgba(255,255,255,.18), transparent 28%),
                                    radial-gradient(circle at 68% 68%, rgba(89,58,61,.14), transparent 31%),
                                    linear-gradient(105deg, transparent 38%, rgba(106,68,75,.18) 62%, rgba(67,42,51,.25) 100%);
                                mix-blend-mode:multiply;
                                opacity:.72;
                            }

                            #birthdayReveal .birthday-premium-moon::after {
                                content:"";
                                position:absolute;
                                inset:-22%;
                                border-radius:50%;
                                background:
                                    radial-gradient(circle, rgba(255,232,190,.34) 0 22%, rgba(255,188,130,.16) 38%, transparent 69%);
                                filter:blur(18px);
                                z-index:-1;
                                opacity:.9;
                                animation:birthdayMoonAura 4.8s ease-in-out infinite;
                            }

                            #birthdayReveal .birthday-premium-moon .moon-rim {
                                position:absolute;
                                inset:1.5%;
                                border-radius:50%;
                                border:1px solid rgba(255,250,225,.42);
                                box-shadow: inset 8px 5px 16px rgba(255,255,255,.16), inset -15px -10px 22px rgba(89,52,57,.18);
                                pointer-events:none;
                            }

                            @keyframes birthdayMoonFloatPremium {
                                0%,100% { transform:translate3d(var(--moon-px),var(--moon-py),0) scale(1); }
                                50% { transform:translate3d(var(--moon-px),calc(var(--moon-py) + 8px),0) scale(1.012); }
                            }
                            @keyframes birthdayMoonAura {
                                0%,100% { opacity:.68; transform:scale(.98); }
                                50% { opacity:1; transform:scale(1.035); }
                            }

                            #birthdayReveal .birthday-premium-balloon {
                                --balloon-px:0px;
                                --balloon-py:0px;
                                --balloon-scale:1;
                                transform:translate3d(var(--balloon-px),var(--balloon-py),0) scale(var(--balloon-scale)) rotate(-2deg);
                                background:
                                    radial-gradient(circle at 27% 19%, rgba(255,255,255,.95) 0 3.2%, rgba(255,255,255,.40) 3.8%, transparent 8%),
                                    radial-gradient(circle at 62% 67%, rgba(89,0,49,.24) 0 19%, transparent 48%),
                                    linear-gradient(145deg, #ffb7d4 0%, #f65a9e 35%, #bf286f 72%, #651238 100%);
                                box-shadow:
                                    0 15px 38px rgba(255,38,143,.24),
                                    inset -16px -18px 25px rgba(62,0,33,.24),
                                    inset 8px 7px 13px rgba(255,255,255,.18);
                                filter:drop-shadow(0 10px 18px rgba(0,0,0,.28));
                                will-change:transform;
                            }

                            #birthdayReveal .birthday-premium-balloon::after {
                                height:170px;
                                left:50%;
                                background:
                                    linear-gradient(90deg, transparent 0 45%, rgba(255,235,245,.74) 48%, rgba(255,235,245,.16) 55%, transparent 58%);
                                box-shadow:0 0 8px rgba(255,200,225,.22);
                            }

                            #birthdayReveal .birthday-premium-balloon::before {
                                width:8px;
                                height:10px;
                                background:linear-gradient(135deg,#b82c6c,#5f1239);
                                box-shadow:0 2px 5px rgba(0,0,0,.28);
                            }

                            #birthdayReveal .birthday-premium-balloon .balloon-specular {
                                position:absolute;
                                left:18%;
                                top:14%;
                                width:18%;
                                height:42%;
                                border-radius:50%;
                                background:linear-gradient(180deg,rgba(255,255,255,.82),rgba(255,255,255,.04));
                                filter:blur(.4px);
                                opacity:.82;
                                transform:rotate(14deg);
                                pointer-events:none;
                            }

                            #birthdayReveal .birthday-premium-balloon .balloon-ribbon {
                                position:absolute;
                                left:50%;
                                bottom:-175px;
                                width:22px;
                                height:180px;
                                border-left:1px solid rgba(255,214,232,.48);
                                border-radius:50%;
                                transform:translateX(-50%) rotate(6deg);
                                pointer-events:none;
                            }

                            #birthdayReveal .birthday-balloon-b { --balloon-scale:.78; }
                            #birthdayReveal .birthday-balloon-d { --balloon-scale:.74; }
                            #birthdayReveal .birthday-balloon-e { left:16%; top:30%; --balloon-scale:.55; background:radial-gradient(circle at 28% 20%,rgba(255,255,255,.9) 0 4%,transparent 9%),linear-gradient(145deg,#ffe8f2,#d99bb9 48%,#7d4566 100%); }
                            #birthdayReveal .birthday-balloon-f { right:16%; top:45%; --balloon-scale:.58; background:radial-gradient(circle at 28% 20%,rgba(255,255,255,.9) 0 4%,transparent 9%),linear-gradient(145deg,#ffd7ec,#b66fe0 48%,#552b7c 100%); }
                            #birthdayReveal .birthday-balloon-g { right:1%; top:59%; --balloon-scale:.44; background:radial-gradient(circle at 28% 20%,rgba(255,255,255,.9) 0 4%,transparent 9%),linear-gradient(145deg,#f7c6ff,#8d5ed0 50%,#382055 100%); }
                            #birthdayReveal .birthday-balloon-heart { --balloon-scale:.82; filter:drop-shadow(0 12px 20px rgba(255,50,140,.35)); }

                            #birthdayReveal .birthday-balloon-a { animation-duration:6.2s; }
                            #birthdayReveal .birthday-balloon-b { animation-duration:7.1s; }
                            #birthdayReveal .birthday-balloon-c { animation-duration:6.7s; }
                            #birthdayReveal .birthday-balloon-d { animation-duration:7.6s; }
                            #birthdayReveal .birthday-balloon-e { animation-duration:8.1s; }
                            #birthdayReveal .birthday-balloon-f { animation-duration:7.8s; }
                            #birthdayReveal .birthday-balloon-g { animation-duration:8.6s; }

                            @keyframes birthdayBalloonFloatPremium {
                                0%,100% { transform:translate3d(var(--balloon-px),var(--balloon-py),0) scale(var(--balloon-scale)) rotate(-2deg); }
                                35% { transform:translate3d(var(--balloon-px),calc(var(--balloon-py) - 9px),0) scale(var(--balloon-scale)) rotate(2.5deg); }
                                68% { transform:translate3d(var(--balloon-px),calc(var(--balloon-py) - 15px),0) scale(var(--balloon-scale)) rotate(-1deg); }
                            }
                            #birthdayReveal .birthday-premium-balloon { animation-name:birthdayBalloonFloatPremium; }

                            #birthdayReveal .birthday-premium-sky {
                                background:
                                    radial-gradient(circle at 75% 18%,rgba(255,202,150,.18),transparent 18%),
                                    radial-gradient(circle at 22% 32%,rgba(154,79,255,.24),transparent 28%),
                                    radial-gradient(circle at 52% 68%,rgba(255,62,160,.12),transparent 38%),
                                    linear-gradient(180deg,#01030b 0%,#05091b 35%,#120b2b 68%,#070912 100%);
                            }

                            #birthdayReveal .birthday-premium-sky::before {
                                opacity:.92;
                                animation:birthdayStarDriftPremium 28s linear infinite;
                            }
                            @keyframes birthdayStarDriftPremium {
                                from{transform:translate3d(0,0,0) scale(1)}
                                50%{transform:translate3d(-24px,14px,0) scale(1.015)}
                                to{transform:translate3d(-52px,28px,0) scale(1.03)}
                            }

                            #birthdayReveal .birthday-premium-lake {
                                background:
                                    linear-gradient(180deg,rgba(13,16,43,.02),rgba(2,5,16,.90)),
                                    repeating-linear-gradient(180deg,rgba(255,173,218,.13) 0 1px,transparent 1px 8px);
                                mask-image:linear-gradient(180deg,transparent 0%,#000 15%,#000 100%);
                            }

                            @media(max-width:700px){
                                #birthdayReveal .birthday-premium-moon{right:4%;top:9%;width:145px}
                                #birthdayReveal .birthday-premium-balloon{width:36px}
                                #birthdayReveal .birthday-balloon-e{left:12%;top:31%}
                                #birthdayReveal .birthday-balloon-f{right:12%;top:43%}
                                #birthdayReveal .birthday-balloon-g{right:0;top:56%}
                            }


                        `;

                        finalStyle.id = "birthdayPremiumFinalStyle";
                        document.head.appendChild(finalStyle);

                        // =====================================================
                        // 🌌 V14 REALISTIC CINEMATIC ENVIRONMENT
                        // Procedural moon, atmospheric clouds, water,
                        // physically-inspired balloon shading and film grain.
                        // =====================================================
                        const realisticSceneStyle = document.createElement("style");
                        realisticSceneStyle.textContent = `
                            #birthdayReveal .birthday-premium-environment {
                                position: absolute;
                                inset: 0;
                                width: 100%;
                                height: 100%;
                                z-index: 5;
                                pointer-events: none;
                                display: block;
                                mix-blend-mode: normal;
                            }

                            /* The procedural canvas replaces the flatter CSS moon/balloons. */
                            #birthdayReveal .birthday-premium-moon,
                            #birthdayReveal .birthday-premium-balloon,
                            #birthdayReveal .birthday-premium-clouds,
                            #birthdayReveal .birthday-premium-lake,
                            #birthdayReveal .birthday-premium-horizon {
                                opacity: 0 !important;
                                pointer-events: none !important;
                            }

                            #birthdayReveal .birthday-premium-canvas {
                                z-index: 7 !important;
                            }

                            #birthdayReveal .birthday-reveal-content {
                                z-index: 24 !important;
                            }

                            #birthdayReveal .birthday-reveal-vignette {
                                z-index: 18 !important;
                            }

                            @media (max-width: 700px) {
                                #birthdayReveal .birthday-premium-environment {
                                    image-rendering: auto;
                                }
                            }
                        `;
                        realisticSceneStyle.id = "birthdayRealisticSceneStyle";
                        document.head.appendChild(realisticSceneStyle);

                        overlay.innerHTML = `

                            <div class="birthday-dark"></div>

                            <div class="birthday-content">

                                <!-- ================================= -->
                                <!-- SYSTEM WARNING -->
                                <!-- ================================= -->

                                <div
                                    class="birthday-warning"
                                    style="
                                        font-family: monospace;
                                        color: #ff3344;
                                        letter-spacing: 4px;
                                        text-shadow:
                                            0 0 10px #ff0000,
                                            0 0 25px #ff0000;
                                    "
                                >
                                    ⚠ SYSTEM ALERT ⚠
                                </div>


                                <div
                                    class="birthday-subtext"
                                    style="
                                        font-family: monospace;
                                        color: #ff6677;
                                        letter-spacing: 2px;
                                    "
                                >
                                    UNAUTHORIZED ACCESS DETECTED
                                </div>


                                <!-- ================================= -->
                                <!-- FAKE HACKING TERMINAL -->
                                <!-- ================================= -->

                                <div
                                    id="birthdayHackScreen"
                                    style="
                                        width: min(850px, 90vw);
                                        margin: 30px auto 0;
                                        padding: 25px;
                                        box-sizing: border-box;

                                        background:
                                            rgba(0, 0, 0, 0.88);

                                        border:
                                            1px solid rgba(255, 40, 70, 0.55);

                                        border-radius: 8px;

                                        box-shadow:
                                            0 0 25px rgba(255, 0, 40, 0.25),
                                            inset 0 0 30px rgba(255, 0, 40, 0.08);

                                        font-family: monospace;
                                        text-align: left;

                                        color: #ff4d61;

                                        opacity: 0;
                                        transform: translateY(15px);

                                        transition:
                                            opacity 0.5s ease,
                                            transform 0.5s ease;
                                    "
                                >

                                    <div
                                        style="
                                            color: #ff3344;
                                            font-size: 20px;
                                            font-weight: bold;
                                            margin-bottom: 18px;
                                        "
                                    >
                                        ⚠ CRITICAL SYSTEM WARNING
                                    </div>


                                    <div
                                        id="hackLine1"
                                        style="margin: 9px 0;"
                                    >
                                        &gt; INITIALIZING SECURITY PROTOCOL...
                                    </div>


                                    <div
                                        id="hackLine2"
                                        style="
                                            margin: 9px 0;
                                            opacity: 0;
                                        "
                                    >
                                        &gt; CONNECTING TO GAME SERVER...
                                    </div>


                                    <div
                                        id="hackLine3"
                                        style="
                                            margin: 9px 0;
                                            opacity: 0;
                                        "
                                    >
                                        &gt; ACCESS OVERRIDE DETECTED...
                                    </div>


                                    <div
                                        id="hackLine4"
                                        style="
                                            margin: 9px 0;
                                            opacity: 0;
                                        "
                                    >
                                        &gt; BYPASSING SECURITY...
                                    </div>


                                    <div
                                        id="hackLine5"
                                        style="
                                            margin: 9px 0;
                                            opacity: 0;
                                        "
                                    >
                                        &gt; ACCESS LEVEL:
                                        <span style="color:#ffcc00;">
                                            ██████████ 100%
                                        </span>
                                    </div>


                                    <div
                                        id="hackCritical"
                                        style="
                                            margin-top: 22px;
                                            padding-top: 18px;

                                            border-top:
                                                1px solid
                                                rgba(255, 50, 70, 0.35);

                                            color: #ff1f3d;

                                            font-size: 18px;
                                            font-weight: bold;

                                            opacity: 0;
                                        "
                                    >
                                        ⚠ CRITICAL SYSTEM FAILURE ⚠
                                    </div>


                                    <div
                                        id="hackDoNotClose"
                                        style="
                                            margin-top: 12px;

                                            color: #ffffff;

                                            font-size: 14px;

                                            opacity: 0;
                                        "
                                    >
                                        DO NOT CLOSE THIS WINDOW
                                    </div>

                                </div>


                                <!-- ================================= -->
                                <!-- HEART -->
                                <!-- ================================= -->

                                <div
                                    class="birthday-heart"
                                    style="
                                        opacity: 0;
                                    "
                                >
                                    ❤️
                                </div>


                                <!-- ================================= -->
                                <!-- FINAL BIRTHDAY MESSAGE -->
                                <!-- ================================= -->

                                <div class="birthday-final-premium">

                                    <div class="birthday-love-letter">

                                        <span class="birthday-final-corner tl"></span>
                                        <span class="birthday-final-corner tr"></span>
                                        <span class="birthday-final-corner bl"></span>
                                        <span class="birthday-final-corner br"></span>

                                        <div class="birthday-love-kicker">A LETTER TO YOU</div>

                                        <h1 class="birthday-love-title">Some memories never fade.</h1>

                                        <div class="birthday-love-divider"></div>

                                        <div class="birthday-love-passage">
                                            <p>Some people enter our lives quietly. There is no big announcement, no perfect moment, no way of knowing how important they will become. And then, slowly, through ordinary days and little conversations, they become someone we never want to lose.</p>

                                            <p><span class="love-emphasis">Somewhere along the way, you became that person for me, Subha.</span> The random talks, the silly jokes, the small arguments, the unexpected smiles, the comfortable silence, and all those tiny moments that nobody else would notice — somehow, they became some of the most beautiful parts of my life.</p>

                                            <p>I don't love only the big memories. I love the little ones too. The moments when we laugh for no reason. The times when a simple message can change the mood of an entire day. The quiet moments when nothing special is happening, but somehow being there together still feels special.</p>

                                            <p>There are memories that photographs can keep, and there are memories that only the heart can keep. I think the most precious ones are the second kind — the ones we remember because of how they made us feel.</p>

                                            <p>Maybe time will change many things around us. We will grow, our lives will move forward, and new chapters will come. But I hope we never become strangers to the little happiness we found in each other's presence.</p>

                                            <p><span class="love-emphasis">If I could keep one thing from all these memories, it would not be a photograph. It would be the feeling of having you in my life.</span> ❤️</p>

                                            <p>And if life gives us many more years, I hope we fill them with more late-night conversations, more random laughs, more places to discover, more photographs, more birthdays, and more moments that make us stop and think, “I'm glad we were here together.”</p>

                                            <p>Today is your birthday, but honestly, I feel lucky too — lucky that somewhere in this huge world, our paths crossed and gave me so many memories worth holding close.</p>

                                            <p>So I don't want to wish you only a happy birthday. I want to wish you a beautiful life. A life where your smile comes easily, where your heart feels safe, where you are surrounded by people who genuinely care for you, and where you always have reasons to be happy.</p>

                                            <p><span class="love-emphasis">These photographs may belong to yesterday... but the memories they carry will always belong to us. And our story still has so many beautiful pages left to write.</span> ❤️</p>

                                            <p class="birthday-love-signature">With all the love hidden between these memories,<br>Happy Birthday, Subha. ❤️</p>
                                        </div>

                                        <div class="birthday-open-wrap">
                                            <div class="birthday-open-hint">A little surprise is waiting for you</div>
                                            <button type="button" class="birthday-mail-button" id="birthdayMailButton" aria-label="Open your birthday surprise">
                                                <span class="birthday-mail-icon" aria-hidden="true"></span>
                                                <span class="birthday-mail-label">
                                                    <strong>💌 Open Your Surprise</strong>
                                                    <span>there is something waiting inside</span>
                                                </span>
                                            </button>
                                        </div>

                                    </div>

                                </div>

                                <!-- ================================= -->
                                <!-- 🎂 ADVANCED BIRTHDAY REVEAL -->
                                <!-- ================================= -->

                                <div class="birthday-reveal-stage" id="birthdayRevealStage" aria-hidden="true">
                                    <div class="birthday-premium-sky"></div>
                                    <canvas class="birthday-premium-environment" id="birthdayEnvironmentCanvas" aria-hidden="true"></canvas>
                                    <div class="birthday-premium-moon">
                                        <span class="moon-rim"></span>
                                    </div>
                                    <div class="birthday-premium-clouds"></div>
                                    <div class="birthday-premium-lake"></div>
                                    <div class="birthday-premium-horizon"></div>
                                    <canvas class="birthday-premium-canvas" id="birthdayFireworksCanvas"></canvas>
                                    <div class="birthday-premium-shooting-star birthday-shoot-a"></div>
                                    <div class="birthday-premium-shooting-star birthday-shoot-b"></div>
                                    <div class="birthday-premium-shooting-star birthday-shoot-c"></div>
                                    <div class="birthday-premium-lantern birthday-lantern-a"></div>
                                    <div class="birthday-premium-lantern birthday-lantern-b"></div>
                                    <div class="birthday-premium-lantern birthday-lantern-c"></div>
                                    <div class="birthday-premium-lantern birthday-lantern-d"></div>
                                    <div class="birthday-premium-balloon birthday-balloon-a"><span class="balloon-specular"></span><span class="balloon-ribbon"></span></div>
                                    <div class="birthday-premium-balloon birthday-balloon-b"><span class="balloon-specular"></span><span class="balloon-ribbon"></span></div>
                                    <div class="birthday-premium-balloon birthday-balloon-c"><span class="balloon-specular"></span><span class="balloon-ribbon"></span></div>
                                    <div class="birthday-premium-balloon birthday-balloon-d"><span class="balloon-specular"></span><span class="balloon-ribbon"></span></div>
                                    <div class="birthday-premium-balloon birthday-balloon-e"><span class="balloon-specular"></span><span class="balloon-ribbon"></span></div>
                                    <div class="birthday-premium-balloon birthday-balloon-f"><span class="balloon-specular"></span><span class="balloon-ribbon"></span></div>
                                    <div class="birthday-premium-balloon birthday-balloon-g"><span class="balloon-specular"></span><span class="balloon-ribbon"></span></div>
                                    <div class="birthday-premium-balloon birthday-balloon-heart"><span class="balloon-specular"></span></div>
                                    <div class="birthday-premium-flower-glow birthday-flower-left"></div>
                                    <div class="birthday-premium-flower-glow birthday-flower-right"></div>
                                    <div class="birthday-reveal-rays"></div>
                                    <div class="birthday-reveal-vignette"></div>

                                    <div class="birthday-reveal-ring"></div>
                                    <div class="birthday-reveal-ring ring-2"></div>
                                    <div class="birthday-reveal-heart-ring"></div>
                                    <div class="birthday-reveal-heart">♥</div>

                                    <div class="birthday-reveal-frame"></div>

                                    <div class="birthday-reveal-content">
                                        <div class="birthday-reveal-kicker">A LITTLE WISH, JUST FOR YOU</div>
                                        <div class="birthday-reveal-line"></div>

                                        <h2 class="birthday-reveal-title">
                                            <span class="birthday-title-word"><span>HAPPY</span></span>
                                            <span class="birthday-title-word"><span>BIRTHDAY</span></span>
                                        </h2>

                                        <div class="birthday-reveal-name">Subha</div>
                                        <div class="birthday-name-line"></div>

                                        <div class="birthday-reveal-wish birthday-reveal-story">
                                            <p class="reveal-story-line line-1">If these memories could speak, they would tell you how many little moments became important without us even realizing it.</p>
                                            <p class="reveal-story-line line-2">The laughs we never planned, the conversations that lasted longer than they should, the silly things that made no sense to anyone else, and the quiet moments where nothing had to be said — those are the moments I want to remember the most.</p>
                                            <p class="reveal-story-line line-3"><strong>You are not just a memory in these photographs. You are a part of the memories I carry with me.</strong></p>
                                            <p class="reveal-story-line line-4">I don't know what every tomorrow will look like. But if I could choose one thing, I would choose many more moments like these — more laughter, more late conversations, more unexpected memories, and more birthdays to celebrate.</p>
                                            <p class="reveal-story-line line-5">So on your birthday, I don't just wish you happiness. I hope life gives you the kind of happiness that stays — the kind that finds you on ordinary days and makes your heart feel at home.</p>
                                            <p class="reveal-story-line line-6"><em>Because these photographs are only pieces of yesterday... there are still so many beautiful moments waiting for us tomorrow.</em></p>
                                        </div>

                                        <div class="birthday-reveal-footer">
                                            <span class="reveal-footer-main">Happy Birthday, Subha. ❤️</span>
                                            <span class="reveal-footer-sub">Some memories are beautiful because they happened. Some are beautiful because they are still waiting to happen.</span>
                                            <span class="reveal-footer-final">THIS IS ONLY THE BEGINNING. ❤️</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        `;


                        document.body.appendChild(
                            overlay
                        );


                        // =====================================
                        // 💌 MAIL BUTTON → ADVANCED BIRTHDAY REVEAL
                        // =====================================

                        const birthdayMailButton =
                            document.getElementById("birthdayMailButton");

                        const birthdayRevealStage =
                            document.getElementById("birthdayRevealStage");

                        birthdayMailButtonRef =
                            birthdayMailButton;

                        // The mail is deliberately hidden until the server confirms
                        // that this browser belongs to the host or the player named Subha.
                        if (birthdayMailButtonRef) {
                            birthdayMailButtonRef.style.display = "none";
                            birthdayMailButtonRef.disabled = true;
                        }

                        // Move the final reveal to the overlay root so it can truly occupy
                        // the entire viewport instead of inheriting the game content bounds.
                        if (
                            birthdayRevealStage &&
                            birthdayRevealStage.parentElement !== overlay
                        ) {
                            overlay.appendChild(
                                birthdayRevealStage
                            );
                        }

                        function startUltraPremiumBirthdayScene() {

                            if (!birthdayRevealStage) return;

                            const canvas =
                                birthdayRevealStage.querySelector("#birthdayFireworksCanvas");

                            const environmentCanvas =
                                birthdayRevealStage.querySelector("#birthdayEnvironmentCanvas");

                            if (!canvas || !environmentCanvas) return;

                            const ctx = canvas.getContext("2d");
                            const environmentCtx = environmentCanvas.getContext("2d");

                            if (!ctx || !environmentCtx) return;

                            let animationId = null;
                            let resizeHandler = null;
                            let running = true;
                            const fireworks = [];
                            const sparks = [];
                            let pointerMoveHandler = null;
                            let scenePointerX = 0;
                            let scenePointerY = 0;

                            const starField = Array.from({ length: 260 }, (_, index) => {
                                const seed = (index * 9301 + 49297) % 233280;
                                const random = seed / 233280;
                                const seed2 = (seed * 9301 + 49297) % 233280;
                                const random2 = seed2 / 233280;
                                return {
                                    x: random,
                                    y: random2 * 0.62,
                                    size: 0.45 + (index % 5) * 0.28,
                                    alpha: 0.22 + (index % 7) * 0.075,
                                    phase: (index % 31) * 0.37
                                };
                            });

                            const moonCraters = [
                                [0.26,0.25,0.065,0.040,0.20],
                                [0.60,0.20,0.055,0.038,0.14],
                                [0.73,0.38,0.082,0.052,0.18],
                                [0.42,0.45,0.095,0.060,0.16],
                                [0.64,0.62,0.055,0.035,0.20],
                                [0.30,0.66,0.070,0.045,0.13],
                                [0.52,0.78,0.045,0.028,0.17],
                                [0.78,0.72,0.035,0.024,0.13],
                                [0.18,0.48,0.038,0.025,0.12]
                            ];

                            const balloons = [
                                { x:0.055, y:0.39, s:1.10, hue:332, depth:1.8, drift:0.9 },
                                { x:0.105, y:0.60, s:0.82, hue:344, depth:1.25, drift:1.1 },
                                { x:0.165, y:0.30, s:0.58, hue:315, depth:0.8, drift:1.4 },
                                { x:0.915, y:0.36, s:1.08, hue:342, depth:1.8, drift:0.95 },
                                { x:0.855, y:0.57, s:0.82, hue:326, depth:1.35, drift:1.2 },
                                { x:0.955, y:0.60, s:0.55, hue:286, depth:0.75, drift:1.5 }
                            ];

                            const resize = () => {
                                const rect = birthdayRevealStage.getBoundingClientRect();
                                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                                const width = Math.max(1, Math.floor(rect.width));
                                const height = Math.max(1, Math.floor(rect.height));

                                canvas.width = Math.max(1, Math.floor(width * dpr));
                                canvas.height = Math.max(1, Math.floor(height * dpr));
                                canvas.style.width = width + "px";
                                canvas.style.height = height + "px";
                                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                                environmentCanvas.width = Math.max(1, Math.floor(width * dpr));
                                environmentCanvas.height = Math.max(1, Math.floor(height * dpr));
                                environmentCanvas.style.width = width + "px";
                                environmentCanvas.style.height = height + "px";
                                environmentCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                            };

                            resizeHandler = resize;
                            resize();
                            window.addEventListener("resize", resizeHandler, { passive: true });

                            pointerMoveHandler = event => {
                                const rect = birthdayRevealStage.getBoundingClientRect();
                                scenePointerX = ((event.clientX - rect.left) / Math.max(1, rect.width)) - 0.5;
                                scenePointerY = ((event.clientY - rect.top) / Math.max(1, rect.height)) - 0.5;
                            };

                            birthdayRevealStage.addEventListener("pointermove", pointerMoveHandler, { passive: true });

                            const launch = () => {
                                const w = birthdayRevealStage.clientWidth;
                                const h = birthdayRevealStage.clientHeight;
                                fireworks.push({
                                    x: w * (0.10 + Math.random() * 0.80),
                                    y: h * 0.88,
                                    tx: w * (0.12 + Math.random() * 0.76),
                                    ty: h * (0.12 + Math.random() * 0.35),
                                    speed: 7 + Math.random() * 3,
                                    hue: [320, 345, 275, 42, 18][Math.floor(Math.random() * 5)],
                                    trail: []
                                });
                            };

                            const burst = (x, y, hue) => {
                                const count = 54 + Math.floor(Math.random() * 34);
                                for (let i = 0; i < count; i++) {
                                    const angle = Math.random() * Math.PI * 2;
                                    const speed = 1.6 + Math.random() * 4.6;
                                    sparks.push({
                                        x, y,
                                        vx: Math.cos(angle) * speed,
                                        vy: Math.sin(angle) * speed,
                                        life: 1,
                                        decay: 0.012 + Math.random() * 0.014,
                                        hue: hue + (Math.random() * 34 - 17),
                                        size: 0.8 + Math.random() * 1.8
                                    });
                                }
                            };

                            const drawRealisticEnvironment = time => {
                                const w = birthdayRevealStage.clientWidth;
                                const h = birthdayRevealStage.clientHeight;
                                if (!w || !h) return;

                                const t = time * 0.001;
                                const parallaxX = scenePointerX * 14;
                                const parallaxY = scenePointerY * 9;

                                environmentCtx.clearRect(0, 0, w, h);

                                // Deep atmospheric gradient.
                                const sky = environmentCtx.createLinearGradient(0, 0, 0, h);
                                sky.addColorStop(0, "rgba(1,3,12,0.98)");
                                sky.addColorStop(0.36, "rgba(7,10,29,0.92)");
                                sky.addColorStop(0.66, "rgba(30,13,48,0.82)");
                                sky.addColorStop(1, "rgba(3,5,16,0.98)");
                                environmentCtx.fillStyle = sky;
                                environmentCtx.fillRect(0, 0, w, h);

                                // Fine stars with subtle twinkle and depth.
                                for (const star of starField) {
                                    const sx = star.x * w + parallaxX * (0.25 + star.size * 0.15);
                                    const sy = star.y * h + parallaxY * 0.15;
                                    const twinkle = 0.72 + Math.sin(t * 0.8 + star.phase) * 0.28;
                                    environmentCtx.globalAlpha = star.alpha * twinkle;
                                    environmentCtx.beginPath();
                                    environmentCtx.arc(sx, sy, star.size, 0, Math.PI * 2);
                                    environmentCtx.fillStyle = star.size > 1.2 ? "#ffe9f6" : "#dce8ff";
                                    environmentCtx.fill();
                                }
                                environmentCtx.globalAlpha = 1;

                                // Large photographic-style moon with crater relief.
                                const moonR = Math.min(w, h) * (w > 900 ? 0.145 : 0.12);
                                const moonX = w * 0.815 + parallaxX * -0.65;
                                const moonY = h * 0.235 + parallaxY * -0.45;

                                environmentCtx.save();
                                environmentCtx.globalCompositeOperation = "lighter";
                                const aura = environmentCtx.createRadialGradient(moonX, moonY, moonR * 0.45, moonX, moonY, moonR * 2.35);
                                aura.addColorStop(0, "rgba(255,232,190,0.26)");
                                aura.addColorStop(0.35, "rgba(255,198,137,0.11)");
                                aura.addColorStop(1, "rgba(255,156,92,0)");
                                environmentCtx.fillStyle = aura;
                                environmentCtx.beginPath();
                                environmentCtx.arc(moonX, moonY, moonR * 2.35, 0, Math.PI * 2);
                                environmentCtx.fill();
                                environmentCtx.restore();

                                const moon = environmentCtx.createRadialGradient(
                                    moonX - moonR * 0.28, moonY - moonR * 0.32, moonR * 0.04,
                                    moonX + moonR * 0.12, moonY + moonR * 0.06, moonR * 1.04
                                );
                                moon.addColorStop(0, "#fff9e9");
                                moon.addColorStop(0.42, "#f7dfb2");
                                moon.addColorStop(0.74, "#d7b17f");
                                moon.addColorStop(0.94, "#a87d61");
                                moon.addColorStop(1, "#765347");

                                environmentCtx.save();
                                environmentCtx.beginPath();
                                environmentCtx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
                                environmentCtx.clip();
                                environmentCtx.fillStyle = moon;
                                environmentCtx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);

                                // Low-contrast crater basins and raised rims.
                                for (const crater of moonCraters) {
                                    const cx = moonX + (crater[0] - 0.5) * moonR * 1.65;
                                    const cy = moonY + (crater[1] - 0.5) * moonR * 1.65;
                                    const rx = crater[2] * moonR;
                                    const ry = crater[3] * moonR;

                                    environmentCtx.fillStyle = `rgba(92,67,54,${crater[4]})`;
                                    environmentCtx.beginPath();
                                    environmentCtx.ellipse(cx, cy, rx, ry, -0.16, 0, Math.PI * 2);
                                    environmentCtx.fill();

                                    environmentCtx.strokeStyle = "rgba(255,244,210,0.16)";
                                    environmentCtx.lineWidth = Math.max(0.8, moonR * 0.012);
                                    environmentCtx.beginPath();
                                    environmentCtx.ellipse(cx - rx * 0.08, cy - ry * 0.10, rx * 0.96, ry * 0.93, -0.16, 0.3, 4.8);
                                    environmentCtx.stroke();
                                }

                                // Soft terminator shading for spherical depth.
                                const shade = environmentCtx.createLinearGradient(moonX - moonR, moonY, moonX + moonR, moonY);
                                shade.addColorStop(0, "rgba(255,255,255,0.04)");
                                shade.addColorStop(0.66, "rgba(255,255,255,0)");
                                shade.addColorStop(1, "rgba(68,43,35,0.24)");
                                environmentCtx.fillStyle = shade;
                                environmentCtx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
                                environmentCtx.restore();

                                // Atmospheric cloud banks in front of the moon.
                                environmentCtx.save();
                                environmentCtx.globalAlpha = 0.72;
                                environmentCtx.filter = "blur(9px)";
                                const cloudY = h * 0.40 + parallaxY * 0.35;
                                const cloudGroups = [
                                    [w * 0.12 + parallaxX * 0.2, cloudY, w * 0.24, h * 0.08],
                                    [w * 0.38 + parallaxX * 0.3, cloudY + h * 0.02, w * 0.31, h * 0.095],
                                    [w * 0.68 + parallaxX * 0.45, cloudY - h * 0.01, w * 0.28, h * 0.10],
                                    [w * 0.90 + parallaxX * 0.55, cloudY + h * 0.035, w * 0.23, h * 0.08]
                                ];
                                for (const c of cloudGroups) {
                                    const cg = environmentCtx.createRadialGradient(c[0], c[1], 0, c[0], c[1], c[2]);
                                    cg.addColorStop(0, "rgba(76,58,103,0.62)");
                                    cg.addColorStop(0.58, "rgba(35,31,68,0.48)");
                                    cg.addColorStop(1, "rgba(16,16,38,0)");
                                    environmentCtx.fillStyle = cg;
                                    environmentCtx.beginPath();
                                    environmentCtx.ellipse(c[0], c[1], c[2], c[3], 0, 0, Math.PI * 2);
                                    environmentCtx.fill();
                                }
                                environmentCtx.restore();

                                // Distant mountain silhouette and city-light pinpoints.
                                const mountainY = h * 0.63 + parallaxY * 0.12;
                                environmentCtx.fillStyle = "rgba(5,7,19,0.92)";
                                environmentCtx.beginPath();
                                environmentCtx.moveTo(0, h);
                                environmentCtx.lineTo(0, mountainY + h * 0.06);
                                for (let i = 0; i <= 12; i++) {
                                    const px = (i / 12) * w;
                                    const py = mountainY - (Math.sin(i * 1.7) * 0.035 + (i % 3) * 0.012) * h;
                                    environmentCtx.lineTo(px, py);
                                }
                                environmentCtx.lineTo(w, h);
                                environmentCtx.closePath();
                                environmentCtx.fill();

                                for (let i = 0; i < 90; i++) {
                                    const lx = ((i * 83) % 1000) / 1000 * w;
                                    const ly = mountainY + h * 0.055 + ((i * 37) % 100) / 100 * h * 0.10;
                                    const pulse = 0.55 + Math.sin(t * 0.7 + i) * 0.22;
                                    environmentCtx.globalAlpha = pulse;
                                    environmentCtx.fillStyle = i % 5 === 0 ? "#ffdba0" : "#ffc6e5";
                                    environmentCtx.fillRect(lx, ly, 1.2 + (i % 2), 0.9 + (i % 2));
                                }
                                environmentCtx.globalAlpha = 1;

                                // Moon path reflection across the lake.
                                const waterTop = h * 0.70;
                                const reflection = environmentCtx.createLinearGradient(moonX, waterTop, moonX, h);
                                reflection.addColorStop(0, "rgba(255,228,184,0.20)");
                                reflection.addColorStop(0.28, "rgba(255,193,151,0.10)");
                                reflection.addColorStop(1, "rgba(255,132,192,0)");
                                environmentCtx.fillStyle = reflection;
                                environmentCtx.fillRect(moonX - moonR * 0.55, waterTop, moonR * 1.1, h - waterTop);

                                for (let i = 0; i < 52; i++) {
                                    const y = waterTop + Math.pow(i / 52, 1.35) * (h - waterTop);
                                    const width = moonR * (0.18 + (1 - i / 52) * 0.78);
                                    const wobble = Math.sin(t * 1.2 + i * 1.7) * 5;
                                    environmentCtx.globalAlpha = 0.055 + (1 - i / 52) * 0.08;
                                    environmentCtx.strokeStyle = i % 3 === 0 ? "#ffe6c4" : "#dba9d0";
                                    environmentCtx.lineWidth = 0.8;
                                    environmentCtx.beginPath();
                                    environmentCtx.moveTo(moonX - width + wobble, y);
                                    environmentCtx.lineTo(moonX + width + wobble, y);
                                    environmentCtx.stroke();
                                }
                                environmentCtx.globalAlpha = 1;

                                // Realistic glossy balloons with volumetric shading.
                                for (let i = 0; i < balloons.length; i++) {
                                    const b = balloons[i];
                                    const bob = Math.sin(t * b.drift + i * 1.7) * 7;
                                    const bx = b.x * w + scenePointerX * b.depth * 9;
                                    const by = b.y * h + bob + scenePointerY * b.depth * 6;
                                    const bw = Math.max(24, Math.min(72, w * 0.045)) * b.s;
                                    const bh = bw * 1.34;

                                    environmentCtx.save();
                                    environmentCtx.translate(bx, by);
                                    environmentCtx.rotate(Math.sin(t * b.drift + i) * 0.025);

                                    // Soft cast shadow.
                                    environmentCtx.shadowColor = `hsla(${b.hue},80%,20%,0.42)`;
                                    environmentCtx.shadowBlur = 18;
                                    environmentCtx.shadowOffsetY = 11;

                                    const balloonGradient = environmentCtx.createRadialGradient(-bw * 0.28, -bh * 0.30, bw * 0.04, bw * 0.08, bh * 0.08, bh * 0.80);
                                    balloonGradient.addColorStop(0, `hsla(${b.hue},100%,96%,0.98)`);
                                    balloonGradient.addColorStop(0.14, `hsla(${b.hue},100%,82%,0.98)`);
                                    balloonGradient.addColorStop(0.50, `hsla(${b.hue},82%,57%,0.98)`);
                                    balloonGradient.addColorStop(0.82, `hsla(${b.hue},76%,35%,0.98)`);
                                    balloonGradient.addColorStop(1, `hsla(${b.hue},70%,19%,0.98)`);

                                    environmentCtx.fillStyle = balloonGradient;
                                    environmentCtx.beginPath();
                                    environmentCtx.moveTo(0, bh * 0.50);
                                    environmentCtx.bezierCurveTo(-bw * 0.72, bh * 0.36, -bw * 0.68, -bh * 0.42, 0, -bh * 0.50);
                                    environmentCtx.bezierCurveTo(bw * 0.68, -bh * 0.42, bw * 0.72, bh * 0.36, 0, bh * 0.50);
                                    environmentCtx.closePath();
                                    environmentCtx.fill();

                                    environmentCtx.shadowColor = "transparent";
                                    environmentCtx.shadowBlur = 0;

                                    // Strong specular reflection.
                                    const spec = environmentCtx.createLinearGradient(-bw * 0.55, -bh * 0.45, bw * 0.05, bh * 0.10);
                                    spec.addColorStop(0, "rgba(255,255,255,0.86)");
                                    spec.addColorStop(0.18, "rgba(255,255,255,0.32)");
                                    spec.addColorStop(0.42, "rgba(255,255,255,0)");
                                    environmentCtx.fillStyle = spec;
                                    environmentCtx.beginPath();
                                    environmentCtx.ellipse(-bw * 0.23, -bh * 0.22, bw * 0.12, bh * 0.28, -0.35, 0, Math.PI * 2);
                                    environmentCtx.fill();

                                    // Small hot highlight.
                                    environmentCtx.fillStyle = "rgba(255,255,255,0.82)";
                                    environmentCtx.beginPath();
                                    environmentCtx.ellipse(-bw * 0.34, -bh * 0.31, bw * 0.055, bh * 0.075, -0.25, 0, Math.PI * 2);
                                    environmentCtx.fill();

                                    // Knot and silk string.
                                    environmentCtx.fillStyle = `hsla(${b.hue},70%,28%,0.95)`;
                                    environmentCtx.beginPath();
                                    environmentCtx.moveTo(-bw * 0.07, bh * 0.46);
                                    environmentCtx.lineTo(bw * 0.07, bh * 0.46);
                                    environmentCtx.lineTo(0, bh * 0.59);
                                    environmentCtx.closePath();
                                    environmentCtx.fill();

                                    environmentCtx.strokeStyle = "rgba(246,226,238,0.62)";
                                    environmentCtx.lineWidth = 0.8;
                                    environmentCtx.beginPath();
                                    environmentCtx.moveTo(0, bh * 0.56);
                                    environmentCtx.bezierCurveTo(bw * 0.18, bh * 1.15, -bw * 0.18, bh * 1.62, bw * 0.04, bh * 2.15);
                                    environmentCtx.stroke();

                                    environmentCtx.restore();
                                }

                                // Subtle foreground bokeh / dust for cinematic depth.
                                for (let i = 0; i < 20; i++) {
                                    const px = ((i * 173) % 1000) / 1000 * w;
                                    const py = h * 0.62 + ((i * 71) % 1000) / 1000 * h * 0.32;
                                    const pulse = 0.45 + Math.sin(t * 0.6 + i) * 0.25;
                                    environmentCtx.globalAlpha = Math.max(0.08, pulse) * 0.24;
                                    environmentCtx.fillStyle = i % 2 ? "#ffb9dc" : "#ffe1ad";
                                    environmentCtx.beginPath();
                                    environmentCtx.arc(px, py, 1.1 + (i % 3), 0, Math.PI * 2);
                                    environmentCtx.fill();
                                }
                                environmentCtx.globalAlpha = 1;

                                // Fine film-grain veil: tiny transparent points, not a heavy filter.
                                environmentCtx.globalAlpha = 0.055;
                                for (let i = 0; i < 420; i++) {
                                    const gx = (i * 47) % Math.max(1, w);
                                    const gy = (i * 83) % Math.max(1, h);
                                    environmentCtx.fillStyle = i % 2 ? "#ffffff" : "#ffbfdc";
                                    environmentCtx.fillRect(gx, gy, 0.6, 0.6);
                                }
                                environmentCtx.globalAlpha = 1;
                            };

                            const render = time => {
                                if (!running) return;

                                const w = birthdayRevealStage.clientWidth;
                                const h = birthdayRevealStage.clientHeight;
                                ctx.clearRect(0, 0, w, h);

                                drawRealisticEnvironment(time);


                                if (Math.random() < 0.025) launch();

                                for (let i = fireworks.length - 1; i >= 0; i--) {
                                    const f = fireworks[i];
                                    f.trail.push({ x: f.x, y: f.y });
                                    if (f.trail.length > 7) f.trail.shift();

                                    const dx = f.tx - f.x;
                                    const dy = f.ty - f.y;
                                    const distance = Math.hypot(dx, dy);
                                    const step = Math.min(f.speed, distance);
                                    f.x += dx / distance * step;
                                    f.y += dy / distance * step;

                                    ctx.beginPath();
                                    f.trail.forEach((p, n) => {
                                        if (n === 0) ctx.moveTo(p.x, p.y);
                                        else ctx.lineTo(p.x, p.y);
                                    });
                                    ctx.strokeStyle = `hsla(${f.hue},100%,75%,.72)`;
                                    ctx.lineWidth = 1.4;
                                    ctx.stroke();

                                    ctx.beginPath();
                                    ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
                                    ctx.fillStyle = `hsla(${f.hue},100%,88%,1)`;
                                    ctx.shadowBlur = 12;
                                    ctx.shadowColor = `hsl(${f.hue},100%,70%)`;
                                    ctx.fill();
                                    ctx.shadowBlur = 0;

                                    if (distance < 10) {
                                        burst(f.x, f.y, f.hue);
                                        fireworks.splice(i, 1);
                                    }
                                }

                                for (let i = sparks.length - 1; i >= 0; i--) {
                                    const p = sparks[i];
                                    p.x += p.vx;
                                    p.y += p.vy;
                                    p.vx *= 0.985;
                                    p.vy = p.vy * 0.985 + 0.028;
                                    p.life -= p.decay;

                                    if (p.life <= 0) {
                                        sparks.splice(i, 1);
                                        continue;
                                    }

                                    ctx.beginPath();
                                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                                    ctx.fillStyle = `hsla(${p.hue},100%,${70 + p.life * 25}%,${p.life})`;
                                    ctx.shadowBlur = 9;
                                    ctx.shadowColor = `hsl(${p.hue},100%,70%)`;
                                    ctx.fill();
                                    ctx.shadowBlur = 0;
                                }

                                animationId = requestAnimationFrame(render);
                            };

                            if (birthdayRevealStage.__premiumCleanup) {
                                birthdayRevealStage.__premiumCleanup();
                            }

                            birthdayRevealStage.__premiumCleanup = () => {
                                running = false;
                                if (animationId) cancelAnimationFrame(animationId);
                                if (resizeHandler) window.removeEventListener("resize", resizeHandler);
                                if (pointerMoveHandler) birthdayRevealStage.removeEventListener("pointermove", pointerMoveHandler);
                            };

                            for (let i = 0; i < 18; i++) {
                                const petal = document.createElement("span");
                                petal.className = "birthday-premium-petal";
                                petal.style.left = `${Math.random() * 100}%`;
                                petal.style.top = `${-10 - Math.random() * 20}%`;
                                petal.style.animationDelay = `${Math.random() * 7}s`;
                                petal.style.animationDuration = `${7 + Math.random() * 5}s`;
                                birthdayRevealStage.appendChild(petal);
                            }

                            const sceneW = birthdayRevealStage.clientWidth;
                            const sceneH = birthdayRevealStage.clientHeight;
                            setTimeout(() => burst(sceneW * 0.50, sceneH * 0.24, 330), 900);
                            setTimeout(() => burst(sceneW * 0.28, sceneH * 0.28, 285), 1700);
                            setTimeout(() => burst(sceneW * 0.74, sceneH * 0.25, 42), 2300);
                            animationId = requestAnimationFrame(render);
                        }

                        function createBirthdayRevealParticles() {

                            if (!birthdayRevealStage) return;

                            const symbols = ["✦", "·", "♡", "♥", "✧"];

                            for (let i = 0; i < 72; i++) {

                                const particle =
                                    document.createElement("span");

                                particle.className =
                                    "birthday-particle";

                                const isHeart =
                                    i % 6 === 0;

                                if (isHeart) {
                                    particle.classList.add(
                                        "heart-particle"
                                    );
                                    particle.textContent =
                                        symbols[i % symbols.length];
                                    particle.style.color =
                                        i % 2
                                            ? "rgba(255,142,180,0.95)"
                                            : "rgba(255,220,232,0.92)";
                                }

                                const angle =
                                    Math.random() * Math.PI * 2;

                                const distance =
                                    180 + Math.random() * 520;

                                const x =
                                    Math.cos(angle) * distance;

                                const y =
                                    Math.sin(angle) * distance;

                                const duration =
                                    1200 + Math.random() * 1500;

                                const delay =
                                    Math.random() * 350;

                                particle.style.setProperty(
                                    "--px",
                                    `${x}px`
                                );

                                particle.style.setProperty(
                                    "--py",
                                    `${y}px`
                                );

                                particle.style.animation =
                                    `birthdayParticleBurst ${duration}ms cubic-bezier(0.16,0.72,0.2,1) ${delay}ms forwards`;

                                birthdayRevealStage.appendChild(
                                    particle
                                );

                            }

                        }

                        if (birthdayMailButton && birthdayRevealStage) {

                            birthdayRevealOpenHandler = () => {

                                if (birthdayRevealStarted) {
                                    return;
                                }

                                birthdayRevealStarted = true;

                                birthdayMailButton.disabled = true;
                                birthdayMailButton.style.pointerEvents = "none";

                                // A small premium click sound.
                                try {
                                    const ctx =
                                        typeof getAudioContext === "function"
                                            ? getAudioContext()
                                            : null;

                                    if (ctx) {
                                        const now = ctx.currentTime;
                                        const osc = ctx.createOscillator();
                                        const gain = ctx.createGain();

                                        osc.type = "sine";
                                        osc.frequency.setValueAtTime(520, now);
                                        osc.frequency.exponentialRampToValueAtTime(820, now + 0.16);

                                        gain.gain.setValueAtTime(0.0001, now);
                                        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
                                        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

                                        osc.connect(gain);
                                        gain.connect(ctx.destination);

                                        osc.start(now);
                                        osc.stop(now + 0.45);
                                    }
                                } catch (error) {
                                    console.log("Birthday reveal chime skipped.");
                                }

                                const letter =
                                    overlay.querySelector(
                                        ".birthday-love-letter"
                                    );

                                if (letter) {
                                    letter.classList.add(
                                        "birthday-letter-opening"
                                    );
                                }

                                setTimeout(() => {

                                    createBirthdayRevealParticles();

                                    birthdayRevealStage.setAttribute(
                                        "aria-hidden",
                                        "false"
                                    );

                                    birthdayRevealStage.classList.add(
                                        "open"
                                    );

                                    // 🌌 Start the cinematic moon + fireworks + balloons scene.
                                    startUltraPremiumBirthdayScene();

                                    // Keep the same birthday song playing into the final reveal.
                                    if (birthdaySong) {
                                        try {
                                            birthdaySong.loop = true;

                                            if (birthdaySong.paused) {
                                                const playPromise =
                                                    birthdaySong.play();

                                                if (
                                                    playPromise &&
                                                    typeof playPromise.catch === "function"
                                                ) {
                                                    playPromise.catch(() => {
                                                        console.log(
                                                            "Birthday reveal music could not resume."
                                                        );
                                                    });
                                                }
                                            }

                                            if (window.__birthdayRevealFadeTimer) {
                                                clearTimeout(
                                                    window.__birthdayRevealFadeTimer
                                                );
                                            }

                                            // Keep the reveal visible for one minute, then fade music out.
                                            window.__birthdayRevealFadeTimer =
                                                setTimeout(() => {
                                                    fadeBirthdaySongOut(8000);
                                                }, 60000);

                                        } catch (error) {
                                            console.log(
                                                "Birthday reveal music resume skipped."
                                            );
                                        }
                                    }

                                }, 700);

                            };

                            birthdayMailButton.addEventListener(
                                "click",
                                () => {

                                    if (!birthdayRevealCanOpen) {
                                        return;
                                    }

                                    // Ask the server. The server accepts this only from
                                    // the host or the player whose name is Subha.
                                    socket.emit(
                                        "birthdayRevealOpen"
                                    );

                                }
                            );

                        }


                        // =====================================
                        // WARNING APPEARS
                        // =====================================

                        setTimeout(
                            () => {

                                overlay.classList.add(
                                    "birthday-warning-active"
                                );

                                // ⚠️ FIRST WARNING BEEP
                                playBirthdayWarningBeep();

                            },
                            300
                        );


                        // =====================================
                        // HACKING TERMINAL APPEARS
                        // =====================================

                        setTimeout(
                            () => {

                                // 💻 DIGITAL GLITCH
                                playBirthdayGlitchSound();

                                const hackScreen =
                                    document.getElementById(
                                        "birthdayHackScreen"
                                    );

                                document.body.classList.add(
                                    "birthday-hack-glitch"
                                );

                                document.body.classList.add(
                                    "birthday-hack-flash"
                                );

                                if (hackScreen) {

                                    hackScreen.style.opacity =
                                        "1";

                                    hackScreen.style.transform =
                                        "translateY(0)";

                                    hackScreen.classList.add(
                                        "birthday-terminal-glitch"
                                    );

                                }

                            },
                            1200
                        );


                        // =====================================
                        // TERMINAL LINE 2
                        // =====================================

                        setTimeout(
                            () => {

                                playBirthdayGlitchSound();

                                const line =
                                    document.getElementById(
                                        "hackLine2"
                                    );

                                if (line) {

                                    line.style.opacity =
                                        "1";

                                }

                            },
                            2200
                        );


                        // =====================================
                        // TERMINAL LINE 3
                        // =====================================

                        setTimeout(
                            () => {

                                playBirthdayGlitchSound();

                                const line =
                                    document.getElementById(
                                        "hackLine3"
                                    );

                                if (line) {

                                    line.style.opacity =
                                        "1";

                                }

                            },
                            2900
                        );


                        // =====================================
                        // TERMINAL LINE 4
                        // =====================================

                        setTimeout(
                            () => {

                                playBirthdayCriticalAlarm();

                                const line =
                                    document.getElementById(
                                        "hackLine4"
                                    );

                                if (line) {

                                    line.style.opacity =
                                        "1";

                                }

                            },
                            3600
                        );


                        // =====================================
                        // TERMINAL LINE 5
                        // =====================================

                        setTimeout(
                            () => {

                                playBirthdayGlitchSound();

                                const line =
                                    document.getElementById(
                                        "hackLine5"
                                    );

                                if (line) {

                                    line.style.opacity =
                                        "1";

                                }

                            },
                            4300
                        );


                        // =====================================
                        // CRITICAL FAILURE
                        // =====================================

                        setTimeout(
                            () => {

                                playBirthdayCriticalAlarm();

                                const critical =
                                    document.getElementById(
                                        "hackCritical"
                                    );

                                if (critical) {

                                    critical.style.opacity =
                                        "1";

                                    critical.classList.add(
                                        "birthday-critical-pulse"
                                    );

                                }

                            },
                            5000
                        );


                        // =====================================
                        // DO NOT CLOSE
                        // =====================================

                        setTimeout(
                            () => {

                                playBirthdaySystemFailureSound();

                                const message =
                                    document.getElementById(
                                        "hackDoNotClose"
                                    );

                                if (message) {

                                    message.style.opacity =
                                        "1";

                                }

                            },
                            5400
                        );


                        // =====================================
                        // CLEAN BLACK TRANSITION
                        // =====================================

                        setTimeout(
                            () => {

                                // 🔇 SUDDEN SILENCE BEFORE THE MEMORIES
                                birthdaySuddenSilence();

                                const hackScreen =
                                    document.getElementById(
                                        "birthdayHackScreen"
                                    );

                                if (hackScreen) {

                                    hackScreen.style.opacity =
                                        "0";

                                    hackScreen.style.transform =
                                        "scale(0.95)";

                                }

                                const warning =
                                    overlay.querySelector(
                                        ".birthday-warning"
                                    );

                                if (warning) {
                                    warning.style.opacity = "0";
                                }

                                const subtext =
                                    overlay.querySelector(
                                        ".birthday-subtext"
                                    );

                                if (subtext) {
                                    subtext.style.opacity = "0";
                                }

                                const heart =
                                    overlay.querySelector(
                                        ".birthday-heart"
                                    );

                                if (heart) {
                                    heart.style.opacity = "0";
                                }

                                setTimeout(() => {

                                    document.body.classList.remove(
                                        "birthday-hack-glitch"
                                    );

                                    document.body.classList.remove(
                                        "birthday-hack-flash"
                                    );

                                    if (hackScreen) {
                                        hackScreen.remove();
                                    }

                                    // Keep the screen dark and begin the memory archive.
                                    resumeBirthdayAudio();

                                    startBirthdayMemorySequence(
                                        overlay
                                    );

                                }, 650);

                            },
                            7000
                        );
                    }


                    // =====================================
                    // GAME STATE
                    // =====================================

                    socket.on(
                        "gameState",
                        state => {

                            if (!state) {

                                return;

                            }
                            const round = Number(state.round) || 1;

                            if (typeof roundDisplay !== "undefined" && roundDisplay) {
                                roundDisplay.textContent = `ROUND ${round}`;
                            }


                            // -------------------------------
                            // GAME STATUS
                            // -------------------------------

                            if (state.gameOver) {

                                gameRunning = false;

                            } else {

                                gameRunning = true;

                            }


                            // -------------------------------
                            // PLAYERS
                            // -------------------------------

                            if (
                                Array.isArray(
                                    state.players
                                )
                            ) {

                                lastPlayers =
                                    state.players;

                                updateMobileHostControl(
                                    state.players
                                );

                                updateGamePlayers(
                                    state.players
                                );

                            }


                            // -------------------------------
                            // BOMB
                            // -------------------------------

                            if (state.bomb) {

                                currentBomb =
                                    state.bomb;


                                updateBomb(
                                    state.bomb
                                );

                            } else {

                                currentBomb = null;

                                lastTickSecond = -1;

                                removeAllBombs();


                                if (
                                    gameTimer &&
                                    !state.gameOver
                                ) {

                                    gameTimer.textContent =
                                        "—";

                                }

                            }

                        }
                    );


                    // =====================================
                    // DISPLAY PLAYERS
                    // =====================================

                    function updateGamePlayers(
                        players
                    ) {

                        if (!arena) {

                            return;

                        }


                        const activePlayerIds =
                            new Set();


                        players.forEach(
                            (player, index) => {

                                activePlayerIds.add(
                                    player.id
                                );


                                let element =
                                    gamePlayers.get(
                                        player.id
                                    );


                                // ---------------------------
                                // CREATE PLAYER
                                // ---------------------------

                                if (!element) {

                                    element =
                                        document.createElement(
                                            "div"
                                        );


                                    element.className =
                                        "game-player";


                                    const colorClass =
                                        playerColors[
                                            index %
                                            playerColors.length
                                        ];


                                    element.classList.add(
                                        colorClass
                                    );


                                    // Player label

                                    const label =
                                        document.createElement(
                                            "div"
                                        );


                                    label.className =
                                        "player-label";


                                    // Character

                                    const character =
                                        document.createElement(
                                            "div"
                                        );


                                    character.className =
                                        "player-character";


                                    character.textContent =
                                        "😎";


                                    element.appendChild(
                                        label
                                    );


                                    element.appendChild(
                                        character
                                    );


                                    arena.appendChild(
                                        element
                                    );


                                    gamePlayers.set(
                                        player.id,
                                        element
                                    );

                                }


                                // ---------------------------
                                // LABEL
                                // ---------------------------

                                const label =
                                    element.querySelector(
                                        ".player-label"
                                    );


                                if (label) {

                                    label.textContent =
                                        player.name;

                                }


                                // ---------------------------
                                // POSITION
                                // ---------------------------

                                if (
                                    typeof player.x ===
                                        "number" &&
                                    typeof player.y ===
                                        "number"
                                ) {

                                    element.style.left =
                                        `${player.x}%`;

                                    element.style.top =
                                        `${player.y}%`;

                                }


                                // ---------------------------
                                // LOCAL PLAYER
                                // ---------------------------

                                if (
                                    typeof socket !==
                                        "undefined" &&
                                    player.id ===
                                        socket.id
                                ) {

                                    element.classList.add(
                                        "local-player"
                                    );

                                } else {

                                    element.classList.remove(
                                        "local-player"
                                    );

                                }


                                // ---------------------------
                                // DEAD PLAYER
                                // ---------------------------

                                if (
                                    player.alive === false
                                ) {

                                    element.classList.add(
                                        "player-dead"
                                    );

                                } else {

                                    element.classList.remove(
                                        "player-dead"
                                    );

                                }


                                // ---------------------------
                                // EXPLODED PLAYER
                                // ---------------------------

                                if (
                                    element.dataset.exploded ===
                                    "true"
                                ) {

                                    element.classList.add(
                                        "player-exploded"
                                    );

                                }

                            }
                        );


                        // -------------------------------
                        // REMOVE DISCONNECTED PLAYERS
                        // -------------------------------

                        gamePlayers.forEach(
                            (element, id) => {

                                if (
                                    !activePlayerIds.has(id)
                                ) {

                                    element.remove();

                                    gamePlayers.delete(id);

                                }

                            }
                        );

                    }


                    // =====================================
                    // BOMB ASSIGNED
                    // =====================================

                    socket.on(
                        "bombAssigned",
                        data => {

                            if (!data) {

                                return;

                            }


                            currentBomb = {

                                holderId:
                                    data.holderId,

                                timeLeft:
                                    data.timeLeft,

                                active:
                                    true

                            };


                            // Reset tick timer

                            lastTickSecond =
                                -1;


                            updateBomb(
                                currentBomb
                            );


                            console.log(
                                "💣 Bomb assigned:",
                                data.holderId
                            );

                        }
                    );


                    // =====================================
                    // BOMB PASSED
                    // =====================================

                    socket.on(
                        "bombPassed",
                        data => {

                            if (!data) {

                                return;

                            }


                            console.log(
                                "💨 Bomb passed"
                            );


                            showBombPassEffect(
                                data.fromId,
                                data.toId
                            );


                            currentBomb = {

                                holderId:
                                    data.toId,

                                timeLeft:
                                    data.timeLeft,

                                active:
                                    true

                            };


                            // Reset ticking for new holder

                            lastTickSecond =
                                -1;


                            updateBomb(
                                currentBomb
                            );

                        }
                    );


                    // =====================================
                    // UPDATE BOMB
                    // =====================================

                    function updateBomb(
                        bomb
                    ) {

                        if (
                            !arena ||
                            !bomb
                        ) {

                            return;

                        }


                        removeAllBombs();


                        // =================================
                        // TIMER
                        // =================================

                        if (gameTimer) {

                            const seconds =
                                Math.max(
                                    0,
                                    Math.ceil(
                                        Number(
                                            bomb.timeLeft
                                        ) || 0
                                    )
                                );


                            gameTimer.textContent =
                                seconds;


                            // =================================
                            // BOMB TICK SOUND
                            // =================================

                            if (
                                seconds !==
                                    lastTickSecond &&
                                seconds > 0
                            ) {

                                lastTickSecond =
                                    seconds;


                                playBombTick(
                                    seconds <= 5
                                );

                            }


                            // =================================
                            // DANGER MODE
                            // =================================

                            if (
                                seconds <= 5
                            ) {

                                gameTimer.classList.add(
                                    "timer-danger"
                                );

                            } else {

                                gameTimer.classList.remove(
                                    "timer-danger"
                                );

                            }

                        }


                        // =================================
                        // FIND BOMB HOLDER
                        // =================================

                        const holder =
                            gamePlayers.get(
                                bomb.holderId
                            );


                        if (!holder) {

                            return;

                        }


                        // =================================
                        // CREATE BOMB
                        // =================================

                        const bombElement =
                            document.createElement(
                                "div"
                            );


                        bombElement.className =
                            "player-bomb";


                        bombElement.textContent =
                            "💣";


                        holder.appendChild(
                            bombElement
                        );


                        // =================================
                        // HOLDER GLOW
                        // =================================

                        holder.classList.add(
                            "bomb-holder"
                        );

                    }


                    // =====================================
                    // REMOVE ALL BOMBS
                    // =====================================

                    function removeAllBombs() {

                        document
                            .querySelectorAll(
                                ".player-bomb"
                            )
                            .forEach(
                                bomb =>
                                    bomb.remove()
                            );


                        document
                            .querySelectorAll(
                                ".bomb-holder"
                            )
                            .forEach(
                                player =>
                                    player.classList.remove(
                                        "bomb-holder"
                                    )
                            );

                    }


                    // =====================================
                    // BOMB EXPLODED
                    // =====================================

                    socket.on(
                        "bombExploded",
                        data => {

                            if (!data) {

                                return;

                            }


                            console.log(
                                "💥 Bomb exploded:",
                                data.playerName
                            );


                            // Explosion sound

                            playExplosionSound();


                            const player =
                                gamePlayers.get(
                                    data.playerId
                                );


                            if (player) {

                                player.dataset.exploded =
                                    "true";


                                player.classList.add(
                                    "player-exploded"
                                );


                                createExplosionEffect(
                                    player
                                );


                                setTimeout(
                                    () => {

                                        player.dataset.exploded =
                                            "false";

                                    },
                                    1200
                                );

                            }


                            currentBomb = null;

                            lastTickSecond = -1;

                            removeAllBombs();


                            if (gameTimer) {

                                gameTimer.textContent =
                                    "BOOM!";

                            }

                        }
                    );


                    // =====================================
                    // EXPLOSION EFFECT
                    // =====================================

                    function createExplosionEffect(
                        player
                    ) {

                        if (!player) {

                            return;

                        }


                        const explosion =
                            document.createElement(
                                "div"
                            );


                        explosion.className =
                            "explosion-effect";


                        explosion.textContent =
                            "💥";


                        player.appendChild(
                            explosion
                        );


                        setTimeout(
                            () => {

                                explosion.remove();

                            },
                            1200
                        );

                    }


                    // =====================================
                    // CLEAR EXPLOSIONS
                    // =====================================

                    function clearExplosionEffects() {

                        document
                            .querySelectorAll(
                                ".explosion-effect"
                            )
                            .forEach(
                                element =>
                                    element.remove()
                            );


                        document
                            .querySelectorAll(
                                ".player-exploded"
                            )
                            .forEach(
                                element =>
                                    element.classList.remove(
                                        "player-exploded"
                                    )
                            );

                    }


                    // =====================================
                    // BOMB PASS EFFECT
                    // =====================================

                    function showBombPassEffect(
                        fromId,
                        toId
                    ) {

                        const fromPlayer =
                            gamePlayers.get(
                                fromId
                            );


                        const toPlayer =
                            gamePlayers.get(
                                toId
                            );


                        if (fromPlayer) {

                            fromPlayer.classList.add(
                                "bomb-pass-from"
                            );


                            setTimeout(
                                () => {

                                    fromPlayer.classList.remove(
                                        "bomb-pass-from"
                                    );

                                },
                                500
                            );

                        }


                        if (toPlayer) {

                            toPlayer.classList.add(
                                "bomb-pass-to"
                            );


                            setTimeout(
                                () => {

                                    toPlayer.classList.remove(
                                        "bomb-pass-to"
                                    );

                                },
                                700
                            );

                        }

                    }


                    // =====================================
                    // GAME OVER
                    // =====================================

                    socket.on(
                        "gameOver",
                        data => {

                            gameRunning = false;

                            currentBomb = null;

                            lastTickSecond = -1;

                            removeAllBombs();

                            clearExplosionEffects();


                            if (gameTimer) {

                                gameTimer.textContent =
                                    "GAME OVER";


                                gameTimer.classList.remove(
                                    "timer-danger"
                                );

                            }


                            console.log(
                                "🏆 GAME OVER"
                            );


                            if (!data) {

                                return;

                            }


                            showWinner(
                                data.winner,
                                data.players
                            );

                        }
                    );


                    // =====================================
                    // WINNER OVERLAY
                    // =====================================

                    function showWinner(
                        winner,
                        players
                    ) {

                        const oldOverlay =
                            document.querySelector(
                                ".winner-overlay"
                            );


                        if (oldOverlay) {

                            oldOverlay.remove();

                        }


                        const overlay =
                            document.createElement(
                                "div"
                            );


                        overlay.className =
                            "winner-overlay";


                        const card =
                            document.createElement(
                                "div"
                            );


                        card.className =
                            "winner-card";


                        // Trophy

                        const trophy =
                            document.createElement(
                                "div"
                            );


                        trophy.className =
                            "winner-trophy";


                        trophy.textContent =
                            "🏆";


                        // Title

                        const title =
                            document.createElement(
                                "div"
                            );


                        title.className =
                            "winner-title";


                        title.textContent =
                            "GAME OVER";


                        // Winner name

                        const winnerName =
                            document.createElement(
                                "div"
                            );


                        winnerName.className =
                            "winner-name";


                        if (winner) {

                            winnerName.textContent =
                                `${winner.name} WINS!`;

                        } else {

                            winnerName.textContent =
                                "NO WINNER";

                        }


                        // Score

                        const score =
                            document.createElement(
                                "div"
                            );


                        score.className =
                            "winner-score";


                        if (winner) {

                            score.textContent =
                                `🏆 Score: ${winner.score}`;

                        } else {

                            score.textContent =
                                "Round ended";

                        }


                        // Player summary

                        const summary =
                            document.createElement(
                                "div"
                            );


                        summary.className =
                            "winner-summary";


                        if (
                            Array.isArray(players)
                        ) {

                            players.forEach(
                                player => {

                                    const row =
                                        document.createElement(
                                            "div"
                                        );


                                    row.className =
                                        "winner-player-row";


                                    const status =
                                        player.alive
                                            ? "🟢"
                                            : "💀";


                                    row.textContent =
                                        `${status} ${player.name} — ${player.score}`;


                                    summary.appendChild(
                                        row
                                    );

                                }
                            );

                        }


                        // Back button

                        const button =
                            document.createElement(
                                "button"
                            );


                        button.className =
                            "winner-button";


                        button.textContent =
                            "BACK TO LOBBY";


                        button.addEventListener(
                            "click",
                            () => {

                                overlay.remove();

                                location.reload();

                            }
                        );


                        card.appendChild(
                            trophy
                        );


                        card.appendChild(
                            title
                        );


                        card.appendChild(
                            winnerName
                        );


                        card.appendChild(
                            score
                        );


                        card.appendChild(
                            summary
                        );


                        card.appendChild(
                            button
                        );


                        overlay.appendChild(
                            card
                        );


                        document.body.appendChild(
                            overlay
                        );

                    }


                    // =====================================
                    // 📱 MOBILE TOUCH CONTROLS — FINAL
                    // =====================================

                    function setupMobileControls() {

                        const buttons =
                            document.querySelectorAll(
                                ".mobile-controls button"
                            );

                        if (!buttons.length) {

                            console.warn(
                                "⚠️ Mobile control buttons not found."
                            );

                            return;
                        }

                        buttons.forEach(
                            button => {

                                if (
                                    button.dataset.mobileBound ===
                                    "true"
                                ) {
                                    return;
                                }

                                const direction =
                                    button.dataset.direction;

                                if (
                                    ![
                                        "up",
                                        "down",
                                        "left",
                                        "right"
                                    ].includes(
                                        direction
                                    )
                                ) {
                                    return;
                                }

                                button.dataset.mobileBound =
                                    "true";

                                const press =
                                    event => {

                                        event.preventDefault();
                                        event.stopPropagation();

                                        movementKeys.add(
                                            direction
                                        );

                                        button.classList.add(
                                            "mobile-control-active"
                                        );

                                        if (
                                            event.pointerId !==
                                                undefined &&
                                            button.setPointerCapture
                                        ) {
                                            try {
                                                button.setPointerCapture(
                                                    event.pointerId
                                                );
                                            } catch (error) {}
                                        }
                                    };

                                const release =
                                    event => {

                                        event.preventDefault();
                                        event.stopPropagation();

                                        movementKeys.delete(
                                            direction
                                        );

                                        button.classList.remove(
                                            "mobile-control-active"
                                        );
                                    };

                                // Modern Android/iPhone input.
                                button.addEventListener(
                                    "pointerdown",
                                    press,
                                    { passive: false }
                                );

                                button.addEventListener(
                                    "pointerup",
                                    release,
                                    { passive: false }
                                );

                                button.addEventListener(
                                    "pointercancel",
                                    release,
                                    { passive: false }
                                );

                                button.addEventListener(
                                    "lostpointercapture",
                                    release,
                                    { passive: false }
                                );

                                // Fallback for browsers that prefer touch events.
                                button.addEventListener(
                                    "touchstart",
                                    press,
                                    { passive: false }
                                );

                                button.addEventListener(
                                    "touchend",
                                    release,
                                    { passive: false }
                                );

                                button.addEventListener(
                                    "touchcancel",
                                    release,
                                    { passive: false }
                                );

                                button.addEventListener(
                                    "contextmenu",
                                    event => {
                                        event.preventDefault();
                                    }
                                );
                            }
                        );

                        console.log(
                            `📱 Mobile controls connected: ${buttons.length}`
                        );
                    }


                    setupMobileControls();

                    // =====================================
                    // WINDOW BLUR
                    // =====================================

                    window.addEventListener(
                        "blur",
                        () => {

                            movementKeys.clear();

                            document
                                .querySelectorAll(
                                    ".mobile-control-active"
                                )
                                .forEach(
                                    button => {
                                        button.classList.remove(
                                            "mobile-control-active"
                                        );
                                    }
                                );
                        }
                    );



                    /* =========================================
                       📱 MOBILE GAME LAYOUT
                       ========================================= */
                    (() => {
                        const style = document.createElement("style");
                        style.id = "chaosPartyMobileGameLayout";
                        style.textContent = `
                            @media (max-width: 700px) {
                                #gameContainer,
                                .game-container {
                                    width: 100vw !important;
                                    max-width: 100vw !important;
                                }

                                #arena {
                                    width: calc(100vw - 24px) !important;
                                    height: min(68vh, 560px) !important;
                                    min-height: 380px;
                                    margin-left: auto !important;
                                    margin-right: auto !important;
                                }

                                #gameTimer {
                                    min-width: 52px !important;
                                    font-size: 20px !important;
                                }

                                .game-title {
                                    font-size: 18px !important;
                                }

                                .round-display {
                                    font-size: 8px !important;
                                }
                            }
                        `;
                        document.head.appendChild(style);
                    })();

                    // =====================================
                    // 📱 MOBILE BUTTON ACTIVE STYLE
                    // =====================================

                    if (
                        !document.getElementById(
                            "chaosPartyMobileActiveStyle"
                        )
                    ) {

                        const mobileActiveStyle =
                            document.createElement(
                                "style"
                            );

                        mobileActiveStyle.id =
                            "chaosPartyMobileActiveStyle";

                        mobileActiveStyle.textContent = `
                            .mobile-controls button.mobile-control-active {
                                transform: scale(0.90) !important;
                                filter: brightness(1.25);
                            }
                        `;

                        document.head.appendChild(
                            mobileActiveStyle
                        );
                    }


                    // =====================================
                    // DEBUG
                    // =====================================

                    console.log(
                        "✅ Chaos Party game client ready"
                    );
