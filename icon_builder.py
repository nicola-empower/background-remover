#!/usr/bin/env python3
"""
AuraUtils - App Icon & Favicon Builder
Created by Nicola Berry (https://nicolaberry.uk)

Takes a single high-resolution square image and automatically creates a complete
suite of icons for web and mobile platforms (favicon.ico, apple-touch-icon, manifest pngs).
"""

import argparse
import os
import sys
from PIL import Image

def build_icons(input_path, output_dir):
    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    try:
        img = Image.open(input_path)
    except Exception as e:
        print(f"Error opening image: {e}", file=sys.stderr)
        sys.exit(1)

    # Ensure the source image is square or warning the user
    if img.width != img.height:
        print("Warning: Source image is not square. The output icons may be distorted.")
        print(f"Source Dimensions: {img.width}x{img.height}")

    # Create the output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Generating icon suite from '{input_path}' into '{output_dir}'...\n")

    # Define standard sizes for web deployment
    # Format: (filename, size_tuple, format_string)
    icon_manifest = [
        ("favicon-16x16.png", (16, 16), "PNG"),
        ("favicon-32x32.png", (32, 32), "PNG"),
        ("apple-touch-icon.png", (180, 180), "PNG"),
        ("android-chrome-192x192.png", (192, 192), "PNG"),
        ("android-chrome-512x512.png", (512, 512), "PNG"),
    ]

    # 1. Generate individual PNG sizes
    for filename, size, fmt in icon_manifest:
        try:
            resized_img = img.resize(size, Image.Resampling.LANCZOS)
            dest_path = os.path.join(output_dir, filename)
            resized_img.save(dest_path, format=fmt)
            print(f"✓ Created: {filename} ({size[0]}x{size[1]})")
        except Exception as e:
            print(f"✗ Failed to create {filename}: {e}", file=sys.stderr)

    # 2. Generate standard multi-resolution favicon.ico
    # A proper .ico file contains multiple size layers (16x16, 32x32, 48x48) in one file
    try:
        ico_path = os.path.join(output_dir, "favicon.ico")
        ico_sizes = [(16, 16), (32, 32), (48, 48)]
        # We need to supply an initial icon or convert and call save
        img.save(ico_path, format="ICO", sizes=ico_sizes)
        print(f"✓ Created: favicon.ico (multi-resolution: 16px, 32px, 48px)")
    except Exception as e:
        print(f"✗ Failed to create favicon.ico: {e}", file=sys.stderr)

    # 3. Generate HTML header boilerplate to copy/paste
    html_boilerplate = f"""
<!-- Favicon Boilerplate for index.html -->
<link rel="apple-touch-icon" sizes="180x180" href="{output_dir}/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="{output_dir}/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="{output_dir}/favicon-16x16.png">
<link rel="shortcut icon" href="{output_dir}/favicon.ico">
"""
    
    print("\n--- HTML Header Boilerplate ---")
    print(html_boilerplate.strip())
    print("--------------------------------")
    
    # Save the boilerplate as a text file for easy reference
    try:
        txt_path = os.path.join(output_dir, "html_setup.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(html_boilerplate.strip())
        print(f"✓ Saved HTML setup instructions to: {output_dir}/html_setup.txt")
    except Exception as e:
         print(f"Warning: could not save instruction text file: {e}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(
        description="Build a complete set of web favicon & app icon sizes from a single source image."
    )
    parser.add_argument("-i", "--input", required=True, help="Path to high-resolution square logo image (PNG/JPEG)")
    parser.add_argument("-o", "--output", default="icons", help="Output folder to save generated icons (default: 'icons')")

    args = parser.parse_args()
    build_icons(args.input, args.output)

if __name__ == "__main__":
    main()
