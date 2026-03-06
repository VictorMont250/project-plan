const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: "arcade"
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player;
let cursors;

const game = new Phaser.Game(config);

function preload() {
    this.load.image("player", "../../packages/assets/ladybug.png");
}

function create() {
    player = this.physics.add.sprite(200, 300, "player");

    cursors = this.input.keyboard.createCursorKeys();
}

function update() {

    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-200);
    }

    if (cursors.right.isDown) {
        player.setVelocityX(200);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-200);
    }

    if (cursors.down.isDown) {
        player.setVelocityY(200);
    }
}