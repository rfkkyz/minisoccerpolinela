const path = require('path');
const { sequelize } = require(path.join(__dirname, '../backend/models'));

async function updateDb() {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.query('DELETE FROM fields WHERE id = 2;');
    await sequelize.query(`
      UPDATE fields 
      SET 
        nama = 'Lapangan Mini Soccer Polinela',
        name = 'Lapangan Mini Soccer Polinela',
        jenis_rumput = 'Rumput Sintetis'
      WHERE id = 1;
    `);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    const [fields] = await sequelize.query('SELECT id, name, nama, jenis_rumput, price_umum, price_mahasiswa, price_karyawan, status FROM fields;');
    console.log('UPDATED FIELDS:');
    console.table(fields);
    process.exit(0);
  } catch (err) {
    console.error('Error updating fields:', err);
    process.exit(1);
  }
}

updateDb();
