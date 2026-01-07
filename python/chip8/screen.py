import pygame

class Screen:

    def __init__(self):
        print("Screen initialized")
        self.pixel_scale = 20
        self.width = 64 * self.pixel_scale
        self.height = 32 * self.pixel_scale
        self.background_color = "black"
        self.font_color = (51, 255, 0)

        self.pygame = pygame
        self.pygame.init()
        self.pygame.display.set_caption("Chip 8 | Rafael Valentim")
        self.screen = self.pygame.display.set_mode((self.width, self.height))
        self.screen.fill(self.background_color)
        self.surface = self.pygame.display.get_surface()

        self.clock = self.pygame.time.Clock()

    def draw_rect(self, x, y, width, height):
        self.pygame.draw.rect(self.surface, self.font_color, (x, y, width, height))