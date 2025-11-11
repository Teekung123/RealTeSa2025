import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Header from '../component/Header.jsx'

function MyDrone() {
    const [droneData, setDroneData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterText, setFilterText] = useState('');
    const itemsPerPage = 30; // จำนวนรายการต่อหน้า
    const tableRef = useRef(null);

    useEffect(() => {
        // ดึงข้อมูล targets จาก API
        axios.get('http://localhost:3000/api/MyDrone')
            .then(response => {
                setDroneData(response.data.data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setError(error.message);
                setLoading(false);
            });
    }, []);

    // ฟังก์ชันสำหรับแสดง array เป็น string
    const renderArray = (arr) => {
        if (!arr || !Array.isArray(arr)) return 'N/A';
        return arr.join(', ');
    };

    // ✅ ฟิลเตอร์ข้อมูล
    const filteredData = droneData.filter(item =>
        Object.values(item).some(value =>
            Array.isArray(value)
                ? value.join(',').toLowerCase().includes(filterText.toLowerCase())
                : String(value).toLowerCase().includes(filterText.toLowerCase())
        )
    );

    // คำนวณข้อมูลสำหรับหน้าปัจจุบัน
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // ฟังก์ชันเปลี่ยนหน้า
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        // ✅ หลังจากเปลี่ยนหน้า ให้เลื่อนไปยังตาราง (smooth)
        // ✅ หลังจากเปลี่ยนหน้า ให้เลื่อนไปยังแถวแรกของหน้านั้น
        setTimeout(() => {
            if (tableRef.current) {
                tableRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }, 100);
    };

    // สร้างปุ่มหน้า
    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // ปุ่ม Previous
        pages.push(
            <button
                key="prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    padding: '8px 12px',
                    margin: '0 4px',
                    border: '1px solid #ddd',
                    background: currentPage === 1 ? '#f5f5f5' : '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '4px'
                }}
            >
                ← Previous
            </button>
        );

        // ปุ่มหน้าแรก
        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    style={{
                        padding: '8px 12px',
                        margin: '0 4px',
                        border: '1px solid #ddd',
                        background: '#fff',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(<span key="dots1" style={{ margin: '0 4px' }}>...</span>);
            }
        }

        // ปุ่มหน้าที่แสดง
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    style={{
                        padding: '8px 12px',
                        margin: '0 4px',
                        border: '1px solid #ddd',
                        background: currentPage === i ? '#007bff' : '#fff',
                        color: currentPage === i ? '#fff' : '#000',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: currentPage === i ? 'bold' : 'normal'
                    }}
                >
                    {i}
                </button>
            );
        }

        // ปุ่มหน้าสุดท้าย
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="dots2" style={{ margin: '0 4px' }}>...</span>);
            }
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    style={{
                        padding: '8px 12px',
                        margin: '0 4px',
                        border: '1px solid #ddd',
                        background: '#fff',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    {totalPages}
                </button>
            );
        }

        // ปุ่ม Next
        pages.push(
            <button
                key="next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    padding: '8px 12px',
                    margin: '0 4px',
                    border: '1px solid #ddd',
                    background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    borderRadius: '4px'
                }}
            >
                Next →
            </button>
        );

        return pages;
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>⏳ Loading data...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>❌ Error: {error}</div>;
    }

    return (
        <div style={{ padding: '0', background: '#ffffffff', minHeight: '100vh', color: '#000000ff' }}>
            <Header/>
            <div style={{ padding: '20px' }}>
                <h2>🎯 Target Data from MongoDB</h2>

                {/* ✅ กล่องค้นหา */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="🔍 ค้นหาข้อมูล..."
                        value={filterText}
                        onChange={(e) => {
                            setFilterText(e.target.value);
                            setCurrentPage(1); // รีเซ็ตหน้าเวลาเปลี่ยนข้อความค้นหา
                        }}
                        style={{
                            padding: '8px 12px',
                            width: '300px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                    <span style={{ marginLeft: '10px', color: '#555' }}>
                        Showing {filteredData.length} results
                    </span>
                </div>

                {/* แสดงข้อมูลสถิติ */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <p><strong>Total records:</strong> {droneData.length}</p>
                    <p><strong>Current page:</strong> {currentPage} / {totalPages}</p>
                    <p><strong>Showing:</strong> {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, droneData.length)} of {droneData.length}</p>
                    <p><strong>Items per page:</strong> {itemsPerPage}</p>
                    <p style={{ color: 'blue' }}><strong>Displaying rows:</strong> {currentItems.length}</p>
                </div>

            {currentItems.length > 0 ? (
                <>
                    {/* Wrapper สำหรับ scroll แนวนอน */}
                    <div style={{ 
                        overflowX: 'auto',
                        overflowY: 'auto',  // ✅ เพิ่มบรรทัดนี้
                        maxHeight: '550px', // ✅ กำหนดความสูงสูงสุด (ปรับตามต้องการ)
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        <table cellPadding="8" style={{ 
                            borderCollapse: 'collapse', 
                            width: '100%', 
                            minWidth: '1200px' 
                        }}>
                            <thead style={{ 
                                background: '#f0f0f0', 
                                color: '#000000ff', 
                                position: 'sticky', 
                                top: 0,
                                zIndex: 10
                            }}>
                                <tr>
                                    <th style={{ border: '1px solid #ddd', minWidth: '60px' }}>No.</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '200px' }}>_id</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '100px' }}>Time</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '150px' }}>Position 3D</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '150px' }}>Velocity 3D</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '150px' }}>Acceleration 3D</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '150px' }}>Position 2D</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '150px' }}>Velocity 2D</th>
                                </tr>
                            </thead> 
                            <tbody ref={tableRef}>
                                {currentItems.map((item, index) => (
                                    <tr key={item._id} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {indexOfFirstItem + index + 1}
                                        </td>
                                        <td style={{ 
                                            border: '1px solid #ddd',
                                            fontSize: '11px', 
                                            maxWidth: '200px', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {item._id}
                                        </td>
                                        <td style={{ border: '1px solid #ddd' }}>{item.time}</td>
                                        <td style={{ border: '1px solid #ddd' }}>{renderArray(item.position3D)}</td>
                                        <td style={{ border: '1px solid #ddd' }}>{renderArray(item.velocity3D)}</td>
                                        <td style={{ border: '1px solid #ddd' }}>{renderArray(item.acceleration3D)}</td>
                                        <td style={{ border: '1px solid #ddd' }}>{renderArray(item.position2D)}</td>
                                        <td style={{ border: '1px solid #ddd' }}>{renderArray(item.velocity2D)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div style={{ 
                        marginTop: '20px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {renderPagination()}
                    </div>
                </>
            ) : (
                <p>📭 No data found...</p>
            )}
            </div>
        </div>
    );
}

export default MyDrone;