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

const ANT_GROUND_COLLISION_OFFSET_Y = 90;

//shooting
let spaceKey;
let bullets;

//enemys
let ants;
let ant2;

const game = new Phaser.Game(config);


function preload() {
    this.load.image('sky', "../../packages/assets/sky.png"
    );
    this.load.image("ground", "../../packages/assets/grass.png");
    this.load.image("shoot", "../../packages/assets/shoot.png");
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
    this.add
        .image(config.width / 2, config.height / 2, 'sky')
        .setDisplaySize(config.width, config.height)
        .setDepth(-1);

    // Stretch a static ground body across the full game width.
    ground = this.physics.add.staticImage(config.width / 2, config.height - 50, "ground");
    ground.displayWidth = config.width;
    ground.displayHeight = 100;
    ground.refreshBody();
    ground.body.setOffset(0, 0);

    // Separate collision plane for ants so their feet align with visual ground.
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