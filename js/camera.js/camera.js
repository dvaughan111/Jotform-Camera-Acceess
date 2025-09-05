class CameraWidget {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.capturedImageData = null;
        this.currentState = 'initial'; // initial, camera, preview
        this.init();
    }

    init() {
        this.createInterface();
        this.setupEventListeners();
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
                <video id="camera-video" autoplay playsinline></video>
                <button id="capture-btn" class="primary-btn">Capture</button>
                <button id="cancel-btn" class="secondary-btn">Cancel</button>
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
        `;

        // Get references to elements
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('photo-canvas');
    }

    setupEventListeners() {
        // Start camera button
        document.getElementById('start-camera-btn').addEventListener('click', () => {
            this.startCamera();
        });

        // Capture photo button
        document.getElementById('capture-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        // Cancel camera button
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.stopCamera();
            this.showState('initial');
        });

        // Approve photo button
        document.getElementById('approve-btn').addEventListener('click', () => {
            this.approvePhoto();
        });

        // Retake photo button
        document.getElementById('retake-btn').addEventListener('click', () => {
            this.showState('camera');
        });
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Use back camera on mobile
                } 
            });
            
            this.video.srcObject = stream;
            this.showState('camera');
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please make sure you have granted camera permissions.');
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
        }, 'image/jpeg', 0.8);
        
        this.stopCamera();
        this.showState('preview');
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
        
        // Show requested state
        document.getElementById(state + '-state').style.display = 'block';
        this.currentState = state;
    }

    approvePhoto() {
        this.showState('uploading');
        this.uploadToJotForm();
    }

    uploadToJotForm() {
        // This will integrate with JotForm's widget API
        // For now, let's just simulate the upload
        console.log('Uploading photo...', this.capturedImageData);
        
        setTimeout(() => {
            alert('Photo uploaded successfully!');
            this.showState('initial');
        }, 2000);
    }
}

// Initialize the widget when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CameraWidget();
});