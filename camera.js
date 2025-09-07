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
        console.log('Is in iframe:', this.isInIframe);
        this.init();
    }

    init() {
        console.log('Initializing widget...');
        this.createInterface();
        this.setupEventListeners();
        
        // Set initial compact size
        this.resizeContainer(75);
        console.log('Widget initialized');
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
                    <p class="success-message">Your Photo:</p>
                    <div class="thumbnail-container">
                        <img id="uploaded-thumbnail" class="thumbnail-image" />
                        <button id="delete-thumbnail" class="delete-btn">✕</button>
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
        
        const startBtn = document.getElementById('start-camera-btn');
        if (!startBtn) {
            console.error('ERROR: start-camera-btn not found!');
            return;
        }
        
        startBtn.addEventListener('click', () => {
            console.log('Start camera button clicked!');
            this.startCamera();
        });

        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                console.log('Capture button clicked!');
                this.capturePhoto();
            });
        }

        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                console.log('Cancel button clicked!');
                this.stopCamera();
                this.showState('initial');
            });
        }

        const approveBtn = document.getElementById('approve-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                console.log('Approve button clicked!');
                this.approvePhoto();
            });
        }

        const retakeBtn = document.getElementById('retake-btn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => {
                console.log('Retake button clicked!');
                this.showState('camera');
            });
        }

        const replaceBtn = document.getElementById('replace-photo-btn');
        if (replaceBtn) {
            replaceBtn.addEventListener('click', () => {
                console.log('Replace photo button clicked!');
                this.showState('initial');
            });
        }

        const deleteBtn = document.getElementById('delete-thumbnail');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                console.log('Delete thumbnail button clicked!');
                e.stopPropagation();
                this.deletePhoto();
            });
        }
        
        console.log('Event listeners set up successfully');
    }

    resizeContainer(height) {
        console.log('=== RESIZE ATTEMPT ===');
        console.log('Attempting to resize to:', height + 'px');
        console.log('JFCustomWidget available:', typeof window.JFCustomWidget !== 'undefined');
        console.log('Global JFCustomWidget available:', typeof JFCustomWidget !== 'undefined');
        
        setTimeout(() => {
            let resizeAttempted = false;
            
            try {
                // Method 1: Check window.JFCustomWidget
                if (typeof window.JFCustomWidget !== 'undefined') {
                    console.log('Found window.JFCustomWidget:', window.JFCustomWidget);
                    if (typeof window.JFCustomWidget.resize === 'function') {
                        window.JFCustomWidget.resize(height);
                        console.log('✓ Resized using window.JFCustomWidget.resize()');
                        resizeAttempted = true;
                    } else if (typeof window.JFCustomWidget.requestFrameResize === 'function') {
                        window.JFCustomWidget.requestFrameResize(height);
                        console.log('✓ Resized using window.JFCustomWidget.requestFrameResize()');
                        resizeAttempted = true;
                    } else {
                        console.log('window.JFCustomWidget methods:', Object.keys(window.JFCustomWidget));
                    }
                }
                
                // Method 2: Check global JFCustomWidget
                if (!resizeAttempted && typeof JFCustomWidget !== 'undefined') {
                    console.log('Found global JFCustomWidget:', JFCustomWidget);
                    if (typeof JFCustomWidget.resize === 'function') {
                        JFCustomWidget.resize(height);
                        console.log('✓ Resized using global JFCustomWidget.resize()');
                        resizeAttempted = true;
                    } else if (typeof JFCustomWidget.requestFrameResize === 'function') {
                        JFCustomWidget.requestFrameResize(height);
                        console.log('✓ Resized using global JFCustomWidget.requestFrameResize()');
                        resizeAttempted = true;
                    } else {
                        console.log('Global JFCustomWidget methods:', Object.keys(JFCustomWidget));
                    }
                }
                
                // Method 3: PostMessage fallback
                if (!resizeAttempted && window.parent && window.parent !== window) {
                    console.log('Attempting postMessage resize...');
                    window.parent.postMessage({
                        type: 'setHeight',
                        height: height
                    }, '*');
                    console.log('✓ Sent resize message to parent frame');
                    resizeAttempted = true;
                }
                
                if (!resizeAttempted) {
                    console.log('⚠️ No resize method available');
                }
                
            } catch (error) {
                console.error('❌ Resize error:', error);
            }
            
            console.log('=== END RESIZE ATTEMPT ===');
        }, 100);
    }

    async startCamera() {
        console.log('=== START CAMERA ===');
        
        try {
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported');
            }
            
            console.log('Expanding container...');
            this.resizeContainer(400);
            
            console.log('Waiting for resize...');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            console.log('Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            console.log('Camera stream obtained:', stream);
            console.log('Video element:', this.video);
            
            if (!this.video) {
                throw new Error('Video element not found');
            }
            
            this.video.srcObject = stream;
            console.log('Stream assigned to video element');
            
            // Try to play the video
            try {
                await this.video.play();
                console.log('✓ Video playing successfully');
            } catch (playError) {
                console.warn('Video play error (may be normal):', playError);
            }
            
            console.log('Showing camera state...');
            this.showState('camera');
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.resizeContainer(75);
            alert('Could not access camera: ' + error.message);
        }
        
        console.log('=== END START CAMERA ===');
    }

    capturePhoto() {
        console.log('=== CAPTURE PHOTO ===');
        
        if (!this.video || !this.canvas) {
            console.error('Video or canvas not available');
            return;
        }
        
        console.log('Video dimensions:', this.video.videoWidth, 'x', this.video.videoHeight);
        
        const context = this.canvas.getContext('2d');
        
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        context.drawImage(this.video, 0, 0);
        
        this.canvas.toBlob((blob) => {
            console.log('Photo captured, blob size:', blob.size);
            this.capturedImageData = blob;
            this.stopCamera();
            this.showState('preview');
        }, 'image/jpeg', 0.85);
    }

    stopCamera() {
        console.log('Stopping camera...');
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => {
                console.log('Stopping track:', track.kind);
                track.stop();
            });
            this.video.srcObject = null;
            console.log('Camera stopped');
        }
    }

    showState(state) {
        console.log('=== SHOW STATE:', state, '===');
        
        // Hide all states
        const states = ['initial', 'camera', 'preview', 'uploading', 'thumbnail'];
        states.forEach(s => {
            const element = document.getElementById(s + '-state');
            if (element) {
                element.style.display = 'none';
                console.log('Hidden state:', s);
            } else {
                console.warn('State element not found:', s + '-state');
            }
        });
        
        // Show requested state
        const targetElement = document.getElementById(state + '-state');
        if (targetElement) {
            targetElement.style.display = 'block';
            console.log('Shown state:', state);
        } else {
            console.error('Target state element not found:', state + '-state');
        }
        
        this.currentState = state;
        
        // Resize container based on state
        setTimeout(() => {
            switch(state) {
                case 'initial':
                    console.log('Resizing for initial state');
                    this.resizeContainer(75);
                    break;
                case 'camera':
                case 'preview':
                    console.log('Resizing for camera/preview state');
                    this.resizeContainer(400);
                    break;
                case 'uploading':
                    console.log('Resizing for uploading state');
                    this.resizeContainer(120);
                    break;
                case 'thumbnail':
                    console.log('Resizing for thumbnail state');
                    this.resizeContainer(75);
                    break;
            }
        }, 100);
        
        console.log('=== END SHOW STATE ===');
    }

    approvePhoto() {
        console.log('Approving photo...');
        this.showState('uploading');
        this.uploadToJotForm();
    }

    uploadToJotForm() {
        console.log('=== UPLOAD TO JOTFORM ===');
        
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                const fileName = 'photo-' + Date.now() + '.jpg';
                this.uploadedFileName = fileName;
                
                console.log('File prepared:', fileName, 'Size:', base64data.length);
                
                // Check for JFCustomWidget
                if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
                    console.log('Submitting via window.JFCustomWidget');
                    window.JFCustomWidget.submit({
                        type: 'file',
                        data: {
                            file: base64data,
                            filename: fileName
                        }
                    });
                } else if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.submit) {
                    console.log('Submitting via global JFCustomWidget');
                    JFCustomWidget.submit({
                        type: 'file',
                        data: {
                            file: base64data,
                            filename: fileName
                        }
                    });
                } else {
                    console.log('⚠️ JFCustomWidget not available - testing mode');
                }
                
                this.uploadedImageUrl = URL.createObjectURL(this.capturedImageData);
                console.log('Upload complete, showing thumbnail...');
                this.showThumbnail();
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                alert('Error processing photo. Please try again.');
                this.showState('preview');
            };
            
            reader.readAsDataURL(this.capturedImageData);
        } catch (error) {
            console.error('❌ Upload error:', error);
            alert('Upload failed. Please try again.');
            this.showState('preview');
        }
    }

    showThumbnail() {
        console.log('Showing thumbnail...');
        const thumbnailImg = document.getElementById('uploaded-thumbnail');
        if (thumbnailImg && this.uploadedImageUrl) {
            thumbnailImg.src = this.uploadedImageUrl;
            thumbnailImg.onclick = () => {
                console.log('Thumbnail clicked');
                window.open(this.uploadedImageUrl, '_blank');
            };
            console.log('Thumbnail set up');
        }
        this.showState('thumbnail');
    }

    deletePhoto() {
        console.log('Delete photo requested');
        if (confirm('Are you sure you want to delete this photo?')) {
            if (this.uploadedImageUrl) {
                URL.revokeObjectURL(this.uploadedImageUrl);
            }
            
            // Clear the data
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
                window.JFCustomWidget.submit({
                    type: 'file',
                    data: null
                });
            } else if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.submit) {
                JFCustomWidget.submit({
                    type: 'file',
                    data: null
                });
            }
            
            this.uploadedImageUrl = null;
            this.uploadedFileName = null;
            this.capturedImageData = null;
            
            console.log('Photo deleted, returning to initial state');
            this.showState('initial');
        }
    }
}

// Wait for DOM and initialize
console.log('Script loaded, waiting for DOM...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CameraWidget...');
    
    // Check if the container exists
    const container = document.getElementById('camera-widget');
    if (container) {
        console.log('Container found, creating widget...');
        window.cameraWidget = new CameraWidget(); // Make it globally accessible for debugging
    } else {
        console.error('❌ ERROR: #camera-widget element not found in DOM!');
        console.log('Available elements with IDs:', 
            Array.from(document.querySelectorAll('[id]')).map(el => el.id)
        );
    }
});

// Also try immediate initialization in case DOM is already loaded
if (document.readyState === 'loading') {
    console.log('DOM still loading, waiting...');
} else {
    console.log('DOM already loaded, trying immediate initialization...');
    const container = document.getElementById('camera-widget');
    if (container && !window.cameraWidget) {
        console.log('Container found, creating widget immediately...');
        window.cameraWidget = new CameraWidget();
    }
}

// Listen for messages from JotForm
window.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        console.log('📨 Received message:', event.data);
    }
});

// Log global objects for debugging
console.log('Window objects check:');
console.log('- JFCustomWidget:', typeof JFCustomWidget !== 'undefined' ? JFCustomWidget : 'undefined');
console.log('- window.JFCustomWidget:', typeof window.JFCustomWidget !== 'undefined' ? window.JFCustomWidget : 'undefined');
console.log('- navigator.mediaDevices:', navigator.mediaDevices ? 'available' : 'not available');
