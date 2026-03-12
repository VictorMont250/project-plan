import * as Phaser from "../../node_modules/phaser/dist/phaser.esm.js";

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 650,
    physics: {
        default: "arcade",
        arcade:{
            gravity: { y: 300},
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

//shooting vars
let spaceKey;
let bullets;

const game = new Phaser.Game(config);


function preload() {
    
    this.load.image("ground", "../../packages/assets/grass.png");
    this.load.image("shoot", "../../packages/assets/shoot.png");
    this.load.spritesheet("ladybug", 
        "../../packages/assets/ladybug.png", {
            frameWidth: 300, frameHeight: 210
        });
}

function create() {

    // Stretch a static ground body across the full game width.
    ground = this.physics.add.staticImage(600, 600, "ground").setScale(2).refreshBody();
    ground.displayWidth = config.width;
    ground.displayHeight = 100;

    player = this.physics.add.sprite(300, 250, "ladybug");    
    // Adjust the main character size will be useful for the main enemy
    // player.displayHeight = 500;
    // player.displayWidth = 200;
    //player.setBounce(0.5);
    player.setCollideWorldBounds(true);
    player.body.setGravityY(200);
    

    this.physics.add.collider(player, ground);

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
        frames: this.anims.generateFrameNumbers('ladybug', { start: 3, end: 5 }),
        frameRate: 5,
        repeat: 2
    });


    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

// shoot function
function shoot() {
    const bullet = bullets.create(player.x + 130, player.y +20, "shoot");
    bullet.setScale(0.25);
    bullet.setVelocityX(450);
}

// movement
function update() {

     if(cursors.left.isDown){
        player.setVelocityX(100 * -1);
        player.anims.play('left', true);
    } else if (cursors.right.isDown){
        player.setVelocityX(100);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown){
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

}