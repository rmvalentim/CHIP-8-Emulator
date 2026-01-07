from chip8.fontset import FontSet

class Memory:
    def __init__(self):
        self.ram = bytearray(4096)
        self.load_fontset()

    def read(self, address):
        return self.ram[address]
    
    def write(self, address, value):
        self.ram[address] = value

    def load_fontset(self):
        fontset = FontSet.data()
        for i in range(len(fontset)):
            self.ram[0x050 + i] = fontset[i]

    def load_rom(self, rom):
        for i in range(len(rom)):
            self.ram[0x200 + i] = rom[i]