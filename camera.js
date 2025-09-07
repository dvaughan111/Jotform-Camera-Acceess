class CameraWidget {
    constructor() {
        console.log('CameraWidget constructor called');
        this.video = null;
        this.canvas = null;
        this.capturedImageData = null;
        this.currentState = 'initial';
        this.isInIframe = window.self !== window.top;
        this.uploadedImageUrl = null;
        this.uploadedFileName = null;
        this.jfWidgetReady = false;
        
        console.log('Is in iframe:', this.isInIframe);
        
        // Wait for JotForm widget to be ready
        this.waitForJotFormReady().then(() => {
            this.init();
        });
    }

    async waitForJotFormReady() {
        console.log('Waiting for JotForm widget to be ready...');
        
        // Try multiple times to find JotForm widget API
        for (let i = 0; i < 20; i++) {
            if (typeof window.JFCustomWidget !== 'undefined' || typeof JFCustomWidget !== 'undefined') {
                console.log('JotForm widget API found!');
                this.jfWidgetReady = true;
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('JotForm widget API not found, proceeding anyway...');
    }

    init() {
        console.log('Initializing widget...');
        this.createInterface();
        this.setupEventListeners();
        
        // Set initial compact size
        this.resizeContainer(75);
        
        // Notify JotForm that widget is ready
        this.notifyJotFormReady();
        
        console.log('Widget initialized');
    }

    notifyJotFormReady() {
        try {
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.ready) {
                window.JFCustomWidget.ready();
                console.log('Notified JotForm that widget is ready');
            } else if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.ready) {
                JFCustomWidget.ready();
                console.log('Notified JotForm that widget is ready (global)');
            }
        } catch (e) {
            console.log('Could not notify JotForm ready:', e);
        }
    }

    createInterface() {
        console.log('Creating interface...');
        const container = document.getElementById('camera-widget');
        
        if (!container) {
            console.error('ERROR: camera-widget element not found!');
            return;
        }
        
        console.log('Container found:', container);
        
        container.innerHTML = `
            <div class="widget-container">
                <div id="initial-state" class="state-container">
                    <button id="start-camera-btn" class="primary-btn">
                        📷 Take Photo
                    </button>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">Click to access camera</p>
                </div>

                <div id="camera-state" class="state-container" style="display: none;">
                    <div class="video-container">
                        <video id="camera-video" playsinline muted></video>
                    </div>
                    <div class="button-row">
                        <button id="capture-btn" class="primary-btn">📸 Capture</button>
                        <button id="cancel-btn" class="secondary-btn">✖ Cancel</button>
                    </div>
                </div>

                <div id="preview-state" class="state-container" style="display: none;">
                    <div class="preview-container">
                        <canvas id="photo-canvas"></canvas>
                    </div>
                    <div class="preview-actions">
                        <button id="approve-btn" class="success-btn">✓ Approve & Upload</button>
                        <button id="retake-btn" class="secondary-btn">↻ Retake</button>
                    </div>
                </div>

                <div id="uploading-state" class="state-container" style="display: none;">
                    <p class="uploading-text">Uploading photo...</p>
                    <div class="progress-bar"></div>
                </div>

                <div id="thumbnail-state" class="state-container" style="display: none;">
                    <p class="success-message">Photo Uploaded!</p>
                    <div class="thumbnail-container">
                        <img id="uploaded-thumbnail" class="thumbnail-image" alt="Captured photo" />
                        <button id="delete-thumbnail" class="delete-btn" title="Delete photo">✕</button>
                    </div>
                    <button id="replace-photo-btn" class="secondary-btn">Replace Photo</button>
                </div>
            </div>
        `;

        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('photo-canvas');
        
        console.log('Video element:', this.video);
        console.log('Canvas element:', this.canvas);
        console.log('Interface created successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Use event delegation for more reliable event binding
        document.addEventListener('click', (e) => {
            console.log('Click detected on:', e.target.id, e.target.className);
            
            switch(e.target.id) {
                case 'start-camera-btn':
                    console.log('Start camera button clicked!');
                    e.preventDefault();
                    this.startCamera();
                    break;
                case 'capture-btn':
                    console.log('Capture button clicked!');
                    e.preventDefault();
                    this.capturePhoto();
                    break;
                case 'cancel-btn':
                    console.log('Cancel button clicked!');
                    e.preventDefault();
                    this.stopCamera();
                    this.showState('initial');
                    break;
                case 'approve-btn':
                    console.log('Approve button clicked!');
                    e.preventDefault();
                    this.approvePhoto();
                    break;
                case 'retake-btn':
                    console.log('Retake button clicked!');
                    e.preventDefault();
                    this.showState('camera');
                    break;
                case 'replace-photo-btn':
                    console.log('Replace photo button clicked!');
                    e.preventDefault();
                    this.showState('initial');
                    break;
                case 'delete-thumbnail':
                    console.log('Delete thumbnail button clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.deletePhoto();
                    break;
            }
        });
        
        console.log('Event listeners set up successfully');
    }

    resizeContainer(height) {
        console.log('=== RESIZE ATTEMPT to', height + 'px ===');
        
        // Use requestAnimationFrame for smoother resizing
        requestAnimationFrame(() => {
            try {
                let success = false;
                
                // Method 1: JotForm widget API
                if (typeof window.JFCustomWidget !== 'undefined') {
                    console.log('Using window.JFCustomWidget');
                    if (window.JFCustomWidget.resize) {
                        window.JFCustomWidget.resize(height);
                        console.log('✅ Resized via window.JFCustomWidget.resize');
                        success = true;
                    } else if (window.JFCustomWidget.requestFrameResize) {
                        window.JFCustomWidget.requestFrameResize(height);
                        console.log('✅ Resized via window.JFCustomWidget.requestFrameResize');
                        success = true;
                    }
                } else if (typeof JFCustomWidget !== 'undefined') {
                    console.log('Using global JFCustomWidget');
                    if (JFCustomWidget.resize) {
                        JFCustomWidget.resize(height);
                        console.log('✅ Resized via JFCustomWidget.resize');
                        success = true;
                    } else if (JFCustomWidget.requestFrameResize) {
                        JFCustomWidget.requestFrameResize(height);
                        console.log('✅ Resized via JFCustomWidget.requestFrameResize');
                        success = true;
                    }
                }
                
                // Method 2: PostMessage to parent
                if (!success && window.parent && window.parent !== window) {
                    const messages = [
                        { type: 'widget-resize', height: height },
                        { type: 'setHeight', height: height },
                        { type: 'resize', height: height },
                        { action: 'resize', height: height }
                    ];
                    
                    messages.forEach(msg => {
                        try {
                            window.parent.postMessage(msg, '*');
                        } catch (e) {
                            console.log('PostMessage failed:', e);
                        }
                    });
                    
                    console.log('📤 Sent resize messages to parent');
                    success = true;
                }
                
                // Method 3: Direct iframe manipulation
                if (!success) {
                    try {
                        if (window.frameElement) {
                            window.frameElement.style.height = height + 'px';
                            console.log('✅ Direct iframe resize');
                            success = true;
                        }
                    } catch (e) {
                        console.log('Direct iframe resize failed:', e);
                    }
                }
                
                console.log(success ? '✅ Resize completed' : '❌ All resize methods failed');
                
            } catch (error) {
                console.error('❌ Resize error:', error);
            }
        });
    }

    async startCamera() {
        console.log('=== START CAMERA ===');
        
        try {
            // First, expand the container
            console.log('Expanding container to 400px...');
            this.resizeContainer(400);
            
            // Show camera state immediately for better UX
            this.showState('camera');
            
            // Wait a bit for resize
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Check camera support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device/browser');
            }
            
            console.log('Requesting camera access...');
            
            // Request camera with mobile-optimized constraints
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' }, // Prefer back camera
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 }
                },
                audio: false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Camera stream obtained');
            
            if (!this.video) {
                throw new Error('Video element not found');
            }
            
            this.video.srcObject = stream;
            
            // Handle video loading
            this.video.onloadedmetadata = () => {
                console.log('Video metadata loaded:', this.video.videoWidth + 'x' + this.video.videoHeight);
                this.video.play().catch(e => {
                    console.warn('Video play failed (may be normal):', e);
                });
            };
            
            this.video.onerror = (e) => {
                console.error('Video error:', e);
            };
            
        } catch (error) {
            console.error('❌ Camera error:', error.name, error.message);
            
            // Show user-friendly error message
            const errorMsg = error.name === 'NotAllowedError' ? 
                'Camera access denied. Please allow camera permissions and try again.' :
                error.name === 'NotFoundError' ?
                'No camera found on this device.' :
                'Camera error: ' + error.message;
                
            alert(errorMsg);
            
            // Reset to initial state
            this.resizeContainer(75);
            this.showState('initial');
        }
    }

    capturePhoto() {
        console.log('=== CAPTURE PHOTO ===');
        
        if (!this.video || !this.canvas) {
            console.error('Video or canvas not available');
            alert('Cannot capture photo. Please try again.');
            return;
        }
        
        if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
            console.error('Video not ready');
            alert('Video not ready. Please wait a moment and try again.');
            return;
        }
        
        console.log('Video dimensions:', this.video.videoWidth + 'x' + this.video.videoHeight);
        
        const context = this.canvas.getContext('2d');
        
        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Draw the video frame to canvas
        context.drawImage(this.video, 0, 0);
        
        // Convert to blob
        this.canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Failed to create image blob');
                alert('Failed to capture photo. Please try again.');
                return;
            }
            
            console.log('✅ Photo captured, blob size:', blob.size, 'bytes');
            this.capturedImageData = blob;
            this.stopCamera();
            this.showState('preview');
        }, 'image/jpeg', 0.9);
    }

    stopCamera() {
        console.log('Stopping camera...');
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => {
                console.log('Stopping track:', track.kind);
                track.stop();
            });
            this.video.srcObject = null;
            console.log('✅ Camera stopped');
        }
    }

    showState(state) {
        console.log('=== SHOW STATE:', state.toUpperCase(), '===');
        
        // Hide all states
        const states = ['initial', 'camera', 'preview', 'uploading', 'thumbnail'];
        states.forEach(s => {
            const element = document.getElementById(s + '-state');
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Show target state
        const targetElement = document.getElementById(state + '-state');
        if (targetElement) {
            targetElement.style.display = 'block';
            console.log('✅ State shown:', state);
        } else {
            console.error('❌ State element not found:', state + '-state');
            return;
        }
        
        this.currentState = state;
        
        // Resize based on state
        setTimeout(() => {
            const heights = {
                'initial': 75,
                'camera': 400,
                'preview': 400,
                'uploading': 120,
                'thumbnail': 75
            };
            
            const height = heights[state] || 75;
            console.log(`Resizing for ${state} state to ${height}px`);
            this.resizeContainer(height);
        }, 100);
    }

    approvePhoto() {
        console.log('=== APPROVE PHOTO ===');
        this.showState('uploading');
        setTimeout(() => this.uploadToJotForm(), 500);
    }

    uploadToJotForm() {
        console.log('=== UPLOAD TO JOTFORM ===');
        
        if (!this.capturedImageData) {
            console.error('No image data to upload');
            this.showState('preview');
            return;
        }
        
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                const fileName = 'camera-photo-' + Date.now() + '.jpg';
                
                console.log('📁 File prepared:', fileName);
                console.log('📊 Data size:', Math.round(base64data.length / 1024) + 'KB');
                
                // Submit to JotForm
                this.submitToJotForm(base64data, fileName);
                
                // Create thumbnail URL
                this.uploadedImageUrl = URL.createObjectURL(this.capturedImageData);
                this.uploadedFileName = fileName;
                
                console.log('✅ Upload process completed');
                
                // Show thumbnail after delay
                setTimeout(() => {
                    this.showThumbnail();
                }, 1000);
            };
            
            reader.onerror = (error) => {
                console.error('❌ FileReader error:', error);
                alert('Error processing photo. Please try again.');
                this.showState('preview');
            };
            
            reader.readAsDataURL(this.capturedImageData);
            
        } catch (error) {
            console.error('❌ Upload preparation error:', error);
            alert('Upload failed. Please try again.');
            this.showState('preview');
        }
    }

    submitToJotForm(base64data, fileName) {
        try {
            const fileData = {
                type: 'file',
                data: {
                    file: base64data,
                    filename: fileName
                }
            };
            
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
                console.log('📤 Submitting via window.JFCustomWidget');
                window.JFCustomWidget.submit(fileData);
            } else if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.submit) {
                console.log('📤 Submitting via global JFCustomWidget');
                JFCustomWidget.submit(fileData);
            } else {
                console.log('⚠️ JotForm API not available - running in test mode');
                // In test mode, we still show success
            }
            
        } catch (error) {
            console.error('❌ JotForm submission error:', error);
        }
    }

    showThumbnail() {
        console.log('=== SHOW THUMBNAIL ===');
        
        const thumbnailImg = document.getElementById('uploaded-thumbnail');
        if (thumbnailImg && this.uploadedImageUrl) {
            thumbnailImg.src = this.uploadedImageUrl;
            thumbnailImg.onload = () => {
                console.log('✅ Thumbnail loaded');
            };
            thumbnailImg.onclick = () => {
                console.log('🖼️ Thumbnail clicked - opening full view');
                this.openImageFullView();
            };
        }
        
        this.showState('thumbnail');
    }

    openImageFullView() {
        // Try to open in new window/tab
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(`
                <html>
                    <head><title>Captured Photo</title></head>
                    <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                        <img src="${this.uploadedImageUrl}" style="max-width:100%; max-height:100vh; object-fit:contain;" alt="Captured photo">
                    </body>
                </html>
            `);
        } else {
            // Fallback: show inline modal
            this.showInlineImageModal();
        }
    }

    showInlineImageModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center;
            z-index: 10000; cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = this.uploadedImageUrl;
        img.style.cssText = 'max-width: 95%; max-height: 95%; object-fit: contain;';
        
        modal.appendChild(img);
        modal.onclick = () => modal.remove();
        
        document.body.appendChild(modal);
    }

    deletePhoto() {
        console.log('=== DELETE PHOTO ===');
        
        if (confirm('Are you sure you want to delete this photo?')) {
            // Clean up URLs
            if (this.uploadedImageUrl) {
                URL.revokeObjectURL(this.uploadedImageUrl);
            }
            
            // Submit null data to JotForm
            this.submitToJotForm(null, null);
            
            // Reset data
            this.uploadedImageUrl = null;
            this.uploadedFileName = null;
            this.capturedImageData = null;
            
            console.log('✅ Photo deleted');
            this.showState('initial');
        }
    }
}

// Initialize when ready
console.log('🚀 Camera widget script loaded');

function initializeWidget() {
    console.log('🔍 Checking for container...');
    const container = document.getElementById('camera-widget');
    
    if (container && !window.cameraWidget) {
        console.log('✅ Container found, initializing widget...');
        window.cameraWidget = new CameraWidget();
    } else if (!container) {
        console.log('❌ Container not found yet...');
    } else {
        console.log('⚠️ Widget already initialized');
    }
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
    initializeWidget();
}

// Also try after a short delay in case of timing issues
setTimeout(initializeWidget, 100);
setTimeout(initializeWidget, 500);

// Message listener
window.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        console.log('📨 Received message:', event.data);
    }
});

// Expose for debugging
window.debugCamera = () => {
    console.log('🐛 Debug info:');
    console.log('- Widget instance:', window.cameraWidget);
    console.log('- Container:', document.getElementById('camera-widget'));
    console.log('- JFCustomWidget:', typeof JFCustomWidget !== 'undefined' ? JFCustomWidget : 'undefined');
    console.log('- window.JFCustomWidget:', typeof window.JFCustomWidget !== 'undefined' ? window.JFCustomWidget : 'undefined');
    console.log('- Camera API:', navigator.mediaDevices ? 'available' : 'not available');
};

console.log('📋 Run window.debugCamera() in console for debug info');
