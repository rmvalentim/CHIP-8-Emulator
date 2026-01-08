from chip8.memory import memory
from chip8.screen import screen

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

        self.execute_istructions(opcode)

        if self.delay_timer > 0:
            self.delay_timer -= self.delay_timer
        
        if self.sound_timer > 0:
            self.sound_timer -= self.sound_timer
    
    def render_display(self):
        screen.clear_screen()
        
        for y in range(32):
            for x in range(64):
                if self.display[y * 64 + x] == 1:
                    screen.draw_rect((x * screen.pixel_scale), 
                                     (y * screen.pixel_scale),
                                     screen.pixel_scale,
                                     screen.pixel_scale
                                     )

    def execute_istructions(self, opcode):

        x = (opcode & 0x0F00) >> 8
        y = (opcode & 0x00F0) >> 4
        n = opcode & 0x000F
        nn = opcode & 0x00FF
        nnn = opcode & 0x0FFF

        self.pc += 2

        print(hex(opcode))

cpu = Cpu()