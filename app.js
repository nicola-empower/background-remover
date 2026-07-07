/**
 * AuraRemover & AuraUtils - Web Suite Core Logic
 * Created by Nicola Berry (https://nicolaberry.uk)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const dropzone = document.getElementById('dropzone');
  const inputFile = document.getElementById('input-file');
  const btnBrowse = dropzone.querySelector('.btn-browse');
  const editorWorkspace = document.getElementById('editor-workspace');
  const sidebarUploadContainer = document.getElementById('sidebar-upload-container');
  const btnChangeImage = document.getElementById('btn-change-image');
  
  // Tab Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabControlGroups = document.querySelectorAll('.tab-control-group');
  const tabPreviewWrappers = document.querySelectorAll('.tab-preview-wrapper');
  
  // Shared Outputs
  const origDimensionsLabels = document.querySelectorAll('.label-orig-dimensions');
  
  // 1. Background Remover Elements
  const selectMode = document.getElementById('select-mode');
  const modeHelpText = document.getElementById('mode-help-text');
  const colorPickerGroup = document.getElementById('color-picker-group');
  const inputColorPicker = document.getElementById('input-color-picker');
  const inputColorHex = document.getElementById('input-color-hex');
  const colorPreviewBox = document.getElementById('color-preview-box');
  const btnEyedropper = document.getElementById('btn-eyedropper');
  const rangeThreshold = document.getElementById('range-threshold');
  const valThreshold = document.getElementById('val-threshold');
  const rangeFuzziness = document.getElementById('range-fuzziness');
  const valFuzziness = document.getElementById('val-fuzziness');
  const canvasOriginal = document.getElementById('canvas-original');
  const canvasProcessed = document.getElementById('canvas-processed');
  const btnDownloadRemover = document.getElementById('btn-download-remover');

  // 2. WebP Compressor Elements
  const rangeQuality = document.getElementById('range-quality');
  const valQuality = document.getElementById('val-quality');
  const checkResize = document.getElementById('check-resize');
  const resizeInputsGroup = document.getElementById('resize-inputs-group');
  const rangeWidth = document.getElementById('range-width');
  const valWidth = document.getElementById('val-width');
  const canvasCompOriginal = document.getElementById('canvas-compressor-original');
  const canvasCompProcessed = document.getElementById('canvas-compressor-processed');
  const savingsMetric = document.getElementById('savings-metric');
  const btnDownloadCompressor = document.getElementById('btn-download-compressor');

  // 3. Colour Palette Elements
  const rangeColors = document.getElementById('range-colors');
  const valColors = document.getElementById('val-colors');
  const swatchesGrid = document.getElementById('swatches-grid');
  const canvasPaletteSource = document.getElementById('canvas-palette-source');
  const btnCopyCSS = document.getElementById('btn-copy-css');
  const btnCopyJSON = document.getElementById('btn-copy-json');

  // 4. Icon Builder Elements
  const iconsGridContainer = document.getElementById('icons-grid-container');
  const textareaHtmlTags = document.getElementById('textarea-html-tags');
  const btnCopyHtmlTags = document.getElementById('btn-copy-html-tags');
  const btnDownloadIcons = document.getElementById('btn-download-icons');

  // 5. Watermarker Elements
  const radioWatermarkTypes = document.querySelectorAll('input[name="watermark-type"]');
  const watermarkTextInputs = document.getElementById('watermark-text-inputs');
  const watermarkLogoInputs = document.getElementById('watermark-logo-inputs');
  const inputWatermarkText = document.getElementById('input-watermark-text');
  const rangeFontSize = document.getElementById('range-font-size');
  const valFontSize = document.getElementById('val-font-size');
  const btnUploadLogo = document.getElementById('btn-upload-logo');
  const inputLogoFile = document.getElementById('input-logo-file');
  const rangeWatermarkOpacity = document.getElementById('range-watermark-opacity');
  const valWatermarkOpacity = document.getElementById('val-watermark-opacity');
  const rangeWatermarkMargin = document.getElementById('range-watermark-margin');
  const valWatermarkMargin = document.getElementById('val-watermark-margin');
  const posButtons = document.querySelectorAll('.pos-btn');
  const canvasWatermarkProcessed = document.getElementById('canvas-watermark-processed');
  const btnDownloadWatermark = document.getElementById('btn-download-watermark');

  // --- App State ---
  let originalImage = null;
  let originalFileName = 'image';
  let originalFileSize = 0;
  let activeTab = 'remover';
  let isEyedropperActive = false;
  let animationFrameId = null;
  
  // Watermark state
  let watermarkLogoImage = null;
  let watermarkPosition = 'bottom-right';

  // Dynamic lists to hold computed icon canvases for batch downloads
  let generatedIcons = []; 
  // Cache of extracted colours
  let extractedHexColours = [];

  const modeHelpDict = {
    dark: 'Removes black and shadow areas under the specified brightness threshold.',
    light: 'Removes whites and highlights above the specified brightness threshold.',
    color: 'Removes a specific custom colour within the specified colour distance threshold.'
  };

  // --- Initialization ---
  function init() {
    setupEventListeners();
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Upload & Change Image
    dropzone.addEventListener('click', () => inputFile.click());
    btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      inputFile.click();
    });
    inputFile.addEventListener('change', handleFileSelect);
    
    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        processUpload(e.dataTransfer.files[0]);
      }
    });

    // Clipboard Paste (Ctrl+V)
    window.addEventListener('paste', handleClipboardPaste);
    btnChangeImage.addEventListener('click', () => inputFile.click());

    // 1. Background Remover Events
    selectMode.addEventListener('change', handleModeChange);
    rangeThreshold.addEventListener('input', () => {
      valThreshold.textContent = rangeThreshold.value;
      requestProcess();
    });
    rangeFuzziness.addEventListener('input', () => {
      valFuzziness.textContent = rangeFuzziness.value;
      requestProcess();
    });
    inputColorPicker.addEventListener('input', (e) => {
      const hex = e.target.value;
      inputColorHex.value = hex.toUpperCase();
      requestProcess();
    });
    inputColorHex.addEventListener('input', (e) => {
      let hex = e.target.value;
      if (!hex.startsWith('#') && hex.length > 0) hex = '#' + hex;
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        inputColorPicker.value = hex;
        requestProcess();
      }
    });
    btnEyropperClickSetup();
    btnDownloadRemover.addEventListener('click', downloadRemoverResult);

    // 2. WebP Compressor Events
    rangeQuality.addEventListener('input', () => {
      valQuality.textContent = rangeQuality.value;
      requestProcess();
    });
    checkResize.addEventListener('change', () => {
      if (checkResize.checked) {
        resizeInputsGroup.classList.remove('hidden');
      } else {
        resizeInputsGroup.classList.add('hidden');
      }
      requestProcess();
    });
    rangeWidth.addEventListener('input', () => {
      valWidth.textContent = rangeWidth.value + ' px';
      requestProcess();
    });
    btnDownloadCompressor.addEventListener('click', downloadCompressorResult);

    // 3. Colour Palette Events
    rangeColors.addEventListener('input', () => {
      valColors.textContent = rangeColors.value;
      requestProcess();
    });
    btnCopyCSS.addEventListener('click', copyPaletteCSS);
    btnCopyJSON.addEventListener('click', copyPaletteJSON);

    // 4. Icon Builder Events
    btnCopyHtmlTags.addEventListener('click', copyHtmlTagsToClipboard);
    btnDownloadIcons.addEventListener('click', downloadAllIconsAsZip);

    // 5. Watermarker Events
    radioWatermarkTypes.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const type = e.target.value;
        document.querySelectorAll('.radio-label-btn').forEach(lbl => lbl.classList.remove('active'));
        radio.parentElement.classList.add('active');
        
        if (type === 'text') {
          watermarkTextInputs.classList.remove('hidden');
          watermarkLogoInputs.classList.add('hidden');
        } else {
          watermarkTextInputs.classList.add('hidden');
          watermarkLogoInputs.classList.remove('hidden');
        }
        requestProcess();
      });
    });
    inputWatermarkText.addEventListener('input', requestProcess);
    rangeFontSize.addEventListener('input', () => {
      valFontSize.textContent = rangeFontSize.value + ' px';
      requestProcess();
    });
    btnUploadLogo.addEventListener('click', () => inputLogoFile.click());
    inputLogoFile.addEventListener('change', handleLogoSelect);
    rangeWatermarkOpacity.addEventListener('input', () => {
      valWatermarkOpacity.textContent = rangeWatermarkOpacity.value + '%';
      requestProcess();
    });
    rangeWatermarkMargin.addEventListener('input', () => {
      valWatermarkMargin.textContent = rangeWatermarkMargin.value + ' px';
      requestProcess();
    });
    posButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        posButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        watermarkPosition = btn.getAttribute('data-pos');
        requestProcess();
      });
    });
    btnDownloadWatermark.addEventListener('click', downloadWatermarkResult);
  }

  // --- Tab Switching Manager ---
  function switchTab(tabName) {
    activeTab = tabName;
    
    // Update active tab buttons
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active sidebar controls
    tabControlGroups.forEach(group => {
      if (group.getAttribute('data-content') === tabName) {
        group.classList.add('active');
      } else {
        group.classList.remove('active');
      }
    });

    // Update active workspace previews
    tabPreviewWrappers.forEach(wrap => {
      if (wrap.getAttribute('data-preview') === tabName) {
        wrap.classList.add('active');
      } else {
        wrap.classList.remove('active');
      }
    });

    disableCanvasPicking(); // Reset dropper overlay if moving tabs
    requestProcess();
  }

  // --- File Select / Drag / Paste Hooks ---
  function handleFileSelect(e) {
    if (e.target.files.length > 0) {
      processUpload(e.target.files[0]);
    }
  }

  function handleClipboardPaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        originalFileName = 'pasted-image';
        processUpload(blob);
        break;
      }
    }
  }

  function processUpload(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    originalFileSize = file.size;
    if (file.name) {
      originalFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      originalImage = new Image();
      originalImage.onload = () => {
        setupSharedWorkspace();
      };
      originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- Common Workspace Setup ---
  function setupSharedWorkspace() {
    const width = originalImage.naturalWidth;
    const height = originalImage.naturalHeight;

    // 1. Initialise all canvases to original resolution
    const canvases = [
      canvasOriginal, canvasProcessed, 
      canvasCompOriginal, canvasCompProcessed, 
      canvasPaletteSource, canvasWatermarkProcessed
    ];
    canvases.forEach(canvas => {
      canvas.width = width;
      canvas.height = height;
    });

    // Draw source image onto all original/preview canvases
    const ctxs = [
      canvasOriginal.getContext('2d'), 
      canvasCompOriginal.getContext('2d'),
      canvasPaletteSource.getContext('2d')
    ];
    ctxs.forEach(ctx => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(originalImage, 0, 0);
    });

    // Update shared labels
    origDimensionsLabels.forEach(lbl => {
      lbl.textContent = `${width} × ${height} px`;
    });

    // Toggle workspace visibility
    dropzone.classList.add('hidden');
    editorWorkspace.classList.remove('hidden');
    sidebarUploadContainer.style.display = 'block';
    
    // Enable all download elements
    const dlTriggers = document.querySelectorAll('.download-trigger');
    dlTriggers.forEach(btn => btn.disabled = false);
    btnCopyCSS.disabled = false;
    btnCopyJSON.disabled = false;

    // Trigger processing
    requestProcess();
  }

  // --- Scheduler ---
  function requestProcess() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(processCurrentTab);
  }

  // --- Router for active tab logic ---
  function processCurrentTab() {
    if (!originalImage) return;

    switch (activeTab) {
      case 'remover':
        processBackgroundRemover();
        break;
      case 'compressor':
        processWebPCompressor();
        break;
      case 'palette':
        processColourPalette();
        break;
      case 'icons':
        processIconBuilder();
        break;
      case 'watermark':
        processWatermarker();
        break;
    }
  }

  // ==========================================
  // 1. BACKGROUND REMOVER LOGIC
  // ==========================================
  function handleModeChange() {
    const mode = selectMode.value;
    modeHelpText.textContent = modeHelpDict[mode];

    if (mode === 'color') {
      colorPickerGroup.classList.remove('hidden');
    } else {
      colorPickerGroup.classList.add('hidden');
      disableCanvasPicking();
    }
    requestProcess();
  }

  function processBackgroundRemover() {
    const width = canvasOriginal.width;
    const height = canvasOriginal.height;
    const ctxOrig = canvasOriginal.getContext('2d');
    const ctxProc = canvasProcessed.getContext('2d');

    let imgData = ctxOrig.getImageData(0, 0, width, height);
    const data = imgData.data;
    const mode = selectMode.value;
    const threshold = parseFloat(rangeThreshold.value);
    const fuzziness = parseFloat(rangeFuzziness.value);
    
    let tr = 0, tg = 0, tb = 0;
    if (mode === 'color') {
      const hex = inputColorPicker.value;
      tr = parseInt(hex.slice(1, 3), 16);
      tg = parseInt(hex.slice(3, 5), 16);
      tb = parseInt(hex.slice(5, 7), 16);
    }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue;

      let alphaFactor = 1.0;
      let isMatch = false;

      if (mode === 'dark') {
        const brightness = (r + g + b) / 3.0;
        if (brightness < threshold) {
          isMatch = true;
          if (fuzziness > 0 && threshold > 0) {
            const lowerBound = threshold - fuzziness;
            alphaFactor = brightness < lowerBound ? 0.0 : (brightness - lowerBound) / fuzziness;
          } else {
            alphaFactor = 0.0;
          }
        }
      } else if (mode === 'light') {
        const brightness = (r + g + b) / 3.0;
        if (brightness > threshold) {
          isMatch = true;
          if (fuzziness > 0 && (255 - threshold) > 0) {
            const upperBound = threshold + fuzziness;
            alphaFactor = brightness > upperBound ? 0.0 : (upperBound - brightness) / fuzziness;
          } else {
            alphaFactor = 0.0;
          }
        }
      } else if (mode === 'color') {
        const dist = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);
        const normDist = (dist / 441.67) * 255.0;

        if (normDist < threshold) {
          isMatch = true;
          if (fuzziness > 0 && threshold > 0) {
            const lowerBound = threshold - fuzziness;
            alphaFactor = normDist < lowerBound ? 0.0 : (normDist - lowerBound) / fuzziness;
          } else {
            alphaFactor = 0.0;
          }
        }
      }

      if (isMatch) {
        data[i + 3] = Math.round(a * alphaFactor);
      }
    }

    ctxProc.clearRect(0, 0, width, height);
    ctxProc.putImageData(imgData, 0, 0);
  }

  function btnEyropperClickSetup() {
    btnEyedropper.addEventListener('click', () => {
      if (window.EyeDropper) {
        const eyeDropper = new EyeDropper();
        eyeDropper.open()
          .then((result) => {
            const hex = result.sRGBHex.toUpperCase();
            inputColorPicker.value = hex;
            inputColorHex.value = hex;
            requestProcess();
          })
          .catch((err) => {
            enableCanvasPicking();
          });
      } else {
        enableCanvasPicking();
      }
    });

    canvasOriginal.addEventListener('click', handleCanvasColorPick);
    canvasOriginal.addEventListener('mousemove', handleCanvasHoverPick);
  }

  function enableCanvasPicking() {
    isEyedropperActive = true;
    canvasOriginal.parentElement.classList.add('picking-color');
    btnEyedropper.classList.add('active');
  }

  function disableCanvasPicking() {
    isEyedropperActive = false;
    canvasOriginal.parentElement.classList.remove('picking-color');
    btnEyedropper.classList.remove('active');
  }

  function getPixelColorFromEvent(e) {
    const rect = canvasOriginal.getBoundingClientRect();
    const scaleX = canvasOriginal.width / rect.width;
    const scaleY = canvasOriginal.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    const ctx = canvasOriginal.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
      hex: '#' + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)
    };
  }

  function handleCanvasColorPick(e) {
    if (!isEyedropperActive) return;
    const color = getPixelColorFromEvent(e);
    inputColorPicker.value = color.hex;
    inputColorHex.value = color.hex.toUpperCase();
    disableCanvasPicking();
    requestProcess();
  }

  function handleCanvasHoverPick(e) {
    if (!isEyedropperActive) return;
    const color = getPixelColorFromEvent(e);
    inputColorPicker.value = color.hex;
    inputColorHex.value = color.hex.toUpperCase();
  }

  function downloadRemoverResult() {
    triggerDownload(canvasProcessed, `${originalFileName}_transparent.png`);
  }

  // ==========================================
  // 2. WEBP COMPRESSOR LOGIC
  // ==========================================
  function processWebPCompressor() {
    const quality = parseInt(rangeQuality.value);
    const resizeEnabled = checkResize.checked;
    const maxWidth = parseInt(rangeWidth.value);

    let finalW = originalImage.naturalWidth;
    let finalH = originalImage.naturalHeight;

    if (resizeEnabled && finalW > maxWidth) {
      const ratio = maxWidth / finalW;
      finalW = maxWidth;
      finalH = Math.round(originalImage.naturalHeight * ratio);
    }

    canvasCompProcessed.width = finalW;
    canvasCompProcessed.height = finalH;

    const ctx = canvasCompProcessed.getContext('2d');
    ctx.clearRect(0, 0, finalW, finalH);
    ctx.drawImage(originalImage, 0, 0, finalW, finalH);

    // Compute WebP base64 size estimation
    const webpDataUrl = canvasCompProcessed.toDataURL('image/webp', quality / 100);
    const base64Length = webpDataUrl.length - (webpDataUrl.indexOf(',') + 1);
    const compressedSize = Math.round((base64Length * 3) / 4);

    // Calculate percentage savings
    const diff = originalFileSize - compressedSize;
    const pctSaved = originalFileSize > 0 ? (diff / originalFileSize) * 100 : 0;

    const origFormatted = formatBytes(originalFileSize);
    const compFormatted = formatBytes(compressedSize);

    if (pctSaved > 0) {
      savingsMetric.textContent = `${compFormatted} (${pctSaved.toFixed(1)}% saved)`;
      savingsMetric.style.backgroundColor = 'var(--color-success-light)';
      savingsMetric.style.color = 'var(--color-success)';
    } else {
      savingsMetric.textContent = `${compFormatted} (Size increased)`;
      savingsMetric.style.backgroundColor = 'var(--color-burgundy-light)';
      savingsMetric.style.color = 'var(--color-burgundy)';
    }
  }

  function downloadCompressorResult() {
    const quality = parseInt(rangeQuality.value);
    const dataUrl = canvasCompProcessed.toDataURL('image/webp', quality / 100);
    const link = document.createElement('a');
    link.download = `${originalFileName}_optimized.webp`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Finished!', 'Optimised WebP downloaded successfully.', 'fa-wand-magic-sparkles');
  }

  // ==========================================
  // 3. COLOUR PALETTE EXTRACTOR
  // ==========================================
  function processColourPalette() {
    const colorsCount = parseInt(rangeColors.value);
    
    // Create offscreen thumbnail (16x16) to average/cluster pixels
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 16;
    tempCanvas.height = 16;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(originalImage, 0, 0, 16, 16);
    
    const imgData = tempCtx.getImageData(0, 0, 16, 16).data;
    
    // Gather unique colors and count frequencies
    const freq = {};
    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a < 50) continue; // Skip very transparent pixels
      
      const hex = rgbToHex(r, g, b);
      freq[hex] = (freq[hex] || 0) + 1;
    }

    // Sort by frequency descending
    const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
    
    // Filter to find distinct colours (using Euclidean distance in RGB space)
    const distinctColors = [];
    const minDistance = 35; // RGB distance threshold

    for (let i = 0; i < sorted.length; i++) {
      const hex = sorted[i];
      const rgb = hexToRgb(hex);

      // Check distance to already picked colours
      let tooClose = false;
      for (const picked of distinctColors) {
        const pickedRgb = hexToRgb(picked);
        const dist = Math.sqrt(
          (rgb.r - pickedRgb.r) ** 2 +
          (rgb.g - pickedRgb.g) ** 2 +
          (rgb.b - pickedRgb.b) ** 2
        );
        if (dist < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        distinctColors.push(hex);
      }

      if (distinctColors.length >= colorsCount) break;
    }

    // Fallback if we didn't find enough unique colours
    if (distinctColors.length < colorsCount) {
      for (let i = 0; i < sorted.length; i++) {
        const hex = sorted[i];
        if (!distinctColors.includes(hex)) {
          distinctColors.push(hex);
        }
        if (distinctColors.length >= colorsCount) break;
      }
    }

    extractedHexColours = distinctColors;

    // Render swatches in UI
    swatchesGrid.innerHTML = '';
    distinctColors.forEach((hex, index) => {
      const rgb = hexToRgb(hex);
      const card = document.createElement('div');
      card.className = 'swatch-card';
      card.innerHTML = `
        <div class="swatch-color-box" style="background-color: ${hex};"></div>
        <div class="swatch-details">
          <span class="swatch-hex">${hex}</span>
          <span class="swatch-rgb">RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}</span>
        </div>
        <div class="swatch-copy-icon"><i class="fa-solid fa-copy"></i></div>
      `;

      card.addEventListener('click', () => {
        navigator.clipboard.writeText(hex);
        showToast('Copied!', `Colour ${hex} copied to clipboard.`, 'fa-circle-check');
      });

      swatchesGrid.appendChild(card);
    });
  }

  function copyPaletteCSS() {
    if (extractedHexColours.length === 0) return;
    
    let cssText = "/* AuraPalette CSS Variables */\n:root {\n";
    extractedHexColours.forEach((hex, idx) => {
      cssText += `  --colour-${idx + 1}: ${hex.toLowerCase()};\n`;
    });
    cssText += "}";

    navigator.clipboard.writeText(cssText);
    showToast('CSS Copied!', 'CSS colour variables copied to clipboard.', 'fa-code');
  }

  function copyPaletteJSON() {
    if (extractedHexColours.length === 0) return;
    
    const paletteObj = {
      palette: extractedHexColours.map((hex, idx) => {
        const rgb = hexToRgb(hex);
        return {
          name: `colour-${idx + 1}`,
          hex: hex,
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        };
      })
    };

    navigator.clipboard.writeText(JSON.stringify(paletteObj, null, 2));
    showToast('JSON Copied!', 'JSON palette data copied to clipboard.', 'fa-brackets-curly');
  }

  // ==========================================
  // 4. ICON BUILDER LOGIC
  // ==========================================
  function processIconBuilder() {
    iconsGridContainer.innerHTML = '';
    generatedIcons = [];

    const iconSizes = [
      { name: 'favicon-16x16.png', w: 16, h: 16 },
      { name: 'favicon-32x32.png', w: 32, h: 32 },
      { name: 'apple-touch-icon.png', w: 180, h: 180 },
      { name: 'android-chrome-192x192.png', w: 192, h: 192 },
      { name: 'android-chrome-512x512.png', w: 512, h: 512 }
    ];

    iconSizes.forEach(size => {
      const cell = document.createElement('div');
      cell.className = 'icon-item-box';
      
      const canvasId = `canvas-icon-${size.w}`;
      cell.innerHTML = `
        <div class="icon-preview-wrapper checkered-bg">
          <canvas id="${canvasId}"></canvas>
        </div>
        <span class="icon-name-label">${size.name}</span>
        <span class="icon-size-label">${size.w} × ${size.h} px</span>
        <button type="button" class="icon-single-dl-btn" data-name="${size.name}" data-canvas="${canvasId}">
          <i class="fa-solid fa-download"></i> Download
        </button>
      `;

      iconsGridContainer.appendChild(cell);

      // Render resized canvas
      const cvs = document.getElementById(canvasId);
      cvs.width = size.w;
      cvs.height = size.h;
      const ctx = cvs.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.drawImage(originalImage, 0, 0, size.w, size.h);

      generatedIcons.push({ name: size.name, canvas: cvs });

      // Add click download individual trigger
      cell.querySelector('.icon-single-dl-btn').addEventListener('click', (e) => {
        triggerDownload(cvs, size.name);
      });
    });

    // Populate copyable HTML tags
    const htmlBoilerplate = `
<!-- Favicon Configuration (Place in <head>) -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="shortcut icon" href="/favicon.ico">
    `.strip();
    
    textareaHtmlTags.value = htmlBoilerplate;
  }

  function copyHtmlTagsToClipboard() {
    textareaHtmlTags.select();
    document.execCommand('copy');
    showToast('Boilerplate Copied!', 'Favicon HTML tags copied to clipboard.', 'fa-copy');
  }

  function downloadAllIconsAsZip() {
    if (generatedIcons.length === 0) return;

    const zip = new JSZip();
    let blobPromises = [];

    generatedIcons.forEach(icon => {
      const p = new Promise(resolve => {
        icon.canvas.toBlob(blob => {
          zip.file(icon.name, blob);
          resolve();
        }, 'image/png');
      });
      blobPromises.push(p);
    });

    // Add multi-resolution favicon.ico simulation (just reuse the 32x32 as PNG favicon.ico)
    const icoPromise = new Promise(resolve => {
      const favicon32 = generatedIcons.find(i => i.name === 'favicon-32x32.png');
      if (favicon32) {
        favicon32.canvas.toBlob(blob => {
          zip.file('favicon.ico', blob);
          resolve();
        });
      } else {
        resolve();
      }
    });
    blobPromises.push(icoPromise);

    Promise.all(blobPromises).then(() => {
      zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a');
        link.download = `${originalFileName}_icons.zip`;
        link.href = URL.createObjectURL(content);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Export Finished!', 'All icons bundled into ZIP successfully.', 'fa-file-zipper');
      });
    });
  }

  // ==========================================
  // 5. IMAGE WATERMARKER LOGIC
  // ==========================================
  function handleLogoSelect(e) {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        watermarkLogoImage = new Image();
        watermarkLogoImage.onload = () => {
          btnUploadLogo.innerHTML = `<i class="fa-solid fa-circle-check"></i> Logo: ${file.name.slice(0, 12)}...`;
          requestProcess();
        };
        watermarkLogoImage.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  function processWatermarker() {
    const width = canvasPaletteSource.width;
    const height = canvasPaletteSource.height;
    
    canvasWatermarkProcessed.width = width;
    canvasWatermarkProcessed.height = height;

    const ctx = canvasWatermarkProcessed.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(originalImage, 0, 0, width, height);

    const type = document.querySelector('input[name="watermark-type"]:checked').value;
    const opacity = parseFloat(rangeWatermarkOpacity.value) / 100;
    const margin = parseInt(rangeWatermarkMargin.value);

    ctx.save();
    ctx.globalAlpha = opacity;

    if (type === 'text') {
      const text = inputWatermarkText.value || '© Nicola Berry';
      const size = parseInt(rangeFontSize.value);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${size}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.textBaseline = 'top';

      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const textH = size; // Approximate height

      const pos = getWatermarkXY(width, height, textW, textH, margin);
      
      // Draw shadow first
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillText(text, pos.x + 2, pos.y + 2);

      // Draw primary text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, pos.x, pos.y);

    } else if (type === 'logo' && watermarkLogoImage) {
      // Scale logo to maximum 25% of background width
      let logoW = watermarkLogoImage.naturalWidth;
      let logoH = watermarkLogoImage.naturalHeight;
      const maxLogoW = Math.round(width * 0.25);
      
      if (logoW > maxLogoW) {
        const ratio = maxLogoW / logoW;
        logoW = maxLogoW;
        logoH = Math.round(logoH * ratio);
      }

      const pos = getWatermarkXY(width, height, logoW, logoH, margin);
      ctx.drawImage(watermarkLogoImage, pos.x, pos.y, logoW, logoH);
    }

    ctx.restore();
  }

  function getWatermarkXY(imgW, imgH, markW, markH, margin) {
    let x = margin;
    let y = margin;

    switch (watermarkPosition) {
      case 'top-left':
        x = margin;
        y = margin;
        break;
      case 'top-right':
        x = imgW - markW - margin;
        y = margin;
        break;
      case 'center':
        x = Math.round((imgW - markW) / 2);
        y = Math.round((imgH - markH) / 2);
        break;
      case 'bottom-left':
        x = margin;
        y = imgH - markH - margin;
        break;
      case 'bottom-right':
        x = imgW - markW - margin;
        y = imgH - markH - margin;
        break;
    }

    return { x, y };
  }

  function downloadWatermarkResult() {
    triggerDownload(canvasWatermarkProcessed, `${originalFileName}_watermarked.png`);
  }

  // ==========================================
  // SHARED UTILITIES
  // ==========================================
  function triggerDownload(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Finished!', `${filename} downloaded successfully.`, 'fa-circle-check');
  }

  function showToast(title, message, icon = 'fa-circle-check') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
      <div class="toast-content">
        <span class="toast-title">${title}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;

    toastContainer.appendChild(toast);
    toast.offsetHeight; // Force reflow
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 4000);
  }

  function rgbToHex(r, g, b) {
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b).toUpperCase();
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  init();
});

// String strip polyfill
if (!String.prototype.strip) {
  String.prototype.strip = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}
