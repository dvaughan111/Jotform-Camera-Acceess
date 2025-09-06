class CameraWidget {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.capturedImageData = null;
        this.currentState = 'initial';
        this.isInIframe = window.self !== window.top;
        this.uploadedImageUrl = null;
        this.uploadedFileName = null;
        this.init();
    }

    init() {
        this.createInterface();
        this.setupEventListeners();
        
        // Set initial compact size
        this.updateWidgetSize(120); // Compact height for just the button
    }

    createInterface() {
        const container = document.getElementById('camera-widget');
        container.innerHTML = `
            <div class="widget-container">
                <div id="initial-state" class="state-container compact-view">
                    <button id="start-camera-btn" class="primary-btn">
                        📷 Take Photo
                    </button>
                </div>

                <div id="camera-state" class="state-container expanded-view" style="display: none;">
                    <video id="camera-video" autoplay playsinline muted></video>
                    <div class="button-row">
                        <button id="capture-btn" class="primary-btn">📸 Capture</button>
                        <button id="cancel-btn" class="secondary-btn">✖ Cancel</button>
                    </div>
                </div>

                <div id="preview-state" class="state-container expanded-view" style="display: none;">
                    <canvas id="photo-canvas"></canvas>
                    <div class="preview-actions">
                        <button id="approve-btn" class="success-btn">✓ Approve & Upload</button>
                        <button id="retake-btn" class="secondary-btn">↻ Retake</button>
                    </div>
                </div>

                <div id="uploading-state" class="state-container compact-view" style="display: none;">
                    <p class="uploading-text">Uploading photo...</p>
                    <div class="progress-bar"></div>
                </div>

                <div id="thumbnail-state" class="state-container compact-view" style="display: none;">
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

        document.getElementById('replace-photo-btn').addEventListener('click', () => {
            this.showState('initial');
        });

        document.getElementById('delete-thumbnail').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePhoto();
        });
    }

    updateWidgetSize(height) {
        if (this.isInIframe && window.JFCustomWidget) {
            window.JFCustomWidget.resize(height);
        }
    }

    async startCamera() {
        try {
            // Expand widget before starting camera
            this.updateWidgetSize(400);
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            this.video.srcObject = stream;
            this.showState('camera');
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            // Reset to compact size on error
            this.updateWidgetSize(120);
            alert('Could not access camera. Please make sure you have granted camera permissions and are using a secure connection (HTTPS).');
        }
    }

    capturePhoto() {
        const context = this.canvas.getContext('2d');
        
        this.canvas.width = 640;
        this.canvas.height = 480;
        
        context.drawImage(this.video, 0, 0, 640, 480);
        
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
        const states = ['initial', 'camera', 'preview', 'uploading', 'thumbnail'];
        states.forEach(s => {
            document.getElementById(s + '-state').style.display = 'none';
        });
        
        // Show requested state
        document.getElementById(state + '-state').style.display = 'block';
        this.currentState = state;
        
        // Update widget size based on state
        switch(state) {
            case 'initial':
                this.updateWidgetSize(120); // Compact
                break;
            case 'camera':
            case 'preview':
                this.updateWidgetSize(500); // Expanded for camera/preview
                break;
            case 'uploading':
                this.updateWidgetSize(100); // Compact for uploading
                break;
            case 'thumbnail':
                this.updateWidgetSize(200); // Compact for thumbnail
                break;
        }
    }

    approvePhoto() {
        this.showState('uploading');
        this.uploadToJotForm();
    }

    uploadToJotForm() {
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                const fileName = 'photo-' + Date.now() + '.jpg';
                this.uploadedFileName = fileName;
                
                if (window.JFCustomWidget) {
                    window.JFCustomWidget.submit({
                        type: 'file',
                        data: {
                            file: base64data,
                            filename: fileName
                        }
                    });
                    
                    this.uploadedImageUrl = URL.createObjectURL(this.capturedImageData);
                    this.showThumbnail();
                    
                } else {
                    // Fallback for testing
                    console.log('Testing mode - would upload:', fileName);
                    this.uploadedImageUrl = URL.createObjectURL(this.capturedImageData);
                    setTimeout(() => {
                        this.showThumbnail();
                    }, 1000);
                }
            };
            
            reader.onerror = () => {
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

    showThumbnail() {
        const thumbnailImg = document.getElementById('uploaded-thumbnail');
        if (thumbnailImg && this.uploadedImageUrl) {
            thumbnailImg.src = this.uploadedImageUrl;
            thumbnailImg.onclick = () => {
                window.open(this.uploadedImageUrl, '_blank');
            };
        }
        this.showState('thumbnail');
    }

    deletePhoto() {
        if (confirm('Are you sure you want to delete this photo?')) {
            if (this.uploadedImageUrl) {
                URL.revokeObjectURL(this.uploadedImageUrl);
            }
            
            if (window.JFCustomWidget) {
                window.JFCustomWidget.submit({
                    type: 'file',
                    data: null
                });
            }
            
            this.uploadedImageUrl = null;
            this.uploadedFileName = null;
            this.capturedImageData = null;
            
            this.showState('initial');
        }
    }
}

// Initialize the widget when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CameraWidget();
});
