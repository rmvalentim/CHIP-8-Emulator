class Memory:
    def __init__(self):
        self.ram = bytearray(4096)

    def read(self, address):
        return self.ram[address]
    
    def write(self, address, value):
        self.ram[address] = value