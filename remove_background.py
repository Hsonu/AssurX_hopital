from PIL import Image

def make_transparent(img_path, output_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    # Inspect top-left pixel to get a reference background color
    ref_color = datas[0]
    print(f"Top-Left Pixel Color: {ref_color}")
    
    # We will make any pixel transparent that is close to the light grey/off-white background
    # Standard threshold for off-white background removal
    for item in datas:
        r, g, b, a = item
        # If the pixel is close to light grey (all R, G, B are greater than 200 and very close to each other)
        # or close to the reference top-left pixel color
        dist_to_ref = abs(r - ref_color[0]) + abs(g - ref_color[1]) + abs(b - ref_color[2])
        
        # Off-white threshold check
        is_bg = (r > 200 and g > 200 and b > 200 and abs(r-g) < 15 and abs(g-b) < 15 and abs(r-b) < 15)
        # Reference color proximity check
        is_near_ref = dist_to_ref < 35
        
        if is_bg or is_near_ref:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Successfully saved transparent image to {output_path}")

make_transparent(
    "c:/Users/SunAdmin/Desktop/SONU/New folder/site/AssurX_hopital/assets/smiling_specialist.png",
    "c:/Users/SunAdmin/Desktop/SONU/New folder/site/AssurX_hopital/assets/smiling_specialist.png"
)
