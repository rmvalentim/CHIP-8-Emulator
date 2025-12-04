const canvas = document.querySelector("#canvas")

class Chip8 {
    constructor(canvas) {
        // Display
        this.canvas = canvas
        this.canvas.width = 640
        this.canvas.height = 320
        this.context = canvas.getContext("2d")
        this.context.fillStyle = "black"
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
}

const chip8 = new Chip8(canvas)