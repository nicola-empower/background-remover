#!/usr/bin/env python3
"""
AuraUtils - Dominant Color Palette Extractor
Created by Nicola Berry (https://nicolaberry.uk)

Analyzes an image and extracts its top dominant colors using Pillow's quantization.
Outputs palettes as Hex codes, CSS variables, JSON, or a visual HTML preview.
"""

import argparse
import os
import sys
from PIL import Image

def rgb_to_hex(r, g, b):
    return f"#{r:02X}{g:02X}{b:02X}"

def extract_palette(image_path, num_colors=5, output_format="text"):
    if not os.path.exists(image_path):
        print(f"Error: Input file '{image_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    try:
        img = Image.open(image_path)
    except Exception as e:
        print(f"Error opening image: {e}", file=sys.stderr)
        sys.exit(1)

    # Convert to RGB (quantization requires no transparency or standard RGB)
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Quantize the image to find dominant colors
    # Median Cut quantization is native to Pillow and very fast
    try:
        quantized = img.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT)
        palette_list = quantized.getpalette()
        
        # Extract RGB triplets
        colors = []
        for i in range(num_colors):
            r = palette_list[i*3]
            g = palette_list[i*3 + 1]
            b = palette_list[i*3 + 2]
            colors.append((r, g, b))
    except Exception as e:
        # Fallback to general pixel sampling if quantization fails
        print(f"Quantization fallback triggered: {e}", file=sys.stderr)
        # Resize to small size to aggregate colors
        small_img = img.resize((100, 100))
        pixels = list(small_img.getdata())
        # Tally counts
        counts = {}
        for p in pixels:
            counts[p] = counts.get(p, 0) + 1
        sorted_pixels = sorted(counts, key=counts.get, reverse=True)
        colors = sorted_pixels[:num_colors]

    hex_colors = [rgb_to_hex(*c) for c in colors]

    if output_format == "text":
        print(f"\n--- Extracted Colors ({num_colors}) ---")
        for idx, (rgb, hex_val) in enumerate(zip(colors, hex_colors)):
            # ANSI escape codes to show colored blocks in modern terminal shells
            ansi_block = f"\033[48;2;{rgb[0]};{rgb[1]};{rgb[2]}m  \033[0m"
            print(f"Color {idx + 1}: {ansi_block} {hex_val} | RGB: {rgb}")
        print()

    elif output_format == "css":
        print("/* Dominant Color Palette Extracted by AuraUtils */")
        print(":root {")
        for idx, hex_val in enumerate(hex_colors):
            print(f"  --color-{idx + 1}: {hex_val.lower()};")
        print("}")

    elif output_format == "json":
        import json
        palette_data = {
            "source": os.path.basename(image_path),
            "colors": [
                {"hex": hex_val, "rgb": rgb} 
                for hex_val, rgb in zip(hex_colors, colors)
            ]
        }
        print(json.dumps(palette_data, indent=2))

    elif output_format == "html":
        html_filename = f"palette_{os.path.basename(image_path)}.html"
        output_path = os.path.join(os.path.dirname(image_path) or ".", html_filename)
        
        # Build inline styles for visual card display
        color_cards = ""
        for idx, hex_val in enumerate(hex_colors):
            color_cards += f"""
            <div class="color-card">
              <div class="color-swatch" style="background-color: {hex_val};"></div>
              <div class="color-meta">
                <span class="color-hex">{hex_val}</span>
                <span class="color-rgb">RGB: {colors[idx]}</span>
              </div>
            </div>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Color Palette Generator — {os.path.basename(image_path)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #FAF6F0;
      color: #2C2523;
      margin: 0;
      padding: 3rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }}
    .container {{
      max-width: 800px;
      width: 100%;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(128, 0, 32, 0.1);
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
      border-radius: 16px;
      padding: 2.5rem;
      text-align: center;
    }}
    h1 {{
      font-size: 1.8rem;
      color: #800020;
      margin-bottom: 0.5rem;
    }}
    .subtitle {{
      color: #6E625F;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }}
    .palette-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 1.2rem;
      margin-bottom: 2rem;
    }}
    .color-card {{
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      border: 1px solid rgba(0,0,0,0.05);
      transition: transform 0.2s ease;
    }}
    .color-card:hover {{
      transform: translateY(-5px);
    }}
    .color-swatch {{
      height: 120px;
      width: 100%;
    }}
    .color-meta {{
      padding: 0.8rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }}
    .color-hex {{
      font-weight: 700;
      font-size: 0.95rem;
    }}
    .color-rgb {{
      font-size: 0.7rem;
      color: #6E625F;
    }}
    .image-preview {{
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      margin-top: 1rem;
    }}
  </style>
</head>
<body>
  <div class="container">
    <h1>AuraPalette Extractor</h1>
    <p class="subtitle">Dominant colors extracted from <strong>{os.path.basename(image_path)}</strong></p>
    
    <div class="palette-grid">
      {color_cards}
    </div>

    <div>
      <h3 style="color: #800020; margin-bottom: 1rem;">Source Image</h3>
      <img src="file:///{os.path.abspath(image_path)}" class="image-preview" alt="Source Preview">
    </div>
  </div>
</body>
</html>"""
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"✓ Visual palette page created successfully at: {html_filename}")

def main():
    parser = argparse.ArgumentParser(
        description="Extract dominant colors from any image to CSS, JSON, Text, or HTML previews."
    )
    parser.add_argument("-i", "--image", required=True, help="Path to the image file")
    parser.add_argument("-n", "--colors", type=int, default=5, help="Number of dominant colors to extract (default: 5)")
    parser.add_argument(
        "-f", "--format", 
        choices=["text", "css", "json", "html"], 
        default="text",
        help="Output format: 'text' (default), 'css' (root variables), 'json' (raw data), 'html' (visual preview web page)"
    )

    args = parser.parse_args()
    extract_palette(args.image, args.colors, args.format)

if __name__ == "__main__":
    main()
