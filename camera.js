class CameraWidget {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.capturedImageData = null;
        this.currentState = 'initial';
        this.isInIframe = window.self !== window.top;
        this.init();
    }

    init() {
        this.createInterface();
        this.setupEventListeners();
        
        // Let parent know widget is ready
        if (this.isInIframe) {
            window.parent.postMessage({
                type: 'widget-ready',
                height: this.getWidgetHeight()
            }, '*');
        }
    }
    
    getWidgetHeight() {
        // Dynamic height based on current state
        switch(this.currentState) {
            case 'camera': return 500;
            case 'preview': return 600;
            case 'uploading': return 200;
            case 'success': return 250;
            default: return 150;
        }
    }

    createInterface() {
        const container = document.getElementById('camera-widget');
        container.innerHTML = `
            <div id="initial-state">
                <button id="start-camera-btn" class="primary-btn">
                    📷 Take Photo
                </button>
            </div>

            <div id="camera-state" style="display: none;">
                <video id="camera-video" autoplay playsinline muted></video>
                <div class="button-row">
                    <button id="capture-btn" class="primary-btn">📸 Capture</button>
                    <button id="cancel-btn" class="secondary-btn">✖ Cancel</button>
                </div>
            </div>

            <div id="preview-state" style="display: none;">
                <canvas id="photo-canvas"></canvas>
                <div class="preview-actions">
                    <button id="approve-btn" class="success-btn">✓ Approve & Upload</button>
                    <button id="retake-btn" class="secondary-btn">↻ Retake</button>
                </div>
            </div>

            <div id="uploading-state" style="display: none;">
                <p>Uploading photo...</p>
                <div class="progress-bar"></div>
            </div>

            <div id="success-state" style="display: none;">
                <p class="success-message">✓ Photo uploaded successfully!</p>
                <button id="new-photo-btn" class="primary-btn">📷 Take Another Photo</button>
            </div>
        `;

        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('photo-canvas');
    }

    setupEventListeners() {
        document.getElementById('start-camera-btn').addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('capture-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.stopCamera();
            this.showState('initial');
        });

        document.getElementById('approve-btn').addEventListener('click', () => {
            this.approvePhoto();
        });

        document.getElementById('retake-btn').addEventListener('click', () => {
            this.showState('camera');
        });

        // Handle new photo button in success state
        document.addEventListener('click', (e) => {
            if (e.target.id === 'new-photo-btn') {
                this.showState('initial');
            }
        });
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 }
                } 
            });
            
            this.video.srcObject = stream;
            this.showState('camera');
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please make sure you have granted camera permissions and are using a secure connection (HTTPS).');
        }
    }

    capturePhoto() {
        const context = this.canvas.getContext('2d');
        
        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(this.video, 0, 0);
        
        // Convert canvas to blob for uploading
        this.canvas.toBlob((blob) => {
            this.capturedImageData = blob;
            this.stopCamera();
            this.showState('preview');
        }, 'image/jpeg', 0.85);
    }

    stopCamera() {
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
        }
    }

    showState(state) {
        // Hide all states
        document.getElementById('initial-state').style.display = 'none';
        document.getElementById('camera-state').style.display = 'none';
        document.getElementById('preview-state').style.display = 'none';
        document.getElementById('uploading-state').style.display = 'none';
        
        const successState = document.getElementById('success-state');
        if (successState) {
            successState.style.display = 'none';
        }
        
        // Show requested state
        document.getElementById(state + '-state').style.display = 'block';
        this.currentState = state;
        
        // Update iframe height if needed
        if (this.isInIframe) {
            setTimeout(() => {
                window.parent.postMessage({
                    type: 'widget-resize',
                    height: this.getWidgetHeight()
                }, '*');
            }, 100);
        }
    }

    approvePhoto() {
        this.showState('uploading');
        this.uploadToJotForm();
    }

    uploadToJotForm() {
        try {
            // Convert blob to base64 for transmission
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                const fileName = 'camera-photo-' + Date.now() + '.jpg';
                
                if (this.isInIframe) {
                    // Send to parent JotForm via postMessage
                    window.parent.postMessage({
                        type: 'jotform-widget-data',
                        data: {
                            name: fileName,
                            file: base64data,
                            size: this.capturedImageData.size,
                            type: 'image/jpeg'
                        }
                    }, '*');
                    
                    console.log('Photo data sent to JotForm parent');
                    this.showState('success');
                } else {
                    // Fallback for testing outside iframe
                    console.log('Testing mode - photo captured:', {
                        name: fileName,
                        size: this.capturedImageData.size,
                        dataLength: base64data.length
                    });
                    
                    setTimeout(() => {
                        this.showState('success');
                    }, 1500);
                }
            };
            
            reader.onerror = () => {
                console.error('Error reading file');
                alert('Error processing photo. Please try again.');
                this.showState('preview');
            };
            
            reader.readAsDataURL(this.capturedImageData);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
            this.showState('preview');
        }
    }
}

// Initialize the widget when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CameraWidget();
});
