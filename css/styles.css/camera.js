/* Camera Widget Styles */
#camera-widget {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
    text-align: center;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
}

/* Button Styles */
.primary-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 12px 24px;
    font-size: 16px;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px;
    transition: background-color 0.3s;
}

.primary-btn:hover {
    background-color: #0056b3;
}

.secondary-btn {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px;
    transition: background-color 0.3s;
}

.secondary-btn:hover {
    background-color: #545b62;
}

.success-btn {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 12px 24px;
    font-size: 16px;
    border-radius: 5px;
    cursor: pointer;
    margin: 5px;
    transition: background-color 0.3s;
}

.success-btn:hover {
    background-color: #1e7e34;
}

/* Video Styles */
#camera-video {
    width: 100%;
    max-width: 350px;
    height: auto;
    border: 2px solid #007bff;
    border-radius: 8px;
    margin-bottom: 10px;
}

/* Canvas (Photo Preview) Styles */
#photo-canvas {
    width: 100%;
    max-width: 350px;
    height: auto;
    border: 2px solid #28a745;
    border-radius: 8px;
    margin-bottom: 10px;
}

/* Preview Actions */
.preview-actions {
    margin-top: 15px;
}

/* Upload State */
#uploading-state {
    padding: 20px;
}

#uploading-state p {
    font-size: 18px;
    color: #007bff;
    margin-bottom: 10px;
}

.progress-bar {
    width: 100%;
    height: 10px;
    background-color: #e0e0e0;
    border-radius: 5px;
    overflow: hidden;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { background-color: #e0e0e0; }
    50% { background-color: #007bff; }
    100% { background-color: #e0e0e0; }
}

/* Mobile Responsive */
@media (max-width: 480px) {
    #camera-widget {
        margin: 10px;
        padding: 15px;
    }
    
    #camera-video, #photo-canvas {
        max-width: 100%;
    }
    
    .primary-btn, .success-btn {
        width: 100%;
        margin-bottom: 10px;
    }
}