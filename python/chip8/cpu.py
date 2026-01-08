from chip8.memory import memory

class Cpu:
    def __init__(self):
        self.V = bytearray(16)
        self.I = 0
        self.pc = 0x200
        self.stack = []
        self.sp = 0
        self.delay_timer = 0
        self.sound_timer = 0
        self.display = [0] * (64 * 32)
        self.keys = [0] * 16
        self.paused = False
        self.speed = 3

    def cpu_keydown(self, key):        
        if key is not None:
            self.keys[key] = 1
    
    def cpu_keyup(self, key):
        if key is not None:
            self.keys[key] = 0

    def cycle(self):
        opcode = (memory.read(self.pc) << 8) | memory.read(self.pc + 1)

        self.execute_instruction(opcode)

        if self.delay_timer > 0:
            self.delay_timer -= self.delay_timer
        
        if self.sound_timer > 0:
            self.sound_timer -= self.sound_timer
    

    def execute_instruction(self, opcode):
        print(opcode)

cpu = Cpu()