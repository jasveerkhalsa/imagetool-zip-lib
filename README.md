# 📦 ImageToolLib

**Standalone Image Processing & ZIP Library** – fast, dependency-free JavaScript library for image processing, compression, and batch zipping directly in the browser.   🌐 [imagetool.org](https://imagetool.org)

- 🚀 No external dependencies (like JSZip or extra Canvas libs)  
- 🌐 Works offline using pure JavaScript + Canvas API  
- 🖼️ Compress, resize, convert, and zip images easily  

---

## 🚀 Installation

### CDN (recommended)

```html
<script src="https://unpkg.com/imagetool-zip-lib@latest/imagetoolZip-lib.min.js"></script>
```

### NPM

```bash
npm install imagetool-zip-lib
```

```js
import ImageToolLib from "imagetool-zip-lib";
```

---

## 🖼 Demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ImageToolLib Demo</title>
</head>
<body>
  <h2>ImageToolLib Demo</h2>
  <input type="file" id="fileInput" multiple>
  <button id="downloadZip">Download ZIP</button>

  <script src="imagetoolZip-lib.min.js"></script>
  <script>
    const tool = new ImageToolLib();
    const input = document.getElementById('fileInput');
    const btn = document.getElementById('downloadZip');

    input.addEventListener('change', async (e) => {
      const files = e.target.files;
      tool.clearFiles();

      for (const file of files) {
        const compressed = await tool.compressImage(file, 0.7);
        tool.addFile(file.name, compressed);
      }
      alert('Images ready! Click Download ZIP.');
    });

    btn.addEventListener('click', () => {
      tool.createZip('my_images.zip');
    });
  </script>
</body>
</html>
```

---

## 📚 API Documentation

### 🔑 Core Methods

- `processImage(file, options)` → Process image with options like resize, rotate, brightness, contrast, blur.  
- `resizeImage(file, w, h, maintainAspect)` → Resize image with optional aspect ratio lock.  
- `compressImage(file, quality)` → Compress image with given quality (0–1).  
- `convertFormat(file, format, quality)` → Convert to another format (`jpeg`, `png`, `webp`).  
- `batchProcess(files, options)` → Process multiple images with same options.  

---

### 📂 File Management

- `addFile(name, blob)` → Add file to internal collection for zipping.  
- `removeFile(name)` → Remove file by name.  
- `clearFiles()` → Clear all files.  
- `getFileList()` → Get list of all filenames added.  

---

### 📦 ZIP Handling

- `createZip(filename)` → Generate and download ZIP with all files added.  
- `generateZipBuffer()` → Generate raw ZIP buffer (ArrayBuffer).  
- `downloadBlob(blob, filename)` → Utility: download any Blob as file.  

---

### 🛠 Utilities

- `loadImage(file)` → Load image as HTMLImageElement.  
- `canvasToBlob(canvas, format, quality)` → Convert canvas to Blob.  
- `getImageDimensions(file)` → Get width/height of image.  

---

## ⚡ Advanced Example

```js
const tool = new ImageToolLib();

async function handleUpload(file) {
  // Resize to 500px wide
  const resized = await tool.resizeImage(file, 500, 500);

  // Convert to PNG
  const png = await tool.convertFormat(resized, 'png');

  // Add to collection for ZIP
  tool.addFile("converted.png", png);

  // Download ZIP later
  await tool.createZip("images.zip");
}
```

---

## 🛠 Development

Clone repo:
```bash
git clone https://github.com/jasveerkhalsa/imagetool-zip-lib.git
cd imagetool-zip-lib
```

Build / test locally:
```bash
npm install
npm run build   # optional, if you add bundler/minifier
```

---

## 🤝 Contributing

Pull requests welcome!  
Please open an issue first to discuss new features or bug fixes.  

---

## 📄 License

[MIT](LICENSE) – free to use, modify, and distribute.
