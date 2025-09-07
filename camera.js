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
        this.resizeContainer(75);
    }

    createInterface() {
        const container = document.getElementById('camera-widget');
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

    resizeContainer(height) {
        console.log('Attempting to resize to:', height + 'px');
        
        setTimeout(() => {
            try {
                // Method 1: Check if JFCustomWidget exists and has resize method
                if (typeof window.JFCustomWidget !== 'undefined') {
                    if (typeof window.JFCustomWidget.resize === 'function') {
                        window.JFCustomWidget.resize(height);
                        console.log('Resized using JFCustomWidget.resize()');
                    } else if (typeof window.JFCustomWidget.requestFrameResize === 'function') {
                        window.JFCustomWidget.requestFrameResize(height);
                        console.log('Resized using JFCustomWidget.requestFrameResize()');
                    }
                }
                // Method 2: Try global JFCustomWidget
                else if (typeof JFCustomWidget !== 'undefined') {
                    if (typeof JFCustomWidget.resize === 'function') {
                        JFCustomWidget.resize(height);
                        console.log('Resized using global JFCustomWidget.resize()');
                    } else if (typeof JFCustomWidget.requestFrameResize === 'function') {
                        JFCustomWidget.requestFrameResize(height);
                        console.log('Resized using global JFCustomWidget.requestFrameResize()');
                    }
                }
                // Method 3: PostMessage fallback
                else if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'setHeight',
                        height: height
                    }, '*');
                    console.log('Sent resize message to parent frame');
                }
            } catch (error) {
                console.error('Resize error:', error);
            }
        }, 100);
    }

    async startCamera() {
        try {
            // Expand container FIRST before starting camera
            this.resizeContainer(400);
            
            // Small delay to let resize happen before camera starts
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            this.video.srcObject = stream;
            
            // Manually start video playback since autoplay is restricted
            this.video.play().then(() => {
                console.log('Video started successfully');
                this.showState('camera');
            }).catch((playError) => {
                console.warn('Autoplay prevented, but video stream is ready:', playError);
                this.showState('camera');
            });
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            // Reset size on error
            this.resizeContainer(75);
            alert('Could not access camera. Please make sure you have granted camera permissions.');
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
            this.video.srcObject = null;
        }
    }

    showState(state) {
        // Hide all states
        const states = ['initial', 'camera', 'preview', 'uploading', 'thumbnail'];
        states.forEach(s => {
            const element = document.getElementById(s + '-state');
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Show requested state
        const targetElement = document.getElementById(state + '-state');
        if (targetElement) {
            targetElement.style.display = 'block';
        }
        
        this.currentState = state;
        
        // Resize container based on state
        setTimeout(() => {
            switch(state) {
                case 'initial':
                    this.resizeContainer(75);
                    break;
                case 'camera':
                case 'preview':
                    this.resizeContainer(400);
                    break;
                case 'uploading':
                    this.resizeContainer(120);
                    break;
                case 'thumbnail':
                    this.resizeContainer(75);
                    break;
            }
        }, 100);
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
                
                // Check for JFCustomWidget properly
                if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
                    window.JFCustomWidget.submit({
                        type: 'file',
                        data: {
                            file: base64data,
                            filename: fileName
                        }
                    });
                } else if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.submit) {
                    JFCustomWidget.submit({
                        type: 'file',
                        data: {
                            file: base64data,
                            filename: fileName
                        }
                    });
                } else {
                    console.log('Testing mode - JFCustomWidget not available');
                }
                
                this.uploadedImageUrl = URL.createObjectURL(this.capturedImageData);
                this.showThumbnail();
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
                // Open in same window instead of new tab to avoid popup restrictions
                const img = new Image();
                img.src = this.uploadedImageUrl;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    newWindow.document.body.appendChild(img);
                } else {
                    // Fallback: create modal-like view
                    this.showImageModal(this.uploadedImageUrl);
                }
            };
        }
        this.showState('thumbnail');
    }

    showImageModal(imageUrl) {
        // Simple modal fallback for viewing image
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        `;
        
        modal.appendChild(img);
        modal.onclick = () => modal.remove();
        
        document.body.appendChild(modal);
    }

    deletePhoto() {
        if (confirm('Are you sure you want to delete this photo?')) {
            if (this.uploadedImageUrl) {
                URL.revokeObjectURL(this.uploadedImageUrl);
            }
            
            // Properly check for JFCustomWidget before using
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
            
            this.showState('initial');
        }
    }
}

// Initialize the widget when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CameraWidget();
});

// Listen for messages from JotForm
window.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        console.log('Received message:', event.data.type);
    }
});
