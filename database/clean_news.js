const path = require('path');
const { sequelize } = require(path.join(__dirname, '../backend/models'));

async function cleanNews() {
  try {
    await sequelize.query(`
      UPDATE news
      SET 
        title = 'Kesiapan Fasilitas Penerangan Lapangan Mini Soccer Polinela',
        content = 'Fasilitas penerangan lapangan mini soccer Politeknik Negeri Lampung siap beroperasi mendukung kegiatan olahraga malam hari bagi civitas akademika dan masyarakat.'
      WHERE title LIKE '%800 Lux%' OR title LIKE '%Lampu Stadion%';
    `);

    await sequelize.query(`
      UPDATE news
      SET 
        title = 'Jadwal Pemeliharaan Berkala Rumput Sintetis Lapangan Polinela',
        content = 'Untuk menjaga kenyamanan dan keselamatan pengguna, pemeliharaan berkala rumput sintetis lapangan mini soccer dilakukan secara rutin setiap hari Senin pukul 06.00 - 08.00 WIB.'
      WHERE title LIKE '%Monofilament%';
    `);

    console.log('News records successfully sanitized!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating news:', err);
    process.exit(1);
  }
}

cleanNews();

