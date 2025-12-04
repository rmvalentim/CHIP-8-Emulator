const canvas = document.querySelector("#canvas")

class Chip8 {
    constructor(canvas) {
        // Canvas
        this.canvas = canvas
        this.canvas.width = 640
        this.canvas.height = 320
        this.context = canvas.getContext("2d")
        this.context.fillStyle = "black"
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

        //Chip8 architeture
        this.memory = new Uint8Array(4096)
        this.V = new Uint8Array(16)
        this.I = 0
        this.pc = 0x200
        this.stack = []
        this.sp = 0
        this.delayTimer = 0
        this.soundTimer = 0
        this.display = new Array(64 * 32).fill(0)
        this.keys = new Array(16).fill(false)
        this.paused = false
        this.speed = 1        

    }
}

const chip8 = new Chip8(canvas)