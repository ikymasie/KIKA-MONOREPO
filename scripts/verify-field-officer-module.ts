import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/regulator/field-visits';

async function verifyEndpoints() {
    console.log('--- Verifying DCD Field Officer API Endpoints ---');

    try {
        // 1. Verify Scheduling
        console.log('Testing /api/regulator/field-visits/schedule (POST)...');
        const scheduleRes = await axios.post(`${BASE_URL}/schedule`, {
            tenantId: '00000000-0000-0000-0000-000000000001', // Dummy ID
            officerId: '00000000-0000-0000-0000-000000000002', // Dummy ID
            scheduledDate: new Date(),
            purpose: 'Test Inspection',
            notes: 'Verification test'
        });
        console.log('Schedule Response:', scheduleRes.status === 200 ? 'SUCCESS' : 'FAILED');
        const visitId = scheduleRes.data.id;

        // 2. Verify Geo Logging
        console.log('Testing /api/regulator/field-visits/geo (POST)...');
        const geoRes = await axios.post(`${BASE_URL}/geo`, {
            visitId,
            latitude: -1.23456,
            longitude: 36.78910
        });
        console.log('Geo Log Response:', geoRes.status === 200 ? 'SUCCESS' : 'FAILED');

        // 3. Verify Calendar Fetch
        console.log('Testing /api/regulator/field-visits/schedule (GET)...');
        const start = new Date();
        start.setDate(1);
        const end = new Date();
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        const calendarRes = await axios.get(`${BASE_URL}/schedule?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
        console.log('Calendar Fetch Response:', calendarRes.status === 200 ? 'SUCCESS' : 'FAILED');
        console.log('Visits Found:', calendarRes.data.length);

        console.log('--- Verification Complete ---');
    } catch (error: any) {
        console.error('Verification Error:', error.response?.data || error.message);
    }
}

verifyEndpoints();
