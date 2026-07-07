#!/usr/bin/env python3
"""
PNG Background Remover & Color Keyer
Created by Nicola Berry (https://nicolaberry.uk)

A CLI utility to remove backgrounds (dark, light, or specific colors) from images
and replace them with alpha transparency, with optional edge smoothing.
"""

import argparse
import os
import sys
from PIL import Image

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    if len(hex_str) != 6:
        raise ValueError(f"Invalid Hex color: {hex_str}")
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def remove_background(input_path, output_path, mode, threshold, fuzziness, color_hex=None):
    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Error opening image: {e}", file=sys.stderr)
        sys.exit(1)

    width, height = img.size
    pixels = img.load()

    target_rgb = None
    if mode == 'color':
        if not color_hex:
            print("Error: --color is required when mode is 'color'.", file=sys.stderr)
            sys.exit(1)
        try:
            target_rgb = hex_to_rgb(color_hex)
        except ValueError as e:
            print(e, file=sys.stderr)
            sys.exit(1)

    print(f"Processing '{input_path}'...")
    print(f"Dimensions: {width}x{height}")
    print(f"Settings: Mode={mode}, Threshold={threshold}, Fuzziness={fuzziness}")

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue

            # Calculate metric for matching
            match_value = 0
            is_match = False
            alpha_factor = 1.0

            if mode == 'dark':
                # Brightness is average of R, G, B
                brightness = (r + g + b) / 3.0
                # If brightness is below threshold, we want to remove it
                if brightness < threshold:
                    is_match = True
                    # Calculate alpha transition if fuzziness is specified
                    if fuzziness > 0 and threshold > 0:
                        # Pixels very close to threshold are semi-transparent
                        # Pixels far below threshold (close to 0) are fully transparent
                        distance = threshold - brightness
                        if distance < fuzziness:
                            alpha_factor = distance / fuzziness
                        else:
                            alpha_factor = 0.0
                    else:
                        alpha_factor = 0.0

            elif mode == 'light':
                brightness = (r + g + b) / 3.0
                # If brightness is above threshold, we want to remove it
                if brightness > threshold:
                    is_match = True
                    if fuzziness > 0 and (255 - threshold) > 0:
                        distance = brightness - threshold
                        if distance < fuzziness:
                            alpha_factor = distance / fuzziness
                        else:
                            alpha_factor = 0.0
                    else:
                        alpha_factor = 0.0

            elif mode == 'color':
                # Euclidean distance in RGB color space
                tr, tg, tb = target_rgb
                distance = ((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2) ** 0.5
                # Normalizing distance to [0, 255] (max possible distance is ~441.67)
                norm_distance = (distance / 441.67) * 255.0

                if norm_distance < threshold:
                    is_match = True
                    if fuzziness > 0 and threshold > 0:
                        # How close is it to the threshold?
                        # Near the threshold boundary: keep some alpha
                        # Deep inside the color range (low norm_distance): make transparent
                        # We calculate a transition from norm_distance 0 to threshold
                        # alpha_factor goes from 0 (very close to target color) to 1 (near threshold boundary)
                        boundary = threshold - norm_distance
                        if boundary < fuzziness:
                            alpha_factor = 1.0 - (boundary / fuzziness)
                        else:
                            alpha_factor = 0.0
                    else:
                        alpha_factor = 0.0

            if is_match:
                new_alpha = int(a * alpha_factor)
                # Keep original RGB, just change alpha
                pixels[x, y] = (r, g, b, new_alpha)

    try:
        img.save(output_path, "PNG")
        print(f"Success! Saved processed image to '{output_path}'")
    except Exception as e:
        print(f"Error saving image: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(
        description="Remove background (dark, light, or specific color) from an image, turning matches transparent."
    )
    parser.add_argument("-i", "--input", required=True, help="Path to input image file (e.g. award.png)")
    parser.add_argument("-o", "--output", required=True, help="Path to save the output PNG file")
    parser.add_argument(
        "-m", "--mode", 
        choices=["dark", "light", "color"], 
        default="dark",
        help="Background removal mode: 'dark' (removes dark colors/shadows), 'light' (removes whites/highlights), 'color' (removes custom hex color)"
    )
    parser.add_argument(
        "-t", "--threshold", 
        type=float, 
        default=30.0,
        help="Threshold (0 to 255). For dark mode, pixels with brightness < threshold are removed. Default is 30.0."
    )
    parser.add_argument(
        "-f", "--fuzziness", 
        type=float, 
        default=10.0,
        help="Fuzziness range for smooth alpha transitions at the threshold boundary (0 to 100). Default is 10.0. Use 0.0 for binary transparency."
    )
    parser.add_argument(
        "-c", "--color", 
        help="Target color hex code to remove (required for 'color' mode, e.g. '#00FF00' or 'FFFFFF')"
    )

    args = parser.parse_args()
    remove_background(args.input, args.output, args.mode, args.threshold, args.fuzziness, args.color)

if __name__ == "__main__":
    main()
