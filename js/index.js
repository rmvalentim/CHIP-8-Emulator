const canvas = document.querySelector("#canvas")

class Chip8 {

    constructor(canvas) {
        // Canvas
        this.canvas = canvas
        this.pixelScale = 10
        this.canvas.width = 64 * this.pixelScale
        this.canvas.height = 32 * this.pixelScale
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

        // Fontset
        this.fontset = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F

        ]

        // Load fontset into memory 0x050 to 0x09F
        for (let i = 0; i < this.fontset.length; i++) {
            this.memory[0x050 + i] = this.fontset[i]
        }
    }

    // Load Rom to memory - Starting at 0x200
    loadRom(rom) {
        for (let i = 0; i < rom.length; i++) {
            this.memory[0x200 + i] = rom[i]
        }
    }

    // CPU Cycle
    cycle() {
        // Fetch Opcode - Combine first and second byte to generate Chip8 16 bits Opcode
        const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1]

        // Decode and execute corresponding instruction
        this.executeInstruction(opcode)

        if (this.delayTimer > 0) this.delayTimer--
        if (this.soundTimer > 0) this.soundTimer--

    }

    executeInstruction(opcode) {
        const x = (opcode & 0x0F00) >> 8
        const y = (opcode & 0x00F0) >> 4
        const n = opcode & 0x000F
        const nn = opcode & 0x00FF
        const nnn = opcode & 0x0FFF

        // Increment program counter
        this.pc += 2

        switch (opcode & 0xF000) {
            case 0x000:
                if (opcode === 0x00E0) {
                    // Clear the display
                    this.display.fill(0)
                } else if (opcode === 0x00EE) {
                    // Return from a subroutine
                    this.pc = this.stack.pop()
                }
                break
            case 0x1000: {
                // Jump to address NNN
                this.pc = nnn
                break
            }
            case 0x2000: {
                // Call subroutine at NNN
                this.stack.push(this.pc)
                this.pc = nnn
                break
            }
            case 0x3000: {
                // Skip next instruction if V[x] == NN
                if (this.V[x] === nn) this.pc += 2
                break
            }
            case 0x6000: {
                // Set V[x] = NN
                this.V[x] = nn
                break
            }
            case 0x7000: {
                // Add NN to V[x]
                this.V[x] = (this.V[x] + nn) & 0xFF
                break
            }
            case 0xA000: {
                // Ser I = NNN
                this.I = nnn
                break
            }
            case 0xD000: {
                // Draw sprint at (V[x], V[y]) with width 8 and height N
                const vx = this.V[x]
                const vy = this.V[y]
                const height = n

                // Reset collision flag
                this.V[0xF] = 0

                for (let row = 0; row < height; row++) {
                    const sprite = this.memory[this.I + row]
                    for (let col = 0; col < 8; col++) {
                        const pixel = (sprite >> (7 - col)) & 1
                        const index = ((vy + row) % 32) * 64 + ((vx + col) % 64)

                        if (pixel && this.display[index] === 1) {
                            // Collision detected
                            this.V[0xF] = 1
                        }
                        this.display[index] ^= pixel
                    }
                }
                break
            }
            default: {
                console.log("Unknown opcode")
            }
        }
    }

    renderDisplay() {
        this.context.fillStyle = "black"
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.context.fillStyle = "#33FF00"
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 64; x++) {
                if (this.display[y * 64 + x] === 1) {
                    this.context.fillRect(
                        x * this.pixelScale,
                        y * this.pixelScale,
                        this.pixelScale,
                        this.pixelScale
                    )
                }
            }
        }
    }
}

const chip8 = new Chip8(canvas)

const rom = [
    0x00, 0xE0, 0xA2, 0x2A, 0x60, 0x0C, 0x61, 0x08, 0xD0, 0x1F, 0x70, 0x09, 0xA2, 0x39, 0xD0, 0x1F,
    0xA2, 0x48, 0x70, 0x08, 0xD0, 0x1F, 0x70, 0x04, 0xA2, 0x57, 0xD0, 0x1F, 0x70, 0x08, 0xA2, 0x66,
    0xD0, 0x1F, 0x70, 0x08, 0xA2, 0x75, 0xD0, 0x1F, 0x12, 0x28, 0xFF, 0x00, 0xFF, 0x00, 0x3C, 0x00,
    0x3C, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0xFF, 0x00, 0xFF, 0xFF, 0x00, 0xFF, 0x00, 0x38, 0x00, 0x3F,
    0x00, 0x3F, 0x00, 0x38, 0x00, 0xFF, 0x00, 0xFF, 0x80, 0x00, 0xE0, 0x00, 0xE0, 0x00, 0x80, 0x00,
    0x80, 0x00, 0xE0, 0x00, 0xE0, 0x00, 0x80, 0xF8, 0x00, 0xFC, 0x00, 0x3E, 0x00, 0x3F, 0x00, 0x3B,
    0x00, 0x39, 0x00, 0xF8, 0x00, 0xF8, 0x03, 0x00, 0x07, 0x00, 0x0F, 0x00, 0xBF, 0x00, 0xFB, 0x00,
    0xF3, 0x00, 0xE3, 0x00, 0x43, 0xE0, 0x00, 0xE0, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80,
    0x00, 0xE0, 0x00, 0xE0
]

chip8.loadRom(rom)

function run() {
    for (let i = 0; i < chip8.speed; i++) {
        chip8.cycle()
    }
    chip8.renderDisplay()
    requestAnimationFrame(run)
}
run()