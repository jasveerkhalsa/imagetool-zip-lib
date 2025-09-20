/**
 * ImageTool.org - Standalone Image Processing & Zip Library
 * Fast, dependency-free JavaScript library for image processing and file compression
 * Author: ImageTool.org Team
 * Version: 1.0.4 (Fixed ZIP offset issue)
 */

class ImageToolLib {
    constructor() {
        this.version = '1.0.1';
        this.files = new Map();
        this.crcTable = null;
    }

    // Load image as HTMLImageElement
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    // Process image with options
    async processImage(file, options = {}) {
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = options.width || img.width;
        canvas.height = options.height || img.height;

        if (options.rotate) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((options.rotate * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (options.brightness !== undefined) this.adjustBrightness(ctx, canvas, options.brightness);
        if (options.contrast !== undefined) this.adjustContrast(ctx, canvas, options.contrast);
        if (options.blur) this.applyBlur(ctx, canvas, options.blur);

        return new Promise(resolve => {
            canvas.toBlob(resolve, options.format || 'image/jpeg', options.quality || 0.9);
        });
    }

    adjustBrightness(ctx, canvas, brightness) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] += brightness;
            data[i + 1] += brightness;
            data[i + 2] += brightness;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    adjustContrast(ctx, canvas, contrast) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;
            data[i + 1] = factor * (data[i + 1] - 128) + 128;
            data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    applyBlur(ctx, canvas, blurAmount) {
        ctx.filter = `blur(${blurAmount}px)`;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
        ctx.filter = 'none';
    }

    async resizeImage(file, width, height, maintainAspectRatio = true) {
        const options = { width, height };
        if (maintainAspectRatio) {
            const img = await this.loadImage(file);
            const aspectRatio = img.width / img.height;
            if (width / height > aspectRatio) options.width = height * aspectRatio;
            else options.height = width / aspectRatio;
        }
        return this.processImage(file, options);
    }

    addFile(name, blob) { this.files.set(name, blob); }
    removeFile(name) { this.files.delete(name); }
    clearFiles() { this.files.clear(); }
    getFileList() { return Array.from(this.files.keys()); }

    // Create ZIP and download
    async createZip(filename = 'images.zip') {
        const zipData = await this.generateZipBuffer();
        const blob = new Blob([zipData], { type: 'application/zip' });
        this.downloadBlob(blob, filename);
    }

    async generateZipBuffer() {
        const files = Array.from(this.files.entries());
        const entries = [];

        // Prepare file entries
        for (const [name, blob] of files) {
            const data = new Uint8Array(await blob.arrayBuffer());
            const crc32 = this.calculateCRC32(data);
            entries.push({ name, data, size: data.length, compressedSize: data.length, crc32, offset: 0 });
        }

        // Calculate offsets
        let pos = 0;
        entries.forEach(entry => {
            entry.offset = pos;
            pos += 30 + entry.name.length + entry.size; // Local header + filename + data
        });

        const centralDirStart = pos;
        const centralDirSize = entries.reduce((sum, e) => sum + 46 + e.name.length, 0);
        const totalZipSize = centralDirStart + centralDirSize + 22; // End of central dir

        const zipBuffer = new ArrayBuffer(totalZipSize);
        const zipView = new DataView(zipBuffer);
        const zipBytes = new Uint8Array(zipBuffer);

        // Write local file headers + data
        pos = 0;
        entries.forEach(entry => {
            zipView.setUint32(pos, 0x04034b50, true); pos += 4; // Local file header signature
            zipView.setUint16(pos, 20, true); pos += 2; // Version needed to extract
            zipView.setUint16(pos, 0, true); pos += 2; // General purpose flag
            zipView.setUint16(pos, 0, true); pos += 2; // Compression method
            zipView.setUint16(pos, 0, true); pos += 2; // Last mod time
            zipView.setUint16(pos, 0, true); pos += 2; // Last mod date
            zipView.setUint32(pos, entry.crc32, true); pos += 4;
            zipView.setUint32(pos, entry.compressedSize, true); pos += 4;
            zipView.setUint32(pos, entry.size, true); pos += 4;
            zipView.setUint16(pos, entry.name.length, true); pos += 2;
            zipView.setUint16(pos, 0, true); pos += 2;

            for (let i = 0; i < entry.name.length; i++) zipBytes[pos++] = entry.name.charCodeAt(i);
            zipBytes.set(entry.data, pos); pos += entry.data.length;
        });

        // Write central directory
        let cdPos = centralDirStart;
        entries.forEach(entry => {
            zipView.setUint32(cdPos, 0x02014b50, true); cdPos += 4;
            zipView.setUint16(cdPos, 20, true); cdPos += 2; // Version made by
            zipView.setUint16(cdPos, 20, true); cdPos += 2; // Version needed
            zipView.setUint16(cdPos, 0, true); cdPos += 2;
            zipView.setUint16(cdPos, 0, true); cdPos += 2;
            zipView.setUint16(cdPos, 0, true); cdPos += 2;
            zipView.setUint16(cdPos, 0, true); cdPos += 2;
            zipView.setUint32(cdPos, entry.crc32, true); cdPos += 4;
            zipView.setUint32(cdPos, entry.compressedSize, true); cdPos += 4;
            zipView.setUint32(cdPos, entry.size, true); cdPos += 4;
            zipView.setUint16(cdPos, entry.name.length, true); cdPos += 2;
            zipView.setUint16(cdPos, 0, true); cdPos += 2; // Extra
            zipView.setUint16(cdPos, 0, true); cdPos += 2; // Comment
            zipView.setUint16(cdPos, 0, true); cdPos += 2; // Disk start
            zipView.setUint16(cdPos, 0, true); cdPos += 2; // Internal attr
            zipView.setUint32(cdPos, 0, true); cdPos += 4; // External attr
            zipView.setUint32(cdPos, entry.offset, true); cdPos += 4; // Local header offset
            for (let i = 0; i < entry.name.length; i++) zipBytes[cdPos++] = entry.name.charCodeAt(i);
        });

        // End of central directory
        zipView.setUint32(cdPos, 0x06054b50, true); cdPos += 4;
        zipView.setUint16(cdPos, 0, true); cdPos += 2;
        zipView.setUint16(cdPos, 0, true); cdPos += 2;
        zipView.setUint16(cdPos, entries.length, true); cdPos += 2;
        zipView.setUint16(cdPos, entries.length, true); cdPos += 2;
        zipView.setUint32(cdPos, centralDirSize, true); cdPos += 4;
        zipView.setUint32(cdPos, centralDirStart, true); cdPos += 4;
        zipView.setUint16(cdPos, 0, true);

        return zipBuffer;
    }

    calculateCRC32(data) {
        const table = this.makeCRCTable();
        let crc = 0 ^ (-1);
        for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
        return (crc ^ (-1)) >>> 0;
    }

    makeCRCTable() {
        if (this.crcTable) return this.crcTable;
        const table = [];
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c;
        }
        this.crcTable = table;
        return table;
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async batchProcess(files, options = {}) {
        const results = [];
        for (const file of files) {
            try { results.push({ original: file.name, processed: await this.processImage(file, options), success: true }); }
            catch (e) { results.push({ original: file.name, error: e.message, success: false }); }
        }
        return results;
    }

    async convertFormat(file, format, quality = 0.9) { return this.processImage(file, { format, quality }); }
    async compressImage(file, quality = 0.7) { return this.processImage(file, { quality }); }
    async getImageDimensions(file) { const img = await this.loadImage(file); return { width: img.width, height: img.height }; }
}
