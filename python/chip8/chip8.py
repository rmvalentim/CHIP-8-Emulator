from chip8.cpu import Cpu
from chip8.memory import Memory
from chip8.fontset import FontSet
from chip8.keyboard import Keyboard
from chip8.screen import Screen

class Chip8:
    def __init__(self):
        self.cpu = Cpu()
        self.memory = Memory()
        self.font_set = FontSet()
        self.keyboard = Keyboard()
        self.screen = Screen()
        self.running = True        

    def run(self):
        while self.running:
            for event in self.screen.pygame.event.get():
                if event.type == self.screen.pygame.QUIT:
                    self.running = False
                
                if event.type == self.screen.pygame.KEYDOWN:
                    self.keyboard.keydown(event.key)

                if event.type == self.screen.pygame.KEYUP:
                    self.keyboard.keyup(event.key)

            # Test draw rect
            # self.screen.pygame.draw.rect(self.screen.surface,"red", (20, 10, 204, 20))         
            
            self.screen.pygame.display.flip()