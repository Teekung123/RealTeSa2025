import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Sidebar from './Sidebar';

function ImageViewer() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [detections, setDetections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterCamera, setFilterCamera] = useState('all');
    const itemsPerPage = 12;

    useEffect(() => {
        fetchDetections();
        // เรียกข้อมูลทุก 10 วินาที
        const interval = setInterval(fetchDetections, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchDetections = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/detections');
            const data = response.data.data || [];
            // เรียงตาม timestamp ล่าสุดก่อน
            const sorted = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setDetections(sorted);
            setLoading(false);
        } catch (error) {
            console.error('❌ Error fetching detections:', error);
            setLoading(false);
        }
    };

    // Filter ตามกล้อง
    const filteredDetections = filterCamera === 'all' 
        ? detections 
        : detections.filter(d => (d.cameraId || d.deviceId) === filterCamera);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDetections.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDetections.length / itemsPerPage);

    // ดึงรายชื่อกล้องทั้งหมด
    const cameraList = [...new Set(detections.map(d => d.cameraId || d.deviceId))];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e' }}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <div style={{ 
                flex: 1, 
                padding: '20px', 
                overflowY: 'auto',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ 
                        background: 'rgba(255,255,255,0.95)', 
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>
                            📷 Image Detection Viewer
                        </h2>
                        
                        {/* Filter และ Stats */}
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                                    Filter by Camera:
                                </label>
                                <select
                                    value={filterCamera}
                                    onChange={(e) => { setFilterCamera(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="all">🌐 All Cameras ({detections.length})</option>
                                    {cameraList.map(cam => (
                                        <option key={cam} value={cam}>
                                            📷 {cam} ({detections.filter(d => (d.cameraId || d.deviceId) === cam).length})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '15px',
                                padding: '10px',
                                background: '#f0f9ff',
                                borderRadius: '8px',
                                border: '2px solid #3b82f6'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                                        {filteredDetections.length}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>Total Detections</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                                        {cameraList.length}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>Active Cameras</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '50px',
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '12px'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                            <div style={{ color: '#666' }}>Loading detections...</div>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '50px',
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '12px'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📷</div>
                            <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
                                No detections found
                            </div>
                            <div style={{ fontSize: '14px', color: '#999' }}>
                                Images will appear here when cameras detect objects
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Grid แสดงภาพ */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '20px',
                                marginBottom: '20px'
                            }}>
                                {currentItems.map((detection, index) => (
                                    <div
                                        key={detection._id || index}
                                        onClick={() => setSelectedImage(detection)}
                                        style={{
                                            background: '#fff',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            border: '2px solid transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-5px)';
                                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    >
                                        {/* ภาพ */}
                                        <div style={{
                                            width: '100%',
                                            height: '200px',
                                            background: detection.imageUrl 
                                                ? `url(${detection.imageUrl}) center/cover no-repeat`
                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative'
                                        }}>
                                            {!detection.imageUrl && (
                                                <div style={{ fontSize: '48px' }}>📷</div>
                                            )}
                                            {/* Badge สถานะ */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                background: detection.type === 'danger' ? '#ef4444' : 
                                                           detection.type === 'warning' ? '#f59e0b' : '#10b981',
                                                color: '#fff',
                                                padding: '5px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {detection.type || 'detection'}
                                            </div>
                                        </div>

                                        {/* ข้อมูล */}
                                        <div style={{ padding: '15px' }}>
                                            <div style={{ 
                                                fontWeight: 'bold', 
                                                fontSize: '16px',
                                                marginBottom: '8px',
                                                color: '#333'
                                            }}>
                                                📷 {detection.cameraId || detection.deviceId || 'Unknown'}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                                                🎯 Target: {detection.detectedDevice || detection.targetId || 'N/A'}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                                                📍 [{detection.latitude?.toFixed(4)}, {detection.longitude?.toFixed(4)}]
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                                ⏰ {detection.timestamp ? new Date(detection.timestamp).toLocaleString('th-TH') : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(255,255,255,0.9)',
                                padding: '15px',
                                borderRadius: '12px'
                            }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '8px 16px',
                                        background: currentPage === 1 ? '#e5e7eb' : '#3b82f6',
                                        color: currentPage === 1 ? '#9ca3af' : '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ← Previous
                                </button>
                                <span style={{ color: '#333', fontWeight: 'bold' }}>
                                    Page {currentPage} / {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: '8px 16px',
                                        background: currentPage === totalPages ? '#e5e7eb' : '#3b82f6',
                                        color: currentPage === totalPages ? '#9ca3af' : '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal แสดงภาพขยาย */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            position: 'relative'
                        }}
                    >
                        {/* ปุ่มปิด */}
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                fontSize: '20px',
                                cursor: 'pointer',
                                zIndex: 10,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            ✕
                        </button>

                        {/* ภาพขยาย */}
                        <div style={{
                            width: '100%',
                            height: '500px',
                            background: selectedImage.imageUrl 
                                ? `url(${selectedImage.imageUrl}) center/contain no-repeat`
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px 12px 0 0'
                        }}>
                            {!selectedImage.imageUrl && (
                                <div style={{ fontSize: '96px' }}>📷</div>
                            )}
                        </div>

                        {/* ข้อมูลละเอียด */}
                        <div style={{ padding: '25px' }}>
                            <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #3b82f6', paddingBottom: '10px' }}>
                                📷 Detection Details
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                                <div>
                                    <strong>Camera ID:</strong><br/>
                                    <span style={{ color: '#3b82f6' }}>
                                        {selectedImage.cameraId || selectedImage.deviceId || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <strong>Target Device:</strong><br/>
                                    <span style={{ color: '#ef4444' }}>
                                        {selectedImage.detectedDevice || selectedImage.targetId || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <strong>Type:</strong><br/>
                                    <span style={{ 
                                        color: selectedImage.type === 'danger' ? '#ef4444' : 
                                               selectedImage.type === 'warning' ? '#f59e0b' : '#10b981',
                                        fontWeight: 'bold'
                                    }}>
                                        {selectedImage.type || 'detection'}
                                    </span>
                                </div>
                                <div>
                                    <strong>Confidence:</strong><br/>
                                    {selectedImage.confidence ? `${(selectedImage.confidence * 100).toFixed(1)}%` : 'N/A'}
                                </div>
                                <div>
                                    <strong>Location:</strong><br/>
                                    [{selectedImage.latitude?.toFixed(6)}, {selectedImage.longitude?.toFixed(6)}]
                                </div>
                                <div>
                                    <strong>Altitude:</strong><br/>
                                    {selectedImage.altitude || 0} m
                                </div>
                                <div>
                                    <strong>Timestamp:</strong><br/>
                                    {selectedImage.timestamp ? new Date(selectedImage.timestamp).toLocaleString('th-TH') : 'N/A'}
                                </div>
                                <div>
                                    <strong>Status:</strong><br/>
                                    <span style={{ 
                                        color: selectedImage.status === 'active' ? '#10b981' : '#9ca3af',
                                        fontWeight: 'bold'
                                    }}>
                                        {selectedImage.status || 'active'}
                                    </span>
                                </div>
                            </div>
                            {selectedImage.description && (
                                <div style={{ marginTop: '15px', padding: '10px', background: '#f3f4f6', borderRadius: '6px' }}>
                                    <strong>Description:</strong><br/>
                                    {selectedImage.description}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImageViewer;
