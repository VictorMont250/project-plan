import * as Phaser from "../../node_modules/phaser/dist/phaser.esm.js";

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 650,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player;
let cursors;
let ground;
let antGround;
let sky1, sky2;
let groundVis1, groundVis2;

const ANT_GROUND_COLLISION_OFFSET_Y = 90;

//shooting
let spaceKey;
let bullets;

//enemys
let ants;
let ant2;

// HUD
let lives = 3;
let livesIcons = [];
let score = 0;
let scoreText;
let isInvincible = false;
let isGameOver = false;

const game = new Phaser.Game(config);


function preload() {
    this.load.image('sky', "../../packages/assets/sky.png"
    );
    this.load.image("ground", "../../packages/assets/grass.png");
    this.load.image("shoot", "../../packages/assets/shoot.png");
    this.load.image("lives", "../../packages/assets/lives.png");
    this.load.spritesheet("ladybug",
        "../../packages/assets/ladybug.png", {
        frameWidth: 320, frameHeight: 210
    });

    // ant spring
    this.load.spritesheet("ant",
        "../../packages/assets/ant.png", {
        frameWidth: 300, frameHeight: 262
    });
}

function create() {
    // sky simulate infinite scroll
    sky1 = this.add.image(config.width / 2, config.height / 2, 'sky')
        .setDisplaySize(config.width, config.height).setDepth(-1);
    sky2 = this.add.image(config.width + config.width / 2, config.height / 2, 'sky')
        .setDisplaySize(config.width, config.height).setDepth(-1);

    // ground strips (scroll)
    groundVis1 = this.add.image(config.width / 2, config.height - 50, 'ground')
        .setDisplaySize(config.width, 100).setDepth(0);
    groundVis2 = this.add.image(config.width + config.width / 2, config.height - 50, 'ground')
        .setDisplaySize(config.width, 100).setDepth(0);

    // physics collider for the ladybug
    ground = this.physics.add.staticImage(config.width / 2, config.height - 50, "ground");
    ground.displayWidth = config.width;
    ground.displayHeight = 100;
    ground.setVisible(false);
    ground.refreshBody();
    ground.body.setOffset(0, 0);

    // ants collition with visual ground.
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
    player.body.setGravityY(200);
    player.setScale(0.5);



    // ant2 = this.physics.add.sprite(800, 0, "ant");    
    // ant2.setCollideWorldBounds(true);
    // ant2.body.setGravityY(200);
    // enemies
    ants = this.physics.add.group();
    this.physics.add.collider(ants, antGround);
    this.time.addEvent({
        delay: 5000,
        callback: createAnts,
        callbackScope: this,
        loop: true
    });


    // shot creation
    bullets = this.physics.add.group({
        allowGravity: false
    });

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('ladybug', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'ladybug', frame: 0 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('ladybug', { start: 2, end: 0 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('ladybug', { start: 3, end: 4 }),
        frameRate: 5,
        repeat: 2
    });

    this.anims.create({
        key: 'ant-walk',
        // frames: this.anims.generateFrameNumbers('ant', { start: 0, end: 3 }),
        // frameRate: 10,
        // Keep only walk-cycle frames; later frames are non-walk poses.
        frames: this.anims.generateFrameNumbers('ant', { frames: [0, 1, 2, 3, 4, 3, 2, 1] }),
        frameRate: 5,
        repeat: -1
    });


    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // lives icons
    lives = 3;
    livesIcons = [];
    isInvincible = false;
    for (let i = 0; i < lives; i++) {
        const icon = this.add.image(30 + i * 50, 30, 'lives')
            .setScale(0.12)
            .setDepth(10)
            .setScrollFactor(0);
        livesIcons.push(icon);
    }

    // score
    score = 0;
    scoreText = this.add.text(config.width - 20, 15, 'Score: 0', {
        fontSize: '26px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    // kill ant
    this.physics.add.overlap(bullets, ants, bulletHitAnt, null, this);

    // Ant hits ladybug
    this.physics.add.overlap(player, ants, hitPlayer, null, this);
}

// bullet hits ant
function bulletHitAnt(bullet, ant) {
    bullet.destroy();
    ant.destroy();
    score++;
    scoreText.setText('Score: ' + score);
}

// ant hit ladybug
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
    ants.children.each(a => a.setVelocity(0, 0));

    // transparent overlay
    this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0x000000, 0.6)
        .setDepth(20).setScrollFactor(0);

    this.add.text(config.width / 2, config.height / 2 - 80, 'GAME OVER', {
        fontSize: '72px',
        fill: '#ff2222',
        fontStyle: 'bold',
        stroke: '#000000'
    }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    this.add.text(config.width / 2, config.height / 2, 'Score: ' + score, {
        fontSize: '36px',
        fill: '#ffffff',
        stroke: '#000000'
    }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    this.add.text(config.width / 2, config.height / 2 + 70, 'Press ENTER to play again', {
        fontSize: '30px',
        fill: '#aeb4ee',
        stroke: '#000000'
    }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    // restart game
    this.input.keyboard.once('keydown-ENTER', () => {
        isGameOver = false;
        this.scene.restart();
    });
}

// shoot function
function shoot() {
    const bullet = bullets.create(player.x + 130, player.y + 20, "shoot");
    bullet.setScale(0.25);
    bullet.setVelocityX(450);
}


//create enemy
function createAnts() {
    const ant = ants.create(config.width, 0, "ant");
    ant.body.setGravityY(200);
    ant.setVelocityX(-120);
    ant.anims.play('ant-walk', true);
    ant.setScale(0.50);
}


// movement
function update() {
    if (isGameOver) return;

    if (cursors.left.isDown) {
        player.setVelocityX(200 * -1);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-400);
        player.anims.play('up', true);
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        shoot();
    }

    // scroll sky and ground panels
    sky1.x -= 0.4;  sky2.x -= 0.4;
    if (sky1.x < -config.width / 2) sky1.x = sky2.x + config.width;
    if (sky2.x < -config.width / 2) sky2.x = sky1.x + config.width;

    groundVis1.x -= 1.5;  groundVis2.x -= 1.5;
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