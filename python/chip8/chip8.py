from chip8.cpu import Cpu
from chip8.memory import Memory
from chip8.fontset import FontSet
from chip8.keyboard import Keyboard
from chip8.screen import Screen

class Chip8:
    def __init__(self):
        print("Chip 8 Initializing")
        self.cpu = Cpu()
        self.memory = Memory()
        self.font_set = FontSet()
        self.keyboard = Keyboard()
        self.screen = Screen()
        print("Chip 8 Initialized")