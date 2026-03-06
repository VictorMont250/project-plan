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

const game = new Phaser.Game(config);


function preload() {
    
    this.load.image("ground", "../../packages/assets/grass.png");
    this.load.spritesheet("ladybug", 
        "../../packages/assets/ladybug.png", {
            frameWidth: 290, frameHeight: 600
        });
}

function create() {

    // Stretch a static ground body across the full game width.
    ground = this.physics.add.staticImage(600, 600, "ground").setScale(2).refreshBody();
    ground.displayWidth = config.width;
    ground.displayHeight = 100;

    player = this.physics.add.sprite(0, 280, "ladybug");    
    //player.setBounce(0.5);
    player.setCollideWorldBounds(true);
    player.body.setGravityY(200);
    

    this.physics.add.collider(player, ground);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('ladybug', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'ladybug', frame: 2 }],
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


    cursors = this.input.keyboard.createCursorKeys();
}

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
        player.setVelocityY(-100);
        player.anims.play('up', true);    
    }

}