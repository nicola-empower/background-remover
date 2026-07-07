#!/usr/bin/env python3
"""
AuraUtils - Bulk Image Watermarker
Created by Nicola Berry (https://nicolaberry.uk)

Applies text or image-based watermarks onto a single image or an entire folder,
supporting custom opacity, positional layouts, and margins.
"""

import argparse
import os
import sys
from PIL import Image, ImageDraw, ImageFont

def get_font(font_path, font_size):
    # Try custom path first
    if font_path and os.path.exists(font_path):
        try:
            return ImageFont.truetype(font_path, font_size)
        except Exception:
            pass

    # Try common system paths
    system_fonts = []
    if sys.platform == "win32":
        system_fonts = [
            "C:\\Windows\\Fonts\\arial.ttf",
            "C:\\Windows\\Fonts\\segoeui.ttf",
            "C:\\Windows\\Fonts\\tahoma.ttf"
        ]
    elif sys.platform == "darwin": # macOS
        system_fonts = [
            "/Library/Fonts/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc"
        ]
    else: # Linux / other
        system_fonts = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/TTF/DejaVuSans.ttf"
        ]

    for f in system_fonts:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, font_size)
            except Exception:
                continue

    # Fallback to default
    return ImageFont.load_default()

def calculate_position(img_w, img_h, mark_w, mark_h, position, margin):
    if position == "top-left":
        return (margin, margin)
    elif position == "top-right":
        return (img_w - mark_w - margin, margin)
    elif position == "bottom-left":
        return (margin, img_h - mark_h - margin)
    elif position == "bottom-right":
        return (img_w - mark_w - margin, img_h - mark_h - margin)
    elif position == "center":
        return ((img_w - mark_w) // 2, (img_h - mark_h) // 2)
    return (margin, margin)

def apply_watermark(filepath, output_dir, watermark_text=None, logo_path=None, 
                    opacity=0.3, position="bottom-right", margin=20, 
                    font_path=None, font_size=32):
    try:
        base_img = Image.open(filepath).convert("RGBA")
        width, height = base_img.size
        
        # Create transparent canvas for watermark overlay
        watermark_layer = Image.new("RGBA", base_img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(watermark_layer)

        if logo_path:
            # Image Logo Watermark
            if not os.path.exists(logo_path):
                print(f"Error: Logo file '{logo_path}' not found.", file=sys.stderr)
                return False

            logo = Image.open(logo_path).convert("RGBA")
            
            # Scale logo if it's too large compared to base image
            max_logo_width = int(width * 0.25)
            if logo.width > max_logo_width:
                logo_ratio = max_logo_width / float(logo.width)
                logo_h = int(logo.height * logo_ratio)
                logo = logo.resize((max_logo_width, logo_h), Image.Resampling.LANCZOS)

            # Apply opacity to logo
            r, g, b, a = logo.split()
            # Scale alpha channel by opacity parameter
            a = a.point(lambda p: int(p * opacity))
            logo = Image.merge("RGBA", (r, g, b, a))

            x, y = calculate_position(width, height, logo.width, logo.height, position, margin)
            watermark_layer.paste(logo, (x, y))

        elif watermark_text:
            # Text Watermark
            font = get_font(font_path, font_size)
            
            # Get text bounding box size
            try:
                # Modern Pillow API
                left, top, right, bottom = draw.textbbox((0, 0), watermark_text, font=font)
                text_w = right - left
                text_h = bottom - top
            except AttributeError:
                # Legacy fallback
                text_w, text_h = draw.textsize(watermark_text, font=font)

            x, y = calculate_position(width, height, text_w, text_h, position, margin)
            
            # Draw semi-transparent text (white color with opacity-scaled alpha)
            alpha_val = int(255 * opacity)
            draw.text((x, y), watermark_text, font=font, fill=(255, 255, 255, alpha_val))
            
            # Optional: draw subtle text shadow for readability on white images
            # (black text offset by 1 pixel in each direction)
            shadow_alpha = int(128 * opacity)
            draw.text((x+1, y+1), watermark_text, font=font, fill=(0, 0, 0, shadow_alpha))
            draw.text((x, y), watermark_text, font=font, fill=(255, 255, 255, alpha_val))

        # Merge layers
        combined = Image.alpha_composite(base_img, watermark_layer)
        
        # Save as PNG
        filename = os.path.basename(filepath)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(output_dir, f"watermarked_{name}.png")
        combined.save(output_path, "PNG")
        
        print(f"✓ Watermarked: {filename}")
        return True
    except Exception as e:
        print(f"✗ Failed to watermark {filepath}: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(
        description="Overlay a text watermark or image logo onto a single image or folder of images."
    )
    parser.add_argument("-i", "--input", required=True, help="Input image file or directory of images")
    parser.add_argument("-o", "--output", help="Output directory to save watermarked PNGs")
    
    # Watermark content selection
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("-t", "--text", help="Watermark text (e.g. '© 2026 Nicola Berry')")
    group.add_argument("-l", "--logo", help="Path to image logo file (PNG suggested for transparency)")
    
    # Customizations
    parser.add_argument("-p", "--position", choices=["top-left", "top-right", "bottom-left", "bottom-right", "center"], default="bottom-right", help="Watermark position")
    parser.add_argument("-a", "--opacity", type=float, default=0.3, help="Watermark opacity from 0.0 to 1.0 (default: 0.3)")
    parser.add_argument("-m", "--margin", type=int, default=20, help="Margin from image edge in pixels")
    parser.add_argument("-s", "--size", type=int, default=32, help="Font size for text watermark (default: 32)")
    parser.add_argument("-f", "--font", help="Path to custom TTF font file")

    args = parser.parse_args()

    # Determine input files
    if os.path.isdir(args.input):
        files = [
            os.path.join(args.input, f) for f in os.listdir(args.input)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"))
        ]
        output_dir = args.output if args.output else os.path.join(args.input, "watermarked")
    elif os.path.isfile(args.input):
        files = [args.input]
        output_dir = args.output if args.output else os.path.dirname(args.input) or "."
    else:
        print(f"Error: Path '{args.input}' is neither a file nor a directory.", file=sys.stderr)
        sys.exit(1)

    if not files:
        print("No supported images found to watermark.", file=sys.stderr)
        sys.exit(0)

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Watermarking {len(files)} image(s) to '{output_dir}'...")
    print(f"Position={args.position}, Opacity={args.opacity * 100}%\n")

    success_count = 0
    for filepath in files:
        if apply_watermark(
            filepath, output_dir, 
            watermark_text=args.text, 
            logo_path=args.logo, 
            opacity=args.opacity, 
            position=args.position, 
            margin=args.margin, 
            font_path=args.font, 
            font_size=args.size
        ):
            success_count += 1

    print(f"\nDone! Watermarked {success_count}/{len(files)} images successfully.")

if __name__ == "__main__":
    main()
