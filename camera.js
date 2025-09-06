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
        
        if (this.isInIframe) {
            window.parent.postMessage({
                type: 'widget-ready',
                height: this.getWidgetHeight()
            }, '*');
        }
    }
    
    getWidgetHeight() {
        switch(this.currentState) {
            case 'camera': return 500;
            case 'preview': return 600;
            case 'uploading': return 200;
            case 'success': return 300;
            case 'thumbnail': return 200;
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

            <div id="thumbnail-state" style="display: none;">
                <p class="success-message">Your Photo:</p>
                <div class="thumbnail-container">
                    <img id="uploaded-thumbnail" class="thumbnail-image" />
                    <button id="delete-thumbnail" class="delete-btn">✕</button>
                </div>
                <button id="replace-photo-btn" class="secondary-btn">Replace Photo</button>
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

        document.getElementById('new-photo-btn').addEventListener('click', () => {
            this.showState('initial');
        });

        document.getElementById('replace-photo-btn').addEventListener('click', () => {
            this.showState('initial');
        });

        document.getElementById('delete-thumbnail').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePhoto();
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
        
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        context.drawImage(this.video, 0, 0);
        
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
        document.getElementById('initial-state').style.display = 'none';
        document.getElementById('camera-state').style.display = 'none';
        document.getElementById('preview-state').style.display = 'none';
        document.getElementById('uploading-state').style.display = 'none';
        document.getElementById('success-state').style.display = 'none';
        document.getElementById('thumbnail-state').style.display = 'none';
        
        document.getElementById(state + '-state').style.display = 'block';
        this.currentState = state;
        
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
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                const fileName = 'photo-' + Date.now() + '.jpg';
                this.uploadedFileName = fileName;
                
                // JOTFORM UPLOAD INTEGRATION
                if (this.isInIframe && window.JFCustomWidget) {
                    // Use JotForm's built-in file upload
                    window.JFCustomWidget.submit({
                        type: 'file',
                        data: {
                            file: base64data,
                            filename: fileName,
                            question: 'Camera Photo'
                        }
                    });
                    
                    this.uploadedImageUrl = URL.createObjectURL(this.capturedImageData);
                    this.showThumbnail();
                    
                } else if (this.isInIframe) {
                    // Alternative method using postMessage
                    window.parent.postMessage({
                        type: 'jotform-widget-file-upload',
                        data: {
                            file: base64data,
                            filename: fileName,
                            mimetype: 'image/jpeg'
                        }
                    }, '*');
                    
                    this.uploadedImageUrl = URL.createObjectURL(this.capturedImageData);
                    this.showThumbnail();
                    
                } else {
                    // Testing mode
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
            // Clean up the object URL
            if (this.uploadedImageUrl) {
                URL.revokeObjectURL(this.uploadedImageUrl);
            }
            
            // Notify JotForm that file was removed
            if (this.isInIframe && window.JFCustomWidget) {
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
