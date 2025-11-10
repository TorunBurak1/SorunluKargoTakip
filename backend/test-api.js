const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔍 API test ediliyor...');
  
  try {
    // Health check
    console.log('\n1. Health check test ediliyor...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Database status
    console.log('\n2. Database status test ediliyor...');
    const dbResponse = await fetch('http://localhost:3001/api/database/status');
    const dbData = await dbResponse.json();
    console.log('✅ Database status:', dbData);
    
    // Cargo records
    console.log('\n3. Cargo records test ediliyor...');
    const cargoResponse = await fetch('http://localhost:3001/api/cargo-records');
    const cargoData = await cargoResponse.json();
    console.log('✅ Cargo records:', cargoData.length, 'kayıt bulundu');
    if (cargoData.length > 0) {
      console.log('İlk kayıt:', cargoData[0]);
    }
    
    // All data
    console.log('\n4. All data test ediliyor...');
    const allDataResponse = await fetch('http://localhost:3001/api/all-data');
    const allData = await allDataResponse.json();
    console.log('✅ All data:', allData.summary);
    
  } catch (error) {
    console.error('❌ API test hatası:', error.message);
    console.log('💡 Backend çalışıyor mu? http://localhost:3001 kontrol edin');
  }
}

testAPI();








