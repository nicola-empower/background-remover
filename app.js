/**
 * AuraRemover - Core Logic
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
  const origDimensions = document.getElementById('orig-dimensions');
  const btnDownload = document.getElementById('btn-download');

  // --- App State ---
  let originalImage = null;
  let originalFileName = 'image';
  let isEyedropperActive = false;
  let animationFrameId = null;

  // --- Mode Tooltips/Help Texts ---
  const modeHelpDict = {
    dark: 'Removes black and shadow areas under the specified brightness threshold.',
    light: 'Removes whites and highlights above the specified brightness threshold.',
    color: 'Removes a specific custom color within the specified color distance threshold.'
  };

  // --- Initialization ---
  function init() {
    setupEventListeners();
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // File Upload / Dropzone Events
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

    // Sidebar upload different image
    btnChangeImage.addEventListener('click', () => inputFile.click());

    // Adjustment Controls
    selectMode.addEventListener('change', handleModeChange);
    
    // Live update on input (smooth sliding), not just change
    rangeThreshold.addEventListener('input', () => {
      valThreshold.textContent = rangeThreshold.value;
      requestProcess();
    });
    rangeFuzziness.addEventListener('input', () => {
      valFuzziness.textContent = rangeFuzziness.value;
      requestProcess();
    });

    // Color Pickers
    inputColorPicker.addEventListener('input', (e) => {
      const hex = e.target.value;
      inputColorHex.value = hex.toUpperCase();
      requestProcess();
    });

    inputColorHex.addEventListener('input', (e) => {
      let hex = e.target.value;
      if (!hex.startsWith('#') && hex.length > 0) {
        hex = '#' + hex;
      }
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        inputColorPicker.value = hex;
        requestProcess();
      }
    });

    // Eyedropper Interaction
    btnEyedropper.addEventListener('click', triggerEyedropper);

    // Manual Canvas Eyedropper Pick
    canvasOriginal.addEventListener('click', handleCanvasColorPick);
    canvasOriginal.addEventListener('mousemove', handleCanvasHoverPick);

    // Download Button
    btnDownload.addEventListener('click', downloadProcessedImage);
  }

  // --- Clipboard / Upload Handling ---
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

    if (file.name) {
      originalFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      originalImage = new Image();
      originalImage.onload = () => {
        setupWorkspace();
      };
      originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- Workspace Layout Activation ---
  function setupWorkspace() {
    const width = originalImage.naturalWidth;
    const height = originalImage.naturalHeight;

    // Set canvas sizes to actual resolution
    canvasOriginal.width = width;
    canvasOriginal.height = height;
    canvasProcessed.width = width;
    canvasProcessed.height = height;

    // Draw original onto primary canvas
    const ctxOrig = canvasOriginal.getContext('2d');
    ctxOrig.clearRect(0, 0, width, height);
    ctxOrig.drawImage(originalImage, 0, 0);

    // Update dimensions label
    origDimensions.textContent = `${width} × ${height} px`;

    // Swap states in UI
    dropzone.classList.add('hidden');
    editorWorkspace.classList.remove('hidden');
    sidebarUploadContainer.style.display = 'block';
    btnDownload.disabled = false;

    // Process immediately
    requestProcess();

    // Notify user
    showToast('Image Loaded', 'Adjust adjustments to remove background.', 'fa-image');
  }

  // --- UI Controls Feedback ---
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

  // --- Real-time Render Scheduling ---
  function requestProcess() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(processImage);
  }

  // --- Image Processing Algorithm ---
  function processImage() {
    if (!originalImage) return;

    const width = canvasOriginal.width;
    const height = canvasOriginal.height;
    
    const ctxOrig = canvasOriginal.getContext('2d');
    const ctxProc = canvasProcessed.getContext('2d');
    
    // Retrieve pixel data
    let imgData;
    try {
      imgData = ctxOrig.getImageData(0, 0, width, height);
    } catch (e) {
      console.error("Canvas security error: ", e);
      return;
    }

    const data = imgData.data;
    const mode = selectMode.value;
    const threshold = parseFloat(rangeThreshold.value);
    const fuzziness = parseFloat(rangeFuzziness.value);
    
    // Custom color hex parsing
    let tr = 0, tg = 0, tb = 0;
    if (mode === 'color') {
      const hex = inputColorPicker.value;
      tr = parseInt(hex.slice(1, 3), 16);
      tg = parseInt(hex.slice(3, 5), 16);
      tb = parseInt(hex.slice(5, 7), 16);
    }

    // Process pixel buffer
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue; // Already transparent, skip

      let alphaFactor = 1.0;
      let isMatch = false;

      if (mode === 'dark') {
        const brightness = (r + g + b) / 3.0;
        if (brightness < threshold) {
          isMatch = true;
          if (fuzziness > 0 && threshold > 0) {
            // Linear feathering near the threshold boundary
            // As brightness goes from (threshold - fuzziness) to threshold, 
            // alpha transitions from 0 to 1
            const lowerBound = threshold - fuzziness;
            if (brightness < lowerBound) {
              alphaFactor = 0.0;
            } else {
              alphaFactor = (brightness - lowerBound) / fuzziness;
            }
          } else {
            alphaFactor = 0.0;
          }
        }
      } else if (mode === 'light') {
        const brightness = (r + g + b) / 3.0;
        if (brightness > threshold) {
          isMatch = true;
          if (fuzziness > 0 && (255 - threshold) > 0) {
            // As brightness goes from threshold to (threshold + fuzziness),
            // alpha transitions from 1 to 0
            const upperBound = threshold + fuzziness;
            if (brightness > upperBound) {
              alphaFactor = 0.0;
            } else {
              alphaFactor = (upperBound - brightness) / fuzziness;
            }
          } else {
            alphaFactor = 0.0;
          }
        }
      } else if (mode === 'color') {
        // Euclidean distance in RGB space
        const dist = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);
        // Normalize distance to 0-255 (max potential distance is ~441.67)
        const normDist = (dist / 441.67) * 255.0;

        if (normDist < threshold) {
          isMatch = true;
          if (fuzziness > 0 && threshold > 0) {
            // As normalized distance goes from (threshold - fuzziness) to threshold,
            // alpha transitions from 0 to 1
            const lowerBound = threshold - fuzziness;
            if (normDist < lowerBound) {
              alphaFactor = 0.0;
            } else {
              alphaFactor = (normDist - lowerBound) / fuzziness;
            }
          } else {
            alphaFactor = 0.0;
          }
        }
      }

      if (isMatch) {
        data[i + 3] = Math.round(a * alphaFactor);
      }
    }

    // Render output
    ctxProc.clearRect(0, 0, width, height);
    ctxProc.putImageData(imgData, 0, 0);
  }

  // --- Eyedropper Mechanics ---
  function triggerEyedropper() {
    // 1. Check for native browser EyeDropper API
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
          console.log('Native eyedropper cancelled or failed: ', err);
          // Fallback to manual canvas click mode if native eyedropper fails
          enableCanvasPicking();
        });
    } else {
      // 2. Fallback: Canvas click sampling
      enableCanvasPicking();
    }
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
    
    // Scale standard mouse coordinates to canvas resolution coordinates
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
      hex: rgbToHex(pixel[0], pixel[1], pixel[2])
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
    
    // Realtime update color inputs as user hovers (feels incredibly interactive)
    const color = getPixelColorFromEvent(e);
    inputColorPicker.value = color.hex;
    inputColorHex.value = color.hex.toUpperCase();
  }

  function rgbToHex(r, g, b) {
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  // --- Export / Download ---
  function downloadProcessedImage() {
    if (!originalImage) return;

    // Trigger local client side download
    const link = document.createElement('a');
    link.download = `${originalFileName}_transparent.png`;
    link.href = canvasProcessed.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Notify user
    showToast('Done & Finished!', 'Your transparent PNG was saved successfully.', 'fa-wand-magic-sparkles');
  }

  // --- Toast Notification Display ---
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

    // Force reflow
    toast.offsetHeight;

    toast.classList.add('show');

    // Remove automatically
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 4000);
  }

  init();
});
