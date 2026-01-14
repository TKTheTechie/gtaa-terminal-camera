const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

class ESP32VideoStreamer {
  constructor() {
    this.app = express();
    this.server = null;
    this.mqttClient = null;
    this.streamActive = false;
    this.streamBuffer = Buffer.alloc(0);
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.statsInterval = null;
    this.publishQueue = 0;
    this.droppedFrames = 0;
    
    this.config = {
      solace: {
        host: process.env.SOLACE_MQTT_HOST || 'tcp://localhost:1883',
        username: process.env.SOLACE_USERNAME || 'default',
        password: process.env.SOLACE_PASSWORD || 'default',
        clientId: process.env.SOLACE_CLIENT_ID || 'esp32-video-streamer'
      },
      esp32: {
        ip: process.env.ESP32_CAMERA_IP || '192.168.1.100',
        port: process.env.ESP32_STREAM_PORT || '81',
        path: process.env.ESP32_STREAM_PATH || '/stream'
      },
      server: {
        port: process.env.SERVER_PORT || 3000,
        videoTopicPrefix: process.env.VIDEO_TOPIC_PREFIX || 'video/esp32',
        activeTopic: process.env.ACTIVE_TOPIC || 'aircanada',
        controlTopic: process.env.CONTROL_TOPIC || 'video/esp32/control',
        chunkSize: parseInt(process.env.CHUNK_SIZE) || 8192,
        minFrameInterval: parseInt(process.env.MIN_FRAME_INTERVAL_MS) || 0, // 0 = no throttling
        maxFps: parseInt(process.env.MAX_FPS) || 0 // 0 = unlimited
      }
    };
    
    // Initialize currentVideoTopic after config is set
    this.currentActiveTopic = this.config.server.activeTopic;
    this.currentVideoTopic = `${this.config.server.videoTopicPrefix}/${this.currentActiveTopic}`;
    
    // Calculate min frame interval from MAX_FPS if set
    if (this.config.server.maxFps > 0) {
      this.config.server.minFrameInterval = Math.floor(1000 / this.config.server.maxFps);
    }
  }

  async initialize() {
    try {
      await this.setupMQTT();
      this.setupExpress();
      this.startServer();
      this.startVideoStream();
      console.log('ESP32 Video Streamer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize:', error);
      process.exit(1);
    }
  }

  async setupMQTT() {
    return new Promise((resolve, reject) => {
      console.log('Connecting to Solace MQTT broker...');
      
      const mqttOptions = {
        username: this.config.solace.username,
        password: this.config.solace.password,
        clientId: this.config.solace.clientId,
        clean: true,
        reconnectPeriod: 5000,
        keepalive: 60
      };

      // Try MQTT 5.0 first, fall back to 3.1.1 if not supported
      try {
        mqttOptions.protocolVersion = 5;
        mqttOptions.properties = {
          maximumPacketSize: 268435455,
          receiveMaximum: 65535
        };
      } catch (e) {
        console.log('MQTT 5.0 not supported, using MQTT 3.1.1');
      }

      this.mqttClient = mqtt.connect(this.config.solace.host, mqttOptions);

      this.mqttClient.on('connect', () => {
        console.log('Connected to Solace MQTT broker');
        this.subscribeToControlTopic();
        resolve();
      });

      this.mqttClient.on('error', (error) => {
        console.error('MQTT connection error:', error);
        reject(error);
      });

      this.mqttClient.on('close', () => {
        console.log('MQTT connection closed');
      });

      this.mqttClient.on('message', (topic, message) => {
        if (topic === this.config.server.controlTopic) {
          this.handleControlMessage(topic, message);
        }
      });
    });
  }

  setupExpress() {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        mqtt: this.mqttClient?.connected || false,
        streaming: this.streamActive,
        timestamp: new Date().toISOString()
      });
    });

    // Start streaming endpoint
    this.app.post('/stream/start', async (req, res) => {
      try {
        await this.startVideoStream();
        res.json({ message: 'Video streaming started', status: 'success' });
      } catch (error) {
        res.status(500).json({ message: 'Failed to start streaming', error: error.message });
      }
    });

    // Stop streaming endpoint
    this.app.post('/stream/stop', (req, res) => {
      this.stopVideoStream();
      res.json({ message: 'Video streaming stopped', status: 'success' });
    });

    // Get stream status
    this.app.get('/stream/status', (req, res) => {
      res.json({
        active: this.streamActive,
        esp32Url: `http://${this.config.esp32.ip}:${this.config.esp32.port}${this.config.esp32.path}`,
        videoTopicPrefix: this.config.server.videoTopicPrefix,
        activeTopic: this.currentActiveTopic,
        fullVideoTopic: this.currentVideoTopic,
        controlTopic: this.config.server.controlTopic
      });
    });

    // Change active topic endpoint
    this.app.post('/stream/topic', (req, res) => {
      const { topic } = req.body;
      if (!topic) {
        return res.status(400).json({ message: 'Topic is required', status: 'error' });
      }
      
      this.changeActiveTopic(topic);
      res.json({ 
        message: 'Active topic changed successfully', 
        status: 'success',
        activeTopic: this.currentActiveTopic,
        fullVideoTopic: this.currentVideoTopic
      });
    });
  }

  startServer() {
    this.server = this.app.listen(this.config.server.port, () => {
      console.log(`Server running on port ${this.config.server.port}`);
      console.log(`ESP32 Camera URL: http://${this.config.esp32.ip}:${this.config.esp32.port}${this.config.esp32.path}`);
      console.log(`Control Topic: ${this.config.server.controlTopic}`);
      console.log(`Video Topic Prefix: ${this.config.server.videoTopicPrefix}`);
      console.log(`Active Topic: ${this.currentActiveTopic}`);
      console.log(`Full Video Topic: ${this.currentVideoTopic}`);
      
      if (this.config.server.maxFps > 0) {
        console.log(`Frame Rate Limit: ${this.config.server.maxFps} fps (${this.config.server.minFrameInterval}ms interval)`);
      } else if (this.config.server.minFrameInterval > 0) {
        console.log(`Frame Interval: ${this.config.server.minFrameInterval}ms`);
      } else {
        console.log(`Frame Rate: Unlimited`);
      }
    });
  }
  async startVideoStream() {
    if (this.streamActive) {
      console.log('Stream already active');
      return;
    }

    const streamUrl = `http://${this.config.esp32.ip}:${this.config.esp32.port}${this.config.esp32.path}`;
    console.log(`Starting video stream from: ${streamUrl}`);
    console.log(`Testing connection to ESP32...`);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.config.esp32.ip,
        port: this.config.esp32.port,
        path: this.config.esp32.path,
        method: 'GET',
        headers: {
          'Connection': 'keep-alive',
          'Accept': '*/*'
        },
        timeout: 30000 // 30 second timeout
      };

      console.log(`Connecting to ${options.hostname}:${options.port}${options.path}`);

      const req = http.request(options, (response) => {
        console.log(`HTTP Response: ${response.statusCode} ${response.statusMessage}`);
        console.log(`Headers:`, response.headers);

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        console.log('Connected to ESP32 stream successfully');
        this.streamActive = true;
        let frameBuffer = Buffer.alloc(0);
        let framesDetected = 0;
        let lastFrameDetectedTime = Date.now();
        let totalBytesReceived = 0;
        let lastBytesReport = Date.now();

        // Start stats reporting
        this.startStatsReporting();

        // Disable buffering - process data immediately
        response.on('data', (chunk) => {
          totalBytesReceived += chunk.length;
          
          // Report bytes received every 2 seconds
          const now = Date.now();
          if (now - lastBytesReport > 2000) {
            const bytesPerSecond = totalBytesReceived / ((now - lastBytesReport) / 1000);
            console.log(`Receiving ${(bytesPerSecond / 1024).toFixed(2)} KB/s from ESP32`);
            totalBytesReceived = 0;
            lastBytesReport = now;
          }
          
          frameBuffer = Buffer.concat([frameBuffer, chunk]);
          
          // Look for JPEG frame boundaries
          const startMarker = Buffer.from([0xFF, 0xD8]); // JPEG start
          const endMarker = Buffer.from([0xFF, 0xD9]);   // JPEG end

          let startIndex = 0;
          
          // Process all complete frames in the buffer
          while (true) {
            startIndex = frameBuffer.indexOf(startMarker, startIndex);
            if (startIndex === -1) break;
            
            const endIndex = frameBuffer.indexOf(endMarker, startIndex + 2);
            if (endIndex === -1) break;
            
            // Extract complete JPEG frame
            const frame = frameBuffer.subarray(startIndex, endIndex + 2);
            framesDetected++;
            
            const timeSinceLastFrame = now - lastFrameDetectedTime;
            
            // Log first few frames to verify detection
            if (framesDetected <= 10) {
              console.log(`Frame ${framesDetected} detected: ${frame.length} bytes, ${timeSinceLastFrame}ms since last frame`);
            }
            
            lastFrameDetectedTime = now;
            
            // Throttle frame rate if configured
            if (this.config.server.minFrameInterval === 0 || 
                now - this.lastFrameTime >= this.config.server.minFrameInterval) {
              this.publishVideoFrame(frame);
              this.lastFrameTime = now;
            }

            // Move to next potential frame
            startIndex = endIndex + 2;
          }
          
          // Keep only data after the last processed frame
          if (startIndex > 0) {
            frameBuffer = frameBuffer.subarray(startIndex);
          }

          // Keep buffer size manageable
          if (frameBuffer.length > 100000) {
            console.warn(`Buffer overflow: ${frameBuffer.length} bytes, clearing...`);
            frameBuffer = Buffer.alloc(0);
          }
        });

        response.on('error', (error) => {
          console.error('Stream error:', error);
          this.streamActive = false;
        });

        response.on('end', () => {
          console.log('Stream ended');
          this.streamActive = false;
        });

        resolve();
      });

      req.on('error', (error) => {
        console.error('Failed to connect to ESP32 camera:', error.message);
        this.streamActive = false;
        reject(error);
      });

      req.on('timeout', () => {
        console.error('Connection timeout - ESP32 not responding');
        req.destroy();
        reject(new Error('Connection timeout'));
      });

      req.end();
    });
  }

  publishVideoFrame(frameData) {
    if (!this.mqttClient || !this.mqttClient.connected) {
      return;
    }

    // Drop frames if queue is backing up (more than 1 frame pending)
    if (this.publishQueue > 1) {
      this.droppedFrames++;
      return;
    }

    this.publishQueue++;
    const now = Date.now();
    const frameId = now.toString();

    // Publish frame as binary buffer directly (no base64 encoding)
    // Use a simple header format: frameId|timestamp|frameSize|data
    const header = `${frameId}|${new Date(now).toISOString()}|${frameData.length}|`;
    const headerBuffer = Buffer.from(header, 'utf8');
    const fullMessage = Buffer.concat([headerBuffer, frameData]);

    // Use setImmediate to prevent blocking
    setImmediate(() => {
      this.mqttClient.publish(
        `${this.currentVideoTopic}/stream`,
        fullMessage,
        { qos: 0 },
        (error) => {
          this.publishQueue--;
          if (error) {
            console.error(`Publish error:`, error.message);
          }
        }
      );
    });
    
    this.frameCount++;
  }

  stopVideoStream() {
    this.streamActive = false;
    this.stopStatsReporting();
    console.log('Video streaming stopped');
  }

  startStatsReporting() {
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.lastStatsTime = Date.now();
    this.lastStatsFrameCount = 0;
    const startTime = Date.now();
    
    this.statsInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const totalFps = (this.frameCount / elapsed).toFixed(2);
      
      // Calculate instantaneous FPS (last 5 seconds)
      const intervalSeconds = (now - this.lastStatsTime) / 1000;
      const intervalFrames = this.frameCount - this.lastStatsFrameCount;
      const instantFps = (intervalFrames / intervalSeconds).toFixed(2);
      
      const dropRate = this.droppedFrames > 0 ? ` (${this.droppedFrames} dropped)` : '';
      console.log(`Stats: ${this.frameCount} frames, Avg: ${totalFps} fps, Current: ${instantFps} fps${dropRate}, Queue: ${this.publishQueue}`);
      
      this.lastStatsTime = now;
      this.lastStatsFrameCount = this.frameCount;
    }, 5000); // Report every 5 seconds
  }

  stopStatsReporting() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  subscribeToControlTopic() {
    const controlTopic = this.config.server.controlTopic;
    console.log(`Subscribing to control topic: ${controlTopic}`);
    
    this.mqttClient.subscribe(controlTopic, { qos: 1 }, (error) => {
      if (error) {
        console.error('Failed to subscribe to control topic:', error);
      } else {
        console.log(`✓ Successfully subscribed to control topic: ${controlTopic}`);
        console.log(`  Listening for messages with format: {"controlTopic": "string"}`);
      }
    });
  }

  handleControlMessage(topic, message) {
    if (topic !== this.config.server.controlTopic) {
      return;
    }

    try {
      const payload = JSON.parse(message.toString());
      console.log('=== CONTROL MESSAGE RECEIVED ===');
      console.log(`Topic: ${topic}`);
      console.log(`Payload:`, JSON.stringify(payload, null, 2));
      console.log('================================');

      if (payload.controlTopic && typeof payload.controlTopic === 'string') {
        this.changeActiveTopic(payload.controlTopic);
      } else {
        console.warn('Invalid control message format. Expected: {"controlTopic": "string"}');
      }
    } catch (error) {
      console.error('Failed to parse control message:', error);
      console.error('Raw message:', message.toString());
    }
  }

  changeActiveTopic(newActiveTopic) {
    const oldActiveTopic = this.currentActiveTopic;
    const oldVideoTopic = this.currentVideoTopic;
    
    // Send INACTIVE frame to the old topic before switching
    console.log(`Sending INACTIVE frame to old topic: ${oldVideoTopic}`);
    this.sendInactiveFrame(oldVideoTopic);
    
    // Now change the topic
    this.currentActiveTopic = newActiveTopic;
    this.currentVideoTopic = `${this.config.server.videoTopicPrefix}/${newActiveTopic}`;
    
    console.log('=== TOPIC CHANGED ===');
    console.log(`Old Active Topic: "${oldActiveTopic}"`);
    console.log(`New Active Topic: "${newActiveTopic}"`);
    console.log(`Old Video Topic: "${oldVideoTopic}"`);
    console.log(`New Video Topic: "${this.currentVideoTopic}"`);
    console.log('=====================');
    
    // Publish topic change notification
    if (this.mqttClient && this.mqttClient.connected) {
      const notification = {
        type: 'topic_changed',
        oldActiveTopic,
        newActiveTopic: this.currentActiveTopic,
        oldVideoTopic,
        newVideoTopic: this.currentVideoTopic,
        videoTopicPrefix: this.config.server.videoTopicPrefix,
        timestamp: new Date().toISOString()
      };
      
      this.mqttClient.publish(
        `${this.config.server.controlTopic}/notifications`,
        JSON.stringify(notification),
        { qos: 1 }
      );
      
      console.log(`Published topic change notification to: ${this.config.server.controlTopic}/notifications`);
    }
  }

  sendInactiveFrame(targetTopic) {
    if (!this.mqttClient || !this.mqttClient.connected) {
      console.warn('MQTT client not connected, cannot send INACTIVE frame');
      return;
    }

    try {
      // Create a minimal black JPEG (1x1 pixel) as a placeholder
      // This is a valid 1x1 black JPEG in base64, decoded to buffer
      const blackJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA//2Q==';
      const jpegBuffer = Buffer.from(blackJpegBase64, 'base64');
      
      // Send a special message indicating INACTIVE status
      // The subscriber should detect this and display "INACTIVE"
      const now = Date.now();
      const frameId = now.toString();
      
      // Create a special INACTIVE message format
      const inactiveMessage = {
        frameId,
        timestamp: new Date(now).toISOString(),
        frameSize: jpegBuffer.length,
        type: 'inactive',
        message: 'INACTIVE',
        data: jpegBuffer.toString('base64')
      };

      this.mqttClient.publish(
        `${targetTopic}/stream`,
        JSON.stringify(inactiveMessage),
        { qos: 1 },
        (error) => {
          if (error) {
            console.error(`Failed to publish INACTIVE frame:`, error);
          } else {
            console.log(`✓ INACTIVE message published to ${targetTopic}/stream`);
          }
        }
      );
    } catch (error) {
      console.error('Failed to generate INACTIVE frame:', error);
    }
  }

  async shutdown() {
    console.log('Shutting down server...');
    this.stopVideoStream();
    
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    
    if (this.server) {
      this.server.close();
    }
  }
}

// Initialize and start the server
const streamer = new ESP32VideoStreamer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await streamer.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await streamer.shutdown();
  process.exit(0);
});

// Start the application
streamer.initialize().catch(console.error);