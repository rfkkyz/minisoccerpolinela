const axios = require('axios');

async function check() {
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    login: 'superadmin',
    password: 'password123'
  });
  const token = loginRes.data.data.token;
  const res = await axios.get('http://localhost:5000/api/superadmin/summary', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('HTTP Status:', res.status);
  console.log('res.data structure:', Object.keys(res.data));
  console.log('res.data.data structure:', Object.keys(res.data.data));
  console.log('stats:', res.data.data.stats);
}

check().catch(err => {
  console.error('Error:', err.response ? err.response.data : err.message);
});

