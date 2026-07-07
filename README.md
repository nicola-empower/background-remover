# AuraRemover - Premium Image Background Eraser & Colour Keyer

[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)](#)
[![Pillow Python](https://img.shields.io/badge/Python-Pillow-3776AB?logo=python&logoColor=white)](#)
[![Client Side](https://img.shields.io/badge/Privacy-100%25%20Local-2E6A4F?logo=securityscorecard&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-800020)](#)


<img width="2814" height="1516" alt="image" src="https://github.com/user-attachments/assets/33d32af5-6f09-4219-8d5b-5020c2a2aa6b" />


AuraRemover is a premium, high-fidelity background removal tool that converts dark backgrounds, light backgrounds, or custom keyed colours into transparent PNG alphas. It comes in two formats:
1. **Interactive Web App**: A stunning, lightweight, 100% client-side web application styled with a luxury cream and burgundy glassmorphism layout, featuring real-time adjustment sliders and eye-dropper tools.
2. **Python CLI Utility**: A command-line companion script using Pillow (`PIL`) for automated terminal workflows, scripts, and batch processing.

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

<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=rect&height=6&color=800020" />
</p>

## File Structure

```text
png-background-remover/
├── index.html        # Main HTML application layout
├── style.css         # Custom cream, burgundy, & glassmorphism stylesheets
├── app.js            # JavaScript canvas-processing engine & UI handler
├── remover.py        # Python CLI Pillow script
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
