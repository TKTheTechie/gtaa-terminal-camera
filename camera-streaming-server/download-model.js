const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadModel() {
  const modelsDir = path.join(__dirname, 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  const modelPath = path.join(modelsDir, 'yolov8n.onnx');

  // Direct link to YOLOv8n ONNX model (6.2MB)
  const url = 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx';

  console.log('Downloading YOLOv8n ONNX model...');
  console.log(`URL: ${url}`);

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      maxRedirects: 5,
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = ((progressEvent.loaded / progressEvent.total) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${progress}% (${(progressEvent.loaded / 1024 / 1024).toFixed(1)}MB / ${(progressEvent.total / 1024 / 1024).toFixed(1)}MB)`);
        }
      }
    });

    const writer = fs.createWriteStream(modelPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('\n✓ Model downloaded successfully!');
        const stats = fs.statSync(modelPath);
        console.log(`Model size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('\n✗ Download failed:', error.message);
    console.log('\nAlternative: Export the model manually using Python:');
    console.log('  pip install ultralytics');
    console.log('  python -c "from ultralytics import YOLO; YOLO(\'yolov8n.pt\').export(format=\'onnx\')"');
    console.log(`  mv yolov8n.onnx ${modelPath}`);
    process.exit(1);
  }
}

downloadModel();
