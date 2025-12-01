import { AppDataSource } from '../src/config/datasource';

async function checkHousingData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');
    
    const qr = AppDataSource.createQueryRunner();
    
    // Check housings
    const housings = await qr.query('SELECT id, nom, code, tenant_id FROM housings LIMIT 5');
    console.log(`\n🏢 Housings count: ${housings.length}`);
    if (housings.length > 0) {
      console.log('Sample:', JSON.stringify(housings.slice(0, 2), null, 2));
    }
    
    // Check rooms
    const rooms = await qr.query('SELECT id, numero, housing_id FROM rooms LIMIT 5');
    console.log(`\n🚪 Rooms count: ${rooms.length}`);
    
    // Check beds
    const beds = await qr.query('SELECT id, number, room_id FROM beds LIMIT 5');
    console.log(`\n🛏️  Beds count: ${beds.length}`);
    
    await qr.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkHousingData();
