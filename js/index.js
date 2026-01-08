const canvas = document.querySelector("#canvas")

class Chip8 {

    constructor(canvas) {
        // Canvas
        this.canvas = canvas
        this.pixelScale = 20
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
        this.speed = 3

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

        // Key map - keypad
        this.keymap = {
            "1": 0x1, "2": 0x2, "3": 0x3, "4": 0xC,
            "q": 0x4, "w": 0x5, "e": 0x6, "r": 0xD,
            "a": 0x7, "s": 0x8, "d": 0x9, "f": 0xE,
            "z": 0xA, "x": 0x0, "c": 0xB, "v": 0xF
        }
    }

    // Mapped Key Down user input
    keyDown(event) {
        const key = this.keymap[event.key]
        if (key !== undefined) this.keys[key] = true
    }

    // Mapped Key Up user input
    keyUp(event) {
        const key = this.keymap[event.key]
        if (key !== undefined) this.keys[key] = false
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
            case 0x4000: {
                // Skip next instruction if V[x] !== NN
                if (this.V[x] !== nn) this.pc += 2
                break
            }
            case 0x5000: {
                if ((opcode & 0x000F) === 0x0) {
                    // Skip next instruction if V[x] = V[y]
                    if (this.V[x] === this.V[y]) this.pc += 2
                }
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
            case 0x8000: {
                switch (opcode & 0x000F) {
                    case 0x0000: {
                        // V[x] = V[y]
                        this.V[x] = this.V[y]
                        break
                    }
                    case 0x0001: {
                        // V[x] Bitwise OR V[y]
                        this.V[x] |= this.V[y]
                        break
                    }
                    case 0x0002: {
                        // V[x] Bitwise AND V[y]
                        this.V[x] &= this.V[y]
                        break
                    }
                    case 0x0003: {
                        // V[x] Bitwise XOR V[y]
                        this.V[x] ^= this.V[y]
                        break
                    }
                    case 0x0004: {
                        // V[x] + V[y] -> Carry
                        const sum = this.V[x] + this.V[y]
                        this.V[0xF] = sum > 0xFF ? 1 : 0
                        this.V[x] = sum & 0xFF
                        break
                    }
                    case 0x0005: {
                        // V[x] - V[y] -> Borrow
                        const sub = this.V[x] - this.V[y]
                        this.V[0xF] = sub < 0x0 ? 0 : 1
                        this.V[x] = sub & 0xFF
                        break
                    }
                    case 0x0006: {
                        // V[x] Right Shift -> Least signficant bit
                        this.V[0xF] = this.V[x] & 0x1
                        this.V[x] >>= 0x1
                        break
                    }
                    case 0x0007: {
                        // V[y] - V[x] -> Borrow
                        const sub = this.V[y] - this.V[x]
                        this.V[0xF] = sub < 0x0 ? 0 : 1
                        this.V[x] = sub & 0xFF
                        break
                    }
                    case 0x000E: {
                        // V[x] Left Shift -> Most signficant bit
                        this.V[0xF] = (this.V[x] >> 7) & 0x1
                        this.V[x] = (this.V[x] << 0x1) & 0xFF
                        break
                    }
                }
                break
            }
            case 0x9000: {
                if ((opcode & 0x000F) === 0x0) {
                    // Skip next instruction if V[x] != V[y]
                    if (this.V[x] !== this.V[y]) this.pc += 2
                }
                break
            }
            case 0xA000: {
                // Ser I = NNN
                this.I = nnn
                break
            }
            case 0xB000: {
                // Jump to address nnn + V[0]
                this.pc = nnn + this.V[0]
                break
            }
            case 0xC000: {
                // V[x] = Random number between 0 and 255 AND nn
                const random = Math.floor(Math.random() * 256)
                this.V[x] = random & nn
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
            case 0xE000: {
                if ((opcode & 0x00FF) === 0x009E) {
                    // Skip next instruction if key stored in V[x] is pressed
                    if (this.keys[this.V[x]]) this.pc += 2
                    break

                } else if ((opcode & 0x00FF) === 0x00A1) {
                    // Skip next instruction if key stored in V[x] is not pressed
                    if (!this.keys[this.V[x]]) this.pc += 2
                    break
                }
                break
            }
            case 0xF000: {
                switch (opcode & 0x00FF) {
                    case 0x0007: {
                        // V[x] = Delay Timer
                        this.V[x] = this.delayTimer
                        break
                    }
                    case 0x000A: {
                        const keyPressed = this.keys.findIndex(k => k === 1)
                        if (keyPressed !== -1) {
                            this.V[x] = keyPressed
                        } else {
                            this.pc -= 2
                        }
                        break
                    }
                    case 0x0015: {
                        // Delay Timer = V[x]
                        this.delayTimer = this.V[x]
                        break
                    }
                    case 0x0018: {
                        // Sound Timer = V[x]
                        this.soundTimer = this.V[x]
                        break
                    }
                    case 0x001E: {
                        // I = I + V[x]
                        this.I = this.I + this.V[x]
                        break
                    }
                    case 0x0029: {
                        // I = V[x] * 5
                        this.I = 0x050 + (this.V[x] * 5)
                        break

                    }
                    case 0x0033: {
                        // BCD representation of V[x] in memory at I, I+1 and I+2
                        const value = this.V[x]

                        this.memory[this.I] = Math.floor(value / 100)
                        this.memory[this.I + 1] = Math.floor((value % 100) / 10)
                        this.memory[this.I + 2] = value % 10
                        break

                    }
                    case 0x0055: {
                        // Store registers V[0] through V[x] in memory starting in I
                        for (let i = 0; i <= x; i++) {
                            this.memory[this.I + i] = this.V[i]
                        }
                        break

                    }
                    case 0x0065: {
                        // Read registers V[0] through V[x] from memory starting at I
                        for (let i = 0; i <= x; i++) {
                            this.V[i] = this.memory[this.I + i]
                        }
                        break
                    }

                }
                break
            }
            default: {
                console.log(`Unknown opcode: 0x${opcode.toString(16).toUpperCase()}`);
                break
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
0x12, 0x4E, 0xEA, 0xAC, 0xAA, 0xEA, 0xCE, 0xAA, 0xAA, 0xAE, 0xE0, 0xA0, 0xA0, 0xE0, 0xC0, 0x40,
0x40, 0xE0, 0xE0, 0x20, 0xC0, 0xE0, 0xE0, 0x60, 0x20, 0xE0, 0xA0, 0xE0, 0x20, 0x20, 0x60, 0x40,
0x20, 0x40, 0xE0, 0x80, 0xE0, 0xE0, 0xE0, 0x20, 0x20, 0x20, 0xE0, 0xE0, 0xA0, 0xE0, 0xE0, 0xE0,
0x20, 0xE0, 0x40, 0xA0, 0xE0, 0xA0, 0xE0, 0xC0, 0x80, 0xE0, 0xE0, 0x80, 0xC0, 0x80, 0xA0, 0x40,
0xA0, 0xA0, 0xA2, 0x02, 0xDA, 0xB4, 0x00, 0xEE, 0xA2, 0x02, 0xDA, 0xB4, 0x13, 0xDC, 0x68, 0x01,
0x69, 0x05, 0x6A, 0x0A, 0x6B, 0x01, 0x65, 0x2A, 0x66, 0x2B, 0xA2, 0x16, 0xD8, 0xB4, 0xA2, 0x3E,
0xD9, 0xB4, 0xA2, 0x02, 0x36, 0x2B, 0xA2, 0x06, 0xDA, 0xB4, 0x6B, 0x06, 0xA2, 0x1A, 0xD8, 0xB4,
0xA2, 0x3E, 0xD9, 0xB4, 0xA2, 0x06, 0x45, 0x2A, 0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x0B, 0xA2, 0x1E,
0xD8, 0xB4, 0xA2, 0x3E, 0xD9, 0xB4, 0xA2, 0x06, 0x55, 0x60, 0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x10,
0xA2, 0x26, 0xD8, 0xB4, 0xA2, 0x3E, 0xD9, 0xB4, 0xA2, 0x06, 0x76, 0xFF, 0x46, 0x2A, 0xA2, 0x02,
0xDA, 0xB4, 0x6B, 0x15, 0xA2, 0x2E, 0xD8, 0xB4, 0xA2, 0x3E, 0xD9, 0xB4, 0xA2, 0x06, 0x95, 0x60,
0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x1A, 0xA2, 0x32, 0xD8, 0xB4, 0xA2, 0x3E, 0xD9, 0xB4, 0x22, 0x42,
0x68, 0x17, 0x69, 0x1B, 0x6A, 0x20, 0x6B, 0x01, 0xA2, 0x0A, 0xD8, 0xB4, 0xA2, 0x36, 0xD9, 0xB4,
0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x06, 0xA2, 0x2A, 0xD8, 0xB4, 0xA2, 0x0A, 0xD9, 0xB4, 0xA2, 0x06,
0x87, 0x50, 0x47, 0x2A, 0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x0B, 0xA2, 0x2A, 0xD8, 0xB4, 0xA2, 0x0E,
0xD9, 0xB4, 0xA2, 0x06, 0x67, 0x2A, 0x87, 0xB1, 0x47, 0x2B, 0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x10,
0xA2, 0x2A, 0xD8, 0xB4, 0xA2, 0x12, 0xD9, 0xB4, 0xA2, 0x06, 0x66, 0x78, 0x67, 0x1F, 0x87, 0x62,
0x47, 0x18, 0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x15, 0xA2, 0x2A, 0xD8, 0xB4, 0xA2, 0x16, 0xD9, 0xB4,
0xA2, 0x06, 0x66, 0x78, 0x67, 0x1F, 0x87, 0x63, 0x47, 0x67, 0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x1A,
0xA2, 0x2A, 0xD8, 0xB4, 0xA2, 0x1A, 0xD9, 0xB4, 0xA2, 0x06, 0x66, 0x8C, 0x67, 0x8C, 0x87, 0x64,
0x47, 0x18, 0xA2, 0x02, 0xDA, 0xB4, 0x68, 0x2C, 0x69, 0x30, 0x6A, 0x34, 0x6B, 0x01, 0xA2, 0x2A,
0xD8, 0xB4, 0xA2, 0x1E, 0xD9, 0xB4, 0xA2, 0x06, 0x66, 0x8C, 0x67, 0x78, 0x87, 0x65, 0x47, 0xEC,
0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x06, 0xA2, 0x2A, 0xD8, 0xB4, 0xA2, 0x22, 0xD9, 0xB4, 0xA2, 0x06,
0x66, 0xE0, 0x86, 0x6E, 0x46, 0xC0, 0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x0B, 0xA2, 0x2A, 0xD8, 0xB4,
0xA2, 0x36, 0xD9, 0xB4, 0xA2, 0x06, 0x66, 0x0F, 0x86, 0x66, 0x46, 0x07, 0xA2, 0x02, 0xDA, 0xB4,
0x6B, 0x10, 0xA2, 0x3A, 0xD8, 0xB4, 0xA2, 0x1E, 0xD9, 0xB4, 0xA3, 0xE8, 0x60, 0x00, 0x61, 0x30,
0xF1, 0x55, 0xA3, 0xE9, 0xF0, 0x65, 0xA2, 0x06, 0x40, 0x30, 0xA2, 0x02, 0xDA, 0xB4, 0x6B, 0x15,
0xA2, 0x3A, 0xD8, 0xB4, 0xA2, 0x16, 0xD9, 0xB4, 0xA3, 0xE8, 0x66, 0x89, 0xF6, 0x33, 0xF2, 0x65,
0xA2, 0x02, 0x30, 0x01, 0xA2, 0x06, 0x31, 0x03, 0xA2, 0x06, 0x32, 0x07, 0xA2, 0x06, 0xDA, 0xB4,
0x6B, 0x1A, 0xA2, 0x0E, 0xD8, 0xB4, 0xA2, 0x3E, 0xD9, 0xB4, 0x12, 0x48, 0x13, 0xDC
]

chip8.loadRom(rom)

document.addEventListener("keydown", (event) => {
    chip8.keyDown(event)
})

document.addEventListener("keyup", (event) => {
    chip8.keyUp(event)
})


function run() {
    for (let i = 0; i < chip8.speed; i++) {
        chip8.cycle()
    }
    chip8.renderDisplay()
    requestAnimationFrame(run)
}
run()