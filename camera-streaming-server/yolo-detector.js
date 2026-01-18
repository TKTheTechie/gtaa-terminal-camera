const ort = require('onnxruntime-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');

class YOLOv8Detector {
  constructor(confidenceThreshold = 0.5, modelSize = 'yolov8n') {
    this.session = null;
    this.confidenceThreshold = confidenceThreshold;
    this.modelSize = modelSize; // yolov8n, yolov8s, yolov8m, yolov8l, yolov8x
    this.modelPath = path.join(__dirname, 'models', `${modelSize}.onnx`);
    this.inputSize = 640;
    
    // COCO class names - person is index 0
    this.classNames = [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
      'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
      'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
      'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
      'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
      'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
      'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
      'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book',
      'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ];
  }

  async initialize() {
    try {
      // Ensure models directory exists
      const modelsDir = path.join(__dirname, 'models');
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }

      // Check if model exists and validate it
      if (fs.existsSync(this.modelPath)) {
        const stats = fs.statSync(this.modelPath);
        console.log(`Found existing ${this.modelSize} model: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
        
        // If file is too small, it's likely corrupted
        if (stats.size < 1000000) {
          console.log('Model file appears corrupted, re-downloading...');
          fs.unlinkSync(this.modelPath);
        }
      }

      // Download model if it doesn't exist
      if (!fs.existsSync(this.modelPath)) {
        console.log(`${this.modelSize} model not found, downloading...`);
        await this.downloadModel();
      }

      // Load ONNX model
      console.log(`Loading ${this.modelSize.toUpperCase()} ONNX model into runtime...`);
      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all'
      });
      
      console.log(`✓ ${this.modelSize.toUpperCase()} model loaded successfully`);
      console.log(`  Input shape: ${JSON.stringify(this.session.inputNames)}`);
      console.log(`  Output shape: ${JSON.stringify(this.session.outputNames)}`);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize YOLOv8 detector:', error);
      
      // If loading failed, delete the model file so it can be re-downloaded
      if (fs.existsSync(this.modelPath)) {
        console.log('Removing corrupted model file...');
        fs.unlinkSync(this.modelPath);
      }
      
      return false;
    }
  }

  async downloadModel() {
    return new Promise((resolve, reject) => {
      // Try multiple sources for the YOLOv8n ONNX model
      const sources = [
        'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx',
        'https://github.com/ultralytics/assets/releases/download/v8.0.0/yolov8n.onnx',
        'https://huggingface.co/Ultralytics/YOLOv8/resolve/main/yolov8n.onnx'
      ];

      let currentSourceIndex = 0;

      const tryDownload = () => {
        if (currentSourceIndex >= sources.length) {
          reject(new Error('Failed to download model from all sources. Please export manually using: pip install ultralytics && yolo export model=yolov8n.pt format=onnx'));
          return;
        }

        const url = sources[currentSourceIndex];
        console.log(`Trying source ${currentSourceIndex + 1}/${sources.length}: ${url}`);

        const file = fs.createWriteStream(this.modelPath);
        let downloadFailed = false;

        const handleDownload = (response) => {
          if (response.statusCode !== 200) {
            console.log(`  Failed: HTTP ${response.statusCode}`);
            downloadFailed = true;
            file.close();
            fs.unlink(this.modelPath, () => {});
            currentSourceIndex++;
            tryDownload();
            return;
          }

          const totalSize = parseInt(response.headers['content-length'], 10);
          let downloadedSize = 0;

          response.on('data', (chunk) => {
            downloadedSize += chunk.length;
            if (totalSize) {
              const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
              process.stdout.write(`\rDownloading YOLOv8n model: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
            }
          });

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              if (!downloadFailed) {
                console.log('\n✓ Model downloaded successfully');
                
                // Verify file size
                const stats = fs.statSync(this.modelPath);
                if (stats.size < 1000000) { // Less than 1MB is suspicious
                  console.error('Downloaded file is too small, may be corrupted');
                  fs.unlink(this.modelPath, () => {});
                  currentSourceIndex++;
                  tryDownload();
                } else {
                  console.log(`  Model size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
                  resolve();
                }
              }
            });
          });

          file.on('error', (err) => {
            downloadFailed = true;
            fs.unlink(this.modelPath, () => {});
            currentSourceIndex++;
            tryDownload();
          });
        };

        https.get(url, (response) => {
          // Handle redirects
          if (response.statusCode === 302 || response.statusCode === 301) {
            https.get(response.headers.location, handleDownload).on('error', () => {
              currentSourceIndex++;
              tryDownload();
            });
          } else {
            handleDownload(response);
          }
        }).on('error', () => {
          currentSourceIndex++;
          tryDownload();
        });
      };

      tryDownload();
    });
  }

  async detect(imageBuffer) {
    if (!this.session) {
      throw new Error('Model not initialized');
    }

    try {
      // Get original image dimensions
      const metadata = await sharp(imageBuffer).metadata();
      const originalWidth = metadata.width;
      const originalHeight = metadata.height;

      // Preprocess image
      const { data, width, height } = await this.preprocessImage(imageBuffer);

      // Create tensor
      const tensor = new ort.Tensor('float32', data, [1, 3, height, width]);

      // Run inference
      const feeds = { images: tensor };
      const results = await this.session.run(feeds);

      // Process outputs
      const output = results.output0.data;
      const detections = this.processOutput(output, originalWidth, originalHeight);

      // Filter for people only
      const people = detections.filter(det => det.label === 'person');

      return people;
    } catch (error) {
      console.error('Detection error:', error);
      return [];
    }
  }

  async preprocessImage(imageBuffer) {
    // Resize and normalize image for YOLOv8
    const image = sharp(imageBuffer);
    const { data, info } = await image
      .resize(this.inputSize, this.inputSize, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert to float32 and normalize to [0, 1]
    const float32Data = new Float32Array(3 * this.inputSize * this.inputSize);
    
    // Convert from HWC to CHW format and normalize
    for (let i = 0; i < this.inputSize * this.inputSize; i++) {
      float32Data[i] = data[i * 3] / 255.0; // R
      float32Data[this.inputSize * this.inputSize + i] = data[i * 3 + 1] / 255.0; // G
      float32Data[2 * this.inputSize * this.inputSize + i] = data[i * 3 + 2] / 255.0; // B
    }

    return {
      data: float32Data,
      width: this.inputSize,
      height: this.inputSize
    };
  }

  processOutput(output, originalWidth, originalHeight) {
    const detections = [];
    
    // YOLOv8 output format: [batch, 84, 8400]
    // 84 = 4 (bbox) + 80 (classes)
    // We need to transpose this to [8400, 84]
    const numDetections = 8400;
    const numValues = 84;

    for (let i = 0; i < numDetections; i++) {
      // Extract values for this detection
      // In the flattened array, values are stored as [all x, all y, all w, all h, all class0, all class1, ...]
      const x = output[i];
      const y = output[numDetections + i];
      const w = output[2 * numDetections + i];
      const h = output[3 * numDetections + i];

      // Get class scores (80 classes starting from index 4 * numDetections)
      let maxScore = 0;
      let maxClass = 0;
      
      for (let j = 0; j < 80; j++) {
        const score = output[(4 + j) * numDetections + i];
        if (score > maxScore) {
          maxScore = score;
          maxClass = j;
        }
      }

      // Filter by confidence threshold
      if (maxScore >= this.confidenceThreshold) {
        // Convert from normalized center format to pixel corner format
        const xmin = (x - w / 2) * (originalWidth / this.inputSize);
        const ymin = (y - h / 2) * (originalHeight / this.inputSize);
        const xmax = (x + w / 2) * (originalWidth / this.inputSize);
        const ymax = (y + h / 2) * (originalHeight / this.inputSize);

        detections.push({
          label: this.classNames[maxClass],
          score: maxScore,
          box: {
            xmin: Math.max(0, xmin),
            ymin: Math.max(0, ymin),
            xmax: Math.min(originalWidth, xmax),
            ymax: Math.min(originalHeight, ymax)
          }
        });
      }
    }

    // Apply NMS (Non-Maximum Suppression)
    return this.applyNMS(detections, 0.45);
  }

  applyNMS(detections, iouThreshold) {
    // Sort by confidence
    detections.sort((a, b) => b.score - a.score);

    const keep = [];
    const suppressed = new Set();

    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue;

      keep.push(detections[i]);

      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue;

        const iou = this.calculateIoU(detections[i].box, detections[j].box);
        if (iou > iouThreshold && detections[i].label === detections[j].label) {
          suppressed.add(j);
        }
      }
    }

    return keep;
  }

  calculateIoU(box1, box2) {
    const xmin = Math.max(box1.xmin, box2.xmin);
    const ymin = Math.max(box1.ymin, box2.ymin);
    const xmax = Math.min(box1.xmax, box2.xmax);
    const ymax = Math.min(box1.ymax, box2.ymax);

    const intersectionArea = Math.max(0, xmax - xmin) * Math.max(0, ymax - ymin);
    const box1Area = (box1.xmax - box1.xmin) * (box1.ymax - box1.ymin);
    const box2Area = (box2.xmax - box2.xmin) * (box2.ymax - box2.ymin);
    const unionArea = box1Area + box2Area - intersectionArea;

    return intersectionArea / unionArea;
  }
}

module.exports = YOLOv8Detector;
