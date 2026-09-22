import os
from PIL import Image, ImageDraw

os.makedirs('public/icons', exist_ok=True)

def create_yapu_icon(size):
    # Base image with dark night background
    img = Image.new('RGBA', (size, size), (11, 15, 25, 255))
    draw = ImageDraw.Draw(img)
    
    # Rounded border
    corner_radius = int(size * 0.22)
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=corner_radius,
        fill=(11, 15, 25, 255),
        outline=(245, 158, 11, 180), # Golden border
        width=max(2, int(size * 0.02))
    )
    
    # Chakana / Andean Cross proportions
    center = size // 2
    step = int(size * 0.12)
    
    # Chakana polygon coordinates
    # Center cross with stepped corners
    points = [
        # Top stepped head
        (center - step, center - 3 * step),
        (center + step, center - 3 * step),
        (center + step, center - 2 * step),
        (center + 2 * step, center - 2 * step),
        (center + 2 * step, center - step),
        # Right stepped arm
        (center + 3 * step, center - step),
        (center + 3 * step, center + step),
        (center + 2 * step, center + step),
        (center + 2 * step, center + 2 * step),
        (center + step, center + 2 * step),
        # Bottom stepped foot
        (center + step, center + 3 * step),
        (center - step, center + 3 * step),
        (center - step, center + 2 * step),
        (center - 2 * step, center + 2 * step),
        (center - 2 * step, center + step),
        # Left stepped arm
        (center - 3 * step, center + step),
        (center - 3 * step, center - step),
        (center - 2 * step, center - step),
        (center - 2 * step, center - 2 * step),
        (center - step, center - 2 * step),
    ]
    
    # Draw Chakana body (Terracotta)
    draw.polygon(points, fill=(185, 71, 0, 255), outline=(245, 158, 11, 255))
    
    # Center sacred portal (Circle: Aguayo Teal)
    portal_radius = int(size * 0.09)
    draw.ellipse(
        [
            (center - portal_radius, center - portal_radius),
            (center + portal_radius, center + portal_radius)
        ],
        fill=(13, 148, 136, 255), # Aguayo teal
        outline=(252, 211, 77, 255), # Light gold
        width=max(2, int(size * 0.02))
    )
    
    return img

icon_192 = create_yapu_icon(192)
icon_192.save('public/icons/icon-192.png', 'PNG')

icon_512 = create_yapu_icon(512)
icon_512.save('public/icons/icon-512.png', 'PNG')

print("Icons generated successfully!")
