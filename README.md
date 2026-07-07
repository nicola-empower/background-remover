# AuraRemover & AuraUtils — Premium Image Background Eraser & Asset Toolkit

[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)](#)
[![Pillow Python](https://img.shields.io/badge/Python-Pillow-3776AB?logo=python&logoColor=white)](#)
[![Client Side](https://img.shields.io/badge/Privacy-100%25%20Local-2E6A4F?logo=securityscorecard&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-800020)](#)

AuraRemover & AuraUtils is a premium suite of client-side web and command-line tools for image background removal, optimisation, palette generation, icon building, and watermarking.
> The Reality:
  > Canva wants £12.99 per month and I was feeling stubborn.

<img width="2814" height="1516" alt="image" src="https://github.com/user-attachments/assets/33d32af5-6f09-4219-8d5b-5020c2a2aa6b" />

1. **Interactive Web App**: A stunning, lightweight, 100% client-side web application styled with a luxury cream and burgundy glassmorphism layout, featuring real-time background removal, threshold sliders, and eye-dropper tools.
2. **AuraUtils CLI Suite**: A collection of high-performance Python companion scripts using Pillow (`PIL`) for automated background removal, batch WebP compression, app icon building, color palette extraction, and image watermarking.

<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=rect&height=6&color=800020" />
</p>

## Features

### 1. Interactive Web Application
* **Zero Server Uploads**: Processing is executed entirely inside your browser using HTML5 Canvas. Your images never leave your machine—guaranteeing 100% privacy and instantaneous performance.
* **Flexible Uploads**: Drag and drop your images, select from the file system, or simply paste an image directly from your clipboard (**Ctrl+V**).
* **Multi-Mode Extraction**:
  * **Remove Dark Backgrounds**: Isolates gold medals, badges, logos, and glowing objects from solid black/dark backgrounds.
  * **Remove Light Backgrounds**: Quickly cleans up drawings, signatures, scanned documents, and objects with bright/white backdrops.
  * **Remove Custom Color**: Key out any chroma key shade or background color.
* **Linear Edge Smoothing (Fuzziness)**: Generates a soft alpha-feathered transition around edges to avoid harsh, pixelated lines.
* **Premium EyeDropper API**: Integrates the native browser eyedropper to sample color from anywhere on your monitor. Includes a manual on-canvas hover & click fallback for browsers that do not support it.
* **Themed Toast Notifications**: Animated glassmorphism toasts notify you upon successful upload and finished downloads.

### 2. Python CLI Script
* **Argument-Driven Interface**: Customize paths, extraction thresholds, fuzziness tolerances, and color codes right from your shell.
* **Pillow Integration**: Uses lightweight, stable, standard image libraries to perform exact pixel manipulations.

<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=rect&height=6&color=800020" />
</p>

## Visual Identity

The web interface is custom-tailored with a premium **light-mode cream and burgundy** editorial layout.
* **Cream Palette (`#FAF6F0`)**: A warm luxury background base.
* **Burgundy Accent (`#800020`)**: Elegant deep tones used for buttons, active state highlights, and brand logos.
* **Glassmorphism Panels**: Semi-transparent, blur-backed white containers with thin, high-contrast borders and glowing backing lights.
* **Editorial Fonts**: Headings utilize *Playfair Display* for a classic luxury press look, paired with *Plus Jakarta Sans* for clean, legible controls.

<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=rect&height=6&color=800020" />
</p>

## Getting Started

### 1. Running the Web Application
No installation, servers, or build steps required.
1. Download or clone this repository.
2. Navigate into the repository folder.
3. Open `index.html` in your favorite web browser (e.g. Double-click it, or drag it into Chrome/Edge/Safari/Firefox).
4. Upload an image, adjust your thresholds, and click **Download Transparent PNG**!

### 2. Running the Python CLI Tool
Perfect for terminal pipelines or developer scripts.

#### Prerequisites
Make sure you have python and `Pillow` installed:
```bash
pip install Pillow
```

#### Usage
Execute `remover.py` from your terminal:
```bash
python remover.py -i input.png -o output.png -m dark -t 30 -f 10
```

#### Parameter Breakdown:
| Flag | Name | Allowed Values | Default | Description |
|---|---|---|---|---|
| `-i`, `--input` | Input Path | *string* | (Required) | The source image file path. |
| `-o`, `--output`| Output Path | *string* | (Required) | Destination path for the saved transparent PNG. |
| `-m`, `--mode` | Mode | `dark`, `light`, `color` | `dark` | Background matching mode. |
| `-t`, `--threshold` | Threshold | `0` to `255` | `30` | Brightness limit (or color distance tolerance). |
| `-f`, `--fuzziness` | Fuzziness | `0` to `100` | `10` | Linear feathering width on transition boundaries. |
| `-c`, `--color` | Color Hex | *e.g. `#00FF00`* | `None` | Hex color code to target (required in `color` mode). |

### 3. Running Other Python CLI Utilities (`AuraUtils`)

#### A. WebP Batch Optimizer (`optimize.py`)
Converts JPEGs and PNGs in bulk into modern, compressed WebP files. Maintains aspect ratios with optional resizing limits.
```bash
# Convert a single image
python optimize.py -i input.png -q 85

# Batch optimize an entire folder and resize images to 800px width limit
python optimize.py -i ./images -w 800 -q 80 -o ./compressed
```

#### B. Dominant Color Palette Extractor (`palette.py`)
Analyzes an image and extracts its top dominant colors. Supports outputting values as plain text, CSS variables, JSON, or an elegant HTML preview card page.
```bash
# Print hex codes with visual color blocks in the console
python palette.py -i award_badge.png -n 5

# Export color variables directly as CSS variables
python palette.py -i award_badge.png -f css

# Generate a gorgeous HTML preview dashboard of colors side-by-side with the image
python palette.py -i award_badge.png -n 6 -f html
```

#### C. App Icon & Favicon Builder (`icon_builder.py`)
Creates a complete suite of browser favicons, apple touch icons, and manifest assets from a single square source image, outputting ready-to-copy HTML boilerplates.
```bash
python icon_builder.py -i logo_large.png -o output_icons
```

#### D. Bulk Image Watermarker (`watermark.py`)
Applies customizable text or logo-based overlays onto a single image or an entire folder of images with adjustable margins, corners, and opacity settings.
```bash
# Apply a text watermark in the bottom-right corner at 40% opacity
python watermark.py -i photo.jpg -t "© 2026 Nicola Berry" -p bottom-right -a 0.4

# Overlay a transparent logo badge in the center at 25% opacity
python watermark.py -i ./gallery -l badge.png -p center -a 0.25
```

<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=rect&height=6&color=800020" />
</p>

## File Structure

```text
background-remover/
├── index.html        # Main HTML application layout
├── style.css         # Custom cream, burgundy, & glassmorphism stylesheets
├── app.js            # JavaScript canvas-processing engine & UI handler
├── remover.py        # Background remover CLI script
├── optimize.py       # WebP optimizer & image compressor CLI script
├── palette.py        # Dominant color palette extractor CLI script
├── icon_builder.py   # Favicon and App Icon builder CLI script
├── watermark.py      # Text & Logo watermarking CLI script
└── README.md         # Documentation & guide
```

<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=rect&height=6&color=800020" />
</p>

## License

This project is licensed under the MIT License. Feel free to use, copy, modify, distribute, or incorporate it into your personal and commercial ventures.

<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=rect&height=6&color=800020" />
</p>

## Credits

Created by **[Nicola Berry](https://nicolaberry.uk)**. 

If you like this project, feel free to visit my website or star this repository!
