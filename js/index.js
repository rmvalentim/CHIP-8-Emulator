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
        const opcode = (this.memory[this.pc] << 8 ) | this.memory[this.pc + 1]

        // Decode and execute corresponding instruction
        this.executeInstruction(opcode)

        if(this.delayTimer > 0 ) this.delayTimer--
        if(this.soundTimer > 0 ) this.soundTimer-- 

    }

    executeInstruction(opcode) {
        return
    }
}

const chip8 = new Chip8(canvas)