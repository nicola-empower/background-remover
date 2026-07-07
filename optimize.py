#!/usr/bin/env python3
"""
AuraUtils - WebP Batch Optimizer
Created by Nicola Berry (https://nicolaberry.uk)

Converts a directory or specific image files into highly optimized WebP images,
with options for resizing, custom compression quality, and directory scanning.
"""

import argparse
import os
import sys
from PIL import Image

def get_size_format(b, factor=1024, suffix="B"):
    for unit in ["", "K", "M", "G", "T", "P"]:
        if b < factor:
            return f"{b:.2f}{unit}{suffix}"
        b /= factor
    return f"{b:.2f}Y{suffix}"

def optimize_image(filepath, output_dir, quality, max_width=None):
    try:
        img = Image.open(filepath)
        filename = os.path.basename(filepath)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(output_dir, f"{name}.webp")

        # Handle color modes (WebP needs RGB or RGBA)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")

        # Handle resizing while maintaining aspect ratio
        if max_width and img.width > max_width:
            ratio = max_width / float(img.width)
            new_height = int(float(img.height) * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # Save as WebP
        img.save(output_path, "WEBP", quality=quality)
        
        # Calculate file size savings
        orig_size = os.path.getsize(filepath)
        new_size = os.path.getsize(output_path)
        savings = orig_size - new_size
        pct = (savings / orig_size) * 100 if orig_size > 0 else 0

        print(f"✓ Optimized: {filename}")
        print(f"  └ Size: {get_size_format(orig_size)} → {get_size_format(new_size)} ({pct:.1f}% saved)")
        return orig_size, new_size
    except Exception as e:
        print(f"✗ Failed to optimize {filepath}: {e}", file=sys.stderr)
        return 0, 0

def main():
    parser = argparse.ArgumentParser(
        description="Convert JPEGs/PNGs into highly optimized WebP assets with optional resizing."
    )
    parser.add_argument("-i", "--input", required=True, help="Input file path or directory containing images")
    parser.add_argument("-o", "--output", help="Output directory (defaults to input directory or adjacent folder)")
    parser.add_argument("-q", "--quality", type=int, default=80, help="WebP compression quality 1-100 (default: 80)")
    parser.add_argument("-w", "--width", type=int, help="Optional maximum width to resize to (maintains aspect ratio)")
    
    args = parser.parse_args()

    # Determine input type
    if os.path.isdir(args.input):
        input_dir = args.input
        files = [
            os.path.join(input_dir, f) for f in os.listdir(input_dir)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"))
        ]
        output_dir = args.output if args.output else os.path.join(input_dir, "optimized")
    elif os.path.isfile(args.input):
        files = [args.input]
        output_dir = args.output if args.output else os.path.dirname(args.input) or "."
    else:
        print(f"Error: Path '{args.input}' is neither a file nor a directory.", file=sys.stderr)
        sys.exit(1)

    if not files:
        print("No supported images found to optimize.", file=sys.stderr)
        sys.exit(0)

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Optimizing {len(files)} image(s) to '{output_dir}'...")
    print(f"Settings: Quality={args.quality}%, MaxWidth={args.width if args.width else 'Original'}\n")

    total_orig = 0
    total_new = 0

    for filepath in files:
        orig, new = optimize_image(filepath, output_dir, args.quality, args.width)
        total_orig += orig
        total_new += new

    if total_orig > 0:
        overall_savings = total_orig - total_new
        overall_pct = (overall_savings / total_orig) * 100
        print("\n--- Summary ---")
        print(f"Total files: {len(files)}")
        print(f"Total space saved: {get_size_format(overall_savings)} (Reduced by {overall_pct:.1f}%)")

if __name__ == "__main__":
    main()
