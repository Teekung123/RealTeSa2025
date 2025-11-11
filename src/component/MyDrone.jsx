import { useEffect, useState } from 'react';
import axios from 'axios';

function MyDrone() {
    const [droneData, setDroneData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // ดึงข้อมูล targets จาก API
        axios.get('http://localhost:3000/api/targets')
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

    if (loading) {
        return <div style={{ padding: '20px' }}>⏳ Loading data...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>❌ Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px', background: '#0b2e13', minHeight: '100vh', color: '#cfe9c8' }}>
            <h2>🎯 Target Data from MongoDB</h2>

            {droneData.length > 0 ? (
                <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead style={{ background: '#0a2f18', color: '#c8facc' }}>
                        <tr>
                            <th>ID</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {droneData.map((item, index) => (
                            <tr key={index} style={{ background: index % 2 === 0 ? '#1a4d2e' : '#123d24' }}>
                                <td>{index + 1}</td>
                                <td style={{ textAlign: 'left' }}>
                                    <pre style={{ margin: 0, fontSize: '12px' }}>
                                        {JSON.stringify(item, null, 2)}
                                    </pre>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>📭 No data found...</p>
            )}
            
            <div style={{ marginTop: '20px' }}>
                <p>Total records: {droneData.length}</p>
            </div>
        </div>
    );
}

export default MyDrone;