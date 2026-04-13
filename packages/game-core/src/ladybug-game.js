import {
    ASSET_BASE_PATH,
    ANT_GROUND_COLLISION_OFFSET_Y,
    GAME_PHYSICS,
    LADYBUG_JUMP_VELOCITY,
    WIN_SCORE,
    screen_size_mobile,
    screen_size_web
} from "../../config/src/game-config.js";

export function createLadybugGame(Phaser, options = {}) {
    const assetBasePath = options.assetBasePath || ASSET_BASE_PATH;
    const isMobile = Boolean(options.mobile);
    const screenSize = isMobile ? screen_size_mobile : screen_size_web;
    const replayHintLabel = isMobile ? "Tap Restart to play again" : "Press ENTER to play again";

    const config = {
        type: Phaser.AUTO,
        width: screenSize.width,
        height: screenSize.height,
        scale: {
            // this fits the mobile version and centered the screen
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: GAME_PHYSICS,
        scene: {
            preload,
            create,
            update
        }
    };

    let player;
    let cursors;
    let ground;
    let antGround;
    let sky1, sky2;
    let groundVis1, groundVis2;

    // shooting vars
    let spaceKey;
    let bullets;

    // enemies
    let ants;

    //HUD
    let lives = 3;
    let livesIcons = [];
    let score = 0;
    let scoreText;
    let isInvincible = false;
    let isGameOver = false;
    let isPausedByDesktop = false;
    let currentScene;
    const touchState = {
        left: false,
        right: false,
        jump: false,
        shoot: false,
    };

    function postToHost(message) {
        if (typeof window === "undefined") return;
        if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== "function") return;
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }

    function restartGame(scene) {
        if (!scene) return;
        isGameOver = false;
        scene.scene.restart();
    }

    function bindMobileBridge(scene) {
        if (!isMobile || typeof window === "undefined") return;

        const touchInputHandler = (event) => {
            const next = event && event.detail ? event.detail : {};
            touchState.left = Boolean(next.left);
            touchState.right = Boolean(next.right);
            touchState.jump = Boolean(next.jump);
            touchState.shoot = Boolean(next.shoot);
        };

        const restartHandler = () => {
            if (!isGameOver) return;
            restartGame(scene);
        };

        window.addEventListener("ladybug-touch-input", touchInputHandler);
        window.addEventListener("ladybug-restart-game", restartHandler);

        const unbind = () => {
            window.removeEventListener("ladybug-touch-input", touchInputHandler);
            window.removeEventListener("ladybug-restart-game", restartHandler);
        };

        scene.events.once("shutdown", unbind);
        scene.events.once("destroy", unbind);
    }

    function bindDesktopBridge(scene) {
        if (isMobile || typeof window === "undefined") return;

        const pauseHandler = () => {
            if (isGameOver || isPausedByDesktop) return;
            isPausedByDesktop = true;
            scene.scene.pause();
        };

        const resumeHandler = () => {
            if (!isPausedByDesktop) return;
            isPausedByDesktop = false;
            scene.scene.resume();
        };

        window.addEventListener("ladybug-desktop-pause", pauseHandler);
        window.addEventListener("ladybug-desktop-resume", resumeHandler);

        const unbind = () => {
            window.removeEventListener("ladybug-desktop-pause", pauseHandler);
            window.removeEventListener("ladybug-desktop-resume", resumeHandler);
        };

        scene.events.once("shutdown", unbind);
        scene.events.once("destroy", unbind);
    }

    function preload() {
        this.load.image("sky", `${assetBasePath}/sky.png`);
        this.load.image("ground", `${assetBasePath}/grass.png`);
        this.load.image("shoot", `${assetBasePath}/shoot.png`);
        this.load.image("lives", `${assetBasePath}/lives.png`);
        this.load.spritesheet("ladybug", `${assetBasePath}/ladybug.png`, {
            frameWidth: 320,
            frameHeight: 210
        });

        // ant spring
        this.load.spritesheet("ant", `${assetBasePath}/ant.png`, {
            frameWidth: 300,
            frameHeight: 262
        });
    }

    function create() {
        currentScene = this;
        isPausedByDesktop = false;
        postToHost({ type: "game-started" });
        bindMobileBridge(this);
        bindDesktopBridge(this);

         // sky simulate infinite scroll
        sky1 = this.add.image(config.width / 2, config.height / 2, "sky")
            .setDisplaySize(config.width, config.height).setDepth(-1);
        sky2 = this.add.image(config.width + config.width / 2, config.height / 2, "sky")
            .setDisplaySize(config.width, config.height).setDepth(-1);

        // ground strips (scroll)
        groundVis1 = this.add.image(config.width / 2, config.height - 50, "ground")
            .setDisplaySize(config.width, 100).setDepth(0);
        groundVis2 = this.add.image(config.width + config.width / 2, config.height - 50, "ground")
            .setDisplaySize(config.width, 100).setDepth(0);


        // physics collider for the ladybug
        ground = this.physics.add.staticImage(config.width / 2, config.height - 50, "ground");
        ground.displayWidth = config.width;
        ground.displayHeight = 100;
        ground.setVisible(false);
        ground.refreshBody();
        ground.body.setOffset(0, 0);

         // ants collition with visual ground
        antGround = this.physics.add.staticImage(
            ground.x,
            ground.y + ANT_GROUND_COLLISION_OFFSET_Y,
            "ground"
        );
        antGround.displayWidth = ground.displayWidth;
        antGround.displayHeight = ground.displayHeight;
        antGround.setVisible(false);
        antGround.refreshBody();
        antGround.body.setOffset(0, 0);

        player = this.physics.add.sprite(200, 0, "ladybug");
        player.setCollideWorldBounds(true);
        player.body.setGravityY(800);
        player.setScale(0.5);

        
        ants = this.physics.add.group();
        this.physics.add.collider(ants, antGround);
        this.time.addEvent({
            delay: 2000,
            callback: createAnts,
            callbackScope: this,
            loop: true
        });

        // shot creation
        bullets = this.physics.add.group({
            allowGravity: false
        });

        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("ladybug", { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "turn",
            frames: [{ key: "ladybug", frame: 0 }],
            frameRate: 20
        });

        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("ladybug", { start: 2, end: 0 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "up",
            frames: this.anims.generateFrameNumbers("ladybug", { start: 3, end: 4 }),
            frameRate: 5,
            repeat: 2
        });

        this.anims.create({
            key: "ant-walk",
            frames: this.anims.generateFrameNumbers("ant", { frames: [0, 1, 2, 3, 4, 3, 2, 1] }),
            frameRate: 5,
            repeat: -1
        });

        cursors = this.input.keyboard.createCursorKeys();
        spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

         // lives icons
        lives = 3
        lives = 3;
        livesIcons = [];
        isInvincible = false;
        for (let i = 0; i < lives; i++) {
            const icon = this.add.image(30 + i * 50, 30, "lives")
                .setScale(0.12)
                .setDepth(10)
                .setScrollFactor(0);
            livesIcons.push(icon);
        }

        // score
        score = 0;
        scoreText = this.add.text(config.width - 20, 15, "Score: 0", {
            fontSize: "26px",
            fill: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

        // kill ant
        this.physics.add.overlap(bullets, ants, bulletHitAnt, null, this);
         // Ant hits ladybug
        this.physics.add.overlap(player, ants, hitPlayer, null, this);
    }

    // ant hit ladybug
    function bulletHitAnt(bullet, ant) {
        if (isGameOver) return;
        bullet.destroy();
        ant.destroy();
        score++;
        scoreText.setText("Score: " + score);
        if (score >= WIN_SCORE) {
            showWin.call(this, player);
        }
    }

    function hitPlayer(playerSprite, ant) {
        if (isInvincible) return;
        ant.destroy();
        lives--;
        if (livesIcons.length > 0) {
            livesIcons.pop().destroy();
        }
        if (lives <= 0) {
            showGameOver.call(this, playerSprite);
            return;
        }
        isInvincible = true;
        this.tweens.add({
            targets: playerSprite,
            alpha: 0,
            duration: 150,
            repeat: 5,
            yoyo: true,
            onComplete: () => {
                playerSprite.setAlpha(1);
                isInvincible = false;
            }
        });
    }

    function showGameOver(playerSprite) {
        isGameOver = true;
        playerSprite.setVelocity(0, 0);
        playerSprite.body.setEnable(false);
        ants.children.each((a) => a.setVelocity(0, 0));

        this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0x000000, 0.6)
            .setDepth(20).setScrollFactor(0);

        this.add.text(config.width / 2, config.height / 2 - 80, "GAME OVER", {
            fontSize: "72px",
            fill: "#ff2222",
            fontStyle: "bold",
            stroke: "#000000"
        }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

        this.add.text(config.width / 2, config.height / 2, "Score: " + score, {
            fontSize: "36px",
            fill: "#ffffff",
            stroke: "#000000"
        }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

        this.add.text(config.width / 2, config.height / 2 + 70, replayHintLabel, {
            fontSize: "30px",
            fill: "#aeb4ee",
            stroke: "#000000"
        }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

        postToHost({ type: "game-over" });

        this.input.keyboard.once("keydown-ENTER", () => {
            restartGame(this);
        });
    }

    function showWin(playerSprite) {
        isGameOver = true;
        playerSprite.setVelocity(0, 0);
        playerSprite.body.setEnable(false);
        ants.children.each((a) => a.setVelocity(0, 0));

        // transparent overlay
        this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0x000000, 0.6)
            .setDepth(20).setScrollFactor(0);

        this.add.text(config.width / 2, config.height / 2 - 80, "YOU WIN", {
            fontSize: "72px",
            fill: "#4cff4c",
            fontStyle: "bold",
            stroke: "#000000"
        }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

        this.add.text(config.width / 2, config.height / 2, "Score: " + score, {
            fontSize: "36px",
            fill: "#ffffff",
            stroke: "#000000"
        }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

        this.add.text(config.width / 2, config.height / 2 + 70, replayHintLabel, {
            fontSize: "30px",
            fill: "#aeb4ee",
            stroke: "#000000"
        }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

        postToHost({ type: "game-win" });

        // restart game
        this.input.keyboard.once("keydown-ENTER", () => {
            restartGame(this);
        });
    }

    // shoot function
    function shoot() {
        const bullet = bullets.create(player.x + 130, player.y + 20, "shoot");
        bullet.setScale(0.25);
        bullet.setVelocityX(450);
    }

    //create enemies
    function createAnts() {
        if (isGameOver) return;
        const ant = ants.create(config.width, 0, "ant");
        ant.body.setGravityY(200);
        ant.setVelocityX(-200);
        ant.anims.play("ant-walk", true);
        ant.setScale(0.50);
    }

    // movement
    function update() {
        if (isGameOver) return;

        const moveLeft = cursors.left.isDown || touchState.left;
        const moveRight = cursors.right.isDown || touchState.right;
        const jumpPressed = cursors.up.isDown || touchState.jump;
        const shootPressed = Phaser.Input.Keyboard.JustDown(spaceKey) || touchState.shoot;

        if (moveLeft) {
            player.setVelocityX(-200);
            player.anims.play("left", true);
        } else if (moveRight) {
            player.setVelocityX(200);
            player.anims.play("right", true);
        } else {
            player.setVelocityX(0);
            player.anims.play("turn");
        }

        if (jumpPressed) {
            player.setVelocityY(LADYBUG_JUMP_VELOCITY);
            player.anims.play("up", true);
            touchState.jump = false;
        }

        if (shootPressed) {
            shoot();
            touchState.shoot = false;
        }

        sky1.x -= 0.4;
        sky2.x -= 0.4;
        if (sky1.x < -config.width / 2) sky1.x = sky2.x + config.width;
        if (sky2.x < -config.width / 2) sky2.x = sky1.x + config.width;

        groundVis1.x -= 1.5;
        groundVis2.x -= 1.5;
        if (groundVis1.x < -config.width / 2) groundVis1.x = groundVis2.x + config.width;
        if (groundVis2.x < -config.width / 2) groundVis2.x = groundVis1.x + config.width;

        bullets.children.each((bullet) => {
            if (bullet.x < -50 || bullet.x > config.width + 50) {
                bullet.destroy();
            }
        });

        ants.children.each((ant) => {
            if (ant.x < -120) {
                ant.destroy();
            }
        });
    }

    return new Phaser.Game(config);
}
