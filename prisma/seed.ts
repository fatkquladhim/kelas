import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await db.materialAchievement.deleteMany()
  await db.pertemuanLog.deleteMany()
  await db.silabus.deleteMany()
  await db.jadwal.deleteMany()
  await db.classMember.deleteMany()
  await db.user.deleteMany()
  await db.kelas.deleteMany()
  await db.mataKuliah.deleteMany()

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await db.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@kelas.id',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create sample mahasantri
  const sp = await bcrypt.hash('mahasantri123', 12)
  const student1 = await db.user.create({ data: { name: 'Ahmad Fauzi', email: 'ahmad@kelas.id', password: sp, role: 'MAHASANTRI', isActive: true } })
  const student2 = await db.user.create({ data: { name: 'Muhammad Ridwan', email: 'ridwan@kelas.id', password: sp, role: 'MAHASANTRI', isActive: true } })
  const student3 = await db.user.create({ data: { name: 'Ibrahim Hasbi', email: 'ibrahim@kelas.id', password: sp, role: 'MAHASANTRI', isActive: true } })
  const student4 = await db.user.create({ data: { name: 'Ubaidillah', email: 'ubaid@kelas.id', password: sp, role: 'MAHASANTRI', isActive: false } })
  console.log('✅ Sample students created')

  // Helper to create course with syllabus
  async function createCourse(data: { code: string; name: string; sks: number; semester: number; programStudi: string; standarKompetensi: string; deskripsi: string; syllabus: { pertemuan: number; materiPokok: string; subMateri: string; referensi: string }[] }) {
    return db.mataKuliah.create({
      data: {
        code: data.code,
        name: data.name,
        sks: data.sks,
        semester: data.semester,
        programStudi: data.programStudi,
        standarKompetensi: data.standarKompetensi,
        deskripsi: data.deskripsi,
        syllabus: { create: data.syllabus },
      },
    })
  }

  const refFM = 'Fathul muin, Ianatut tholibin, Tarsyikh, dawuh dosen, nihayatuz zain'
  const refW = 'Syarah Al-Waraqat, Hasyiayah Dimyati, An-Nafahat, Lubbul Ushul, Minhajul Wushul'
  const refSM = 'Idhohl Mubham, Mari Menjadi Waras'
  const refT = 'Tibyan fi Ulumil al-Quran'
  const refIQ = 'Kitab Idhahul Qawaid Fiqhiyyah, Kitab Asybah wan Nadhair'
  const refAlf = 'Alfiyah dan syarahnya'
  const refMaf = 'Mafahim Yajibu Antushohhah'

  const fathulMuin = await createCourse({
    code: 'MKA001', name: 'Fiqih Ibadah (Fathul Muin)', sks: 2, semester: 2, programStudi: 'Fikih wa Ushuluhu',
    standarKompetensi: 'Mahasantri memahami dan mengamalkan fiqih ibadah sesuai dengan madzhab Syafi\'i.',
    deskripsi: 'Membahas fiqih ibadah meliputi salat jama\'ah, salat jum\'at, jamak dan qasar, salat jenazah, zakat.',
    syllabus: [
      { pertemuan: 1, materiPokok: "Salat jama'ah", subMateri: "Hukum-hukum salat jama'ah", referensi: refFM },
      { pertemuan: 2, materiPokok: "Salat jama'ah", subMateri: "Salat jama'ah di masjid", referensi: refFM },
      { pertemuan: 3, materiPokok: "Salat jama'ah", subMateri: "Pengulangan salat maktubah", referensi: refFM },
      { pertemuan: 4, materiPokok: "Salat jama'ah", subMateri: "Salat berjama'ah dengan banyak orang. Mengubah niat iqtida' di tengah-tengah salat", referensi: refFM },
      { pertemuan: 5, materiPokok: "Salat jama'ah", subMateri: "Mendapatkan fadilah salat berjama'ah. Fadilah menemui takbiratul ihramnya imam", referensi: refFM },
      { pertemuan: 6, materiPokok: "Salat jama'ah", subMateri: "Hukum menunggu makmum yang masuk ke tempat salat", referensi: refFM },
      { pertemuan: 7, materiPokok: "Salat jama'ah", subMateri: "Keringan dalam salat berjama'ah", referensi: refFM },
      { pertemuan: 8, materiPokok: "Salat jama'ah", subMateri: "Kemakruhan memulai salat sunah saat dimulainya jama'ah salat fardhu", referensi: refFM },
      { pertemuan: 9, materiPokok: "Salat jama'ah", subMateri: "Rakaatnya makmum masbuk. Syarat-syarat sahnya bermakmum", referensi: refFM },
      { pertemuan: 10, materiPokok: "Salat jama'ah", subMateri: "Uzur-uzur yang mewajibkan untuk tertinggal imam", referensi: refFM },
      { pertemuan: 11, materiPokok: "Salat jama'ah", subMateri: "Perkara yang bisa membatalkan bermakmum", referensi: refFM },
      { pertemuan: 12, materiPokok: "Salat jama'ah", subMateri: "Uzur-uzur yang membolehkan untuk meninggalkan salat berjama'ah", referensi: refFM },
      { pertemuan: 13, materiPokok: "Salat Jum'at", subMateri: "Syarat-syarat wajib salat jum'at. Syarat-syarat sah salat jum'at", referensi: refFM },
      { pertemuan: 14, materiPokok: "Salat Jum'at", subMateri: "Rukun-rukun dua khutbah. Syarat-syarat khutbah. Etika-etika salat jum'at", referensi: refFM },
      { pertemuan: 15, materiPokok: "Jamak dan Qasar", subMateri: "Salatnya orang yang bepergian dari segi jamak dan qasar", referensi: refFM },
      { pertemuan: 16, materiPokok: "Jamak dan Qasar", subMateri: "Batasan dimulainya dan berakhirnya bepergian. Syarat-syarat qasar", referensi: refFM },
      { pertemuan: 17, materiPokok: "Jamak dan Qasar", subMateri: "Syarat-syarat jamak takdim. Syarat-syarat jamak ta'khir", referensi: refFM },
      { pertemuan: 18, materiPokok: "Jamak dan Qasar", subMateri: "Diperbolehkannya jamak takdim dan ta'khir bagi orang yang sakit. Diperbolehkannya jamak takdim sebab hujan", referensi: refFM },
      { pertemuan: 19, materiPokok: "Jamak dan Qasar", subMateri: "Pelaksanaan ibadah yang sahnya masih diperdebatkan tanpa taklid", referensi: refFM },
      { pertemuan: 20, materiPokok: "Salat Jenazah", subMateri: "Salat jenazah. Memandikan jenazah. Orang-orang yang lebih pantas untuk memandikan jenazah", referensi: refFM },
      { pertemuan: 21, materiPokok: "Salat Jenazah", subMateri: "Mengkafani jenazah. Menguburkan jenazah", referensi: refFM },
      { pertemuan: 22, materiPokok: "Salat Jenazah", subMateri: "Kesunahan menaruh pelepah kurma di atas kuburan. Hukum membongkar jenazah. Hukum jenazah anak kecil", referensi: refFM },
      { pertemuan: 23, materiPokok: "Salat Jenazah", subMateri: "Rukun-rukun salat jenazah. Orang yang lebih pantas menjadi imam salat jenazah", referensi: refFM },
      { pertemuan: 24, materiPokok: "Salat Jenazah", subMateri: "Syarat-syarat sah salat jenazah. Hukum orang yang mati syahid", referensi: refFM },
      { pertemuan: 25, materiPokok: "Salat Jenazah", subMateri: "Mentalqin orang yang sakarotul maut. Ziarah kubur. Ta'ziah", referensi: refFM },
      { pertemuan: 26, materiPokok: "Zakat", subMateri: "Syarat-syarat orang yang wajib berzakat", referensi: refFM },
      { pertemuan: 27, materiPokok: "Zakat", subMateri: "Zakat emas dan perak. Zakat barang dagangan", referensi: refFM },
      { pertemuan: 28, materiPokok: "Zakat", subMateri: "Menghilangkan kepemilikan agar terhindar dari zakat. Tidak ada kewaiban zakat bagi soirofi", referensi: refFM },
      { pertemuan: 29, materiPokok: "Zakat", subMateri: "Zakat perhiasan. Zakat barang tambang dan harta karun", referensi: refFM },
      { pertemuan: 30, materiPokok: "Zakat", subMateri: "Zakat makanan pokok", referensi: refFM },
      { pertemuan: 31, materiPokok: "Zakat", subMateri: "Waktu kewajiban mengeluarkan zakat makanan pokok dan selainnya", referensi: refFM },
      { pertemuan: 32, materiPokok: "Zakat", subMateri: "Zakat harta baitul mal dan harta wakafan", referensi: refFM },
      { pertemuan: 33, materiPokok: "Zakat", subMateri: "Nishab unta", referensi: refFM },
      { pertemuan: 34, materiPokok: "Zakat", subMateri: "Nishab sapi. Nishab kambing", referensi: refFM },
      { pertemuan: 35, materiPokok: "Zakat", subMateri: "Zakat fitrah", referensi: refFM },
      { pertemuan: 36, materiPokok: "Membayar Zakat", subMateri: "Hukum membayar zakat dari segi menyegerakannya dan tidak", referensi: refFM },
    ],
  })

  const alfiyah = await createCourse({
    code: 'MKA004', name: 'Ilmu Nahwu 2 (Alfiyah)', sks: 2, semester: 2, programStudi: 'Fikih wa Ushuluhu',
    standarKompetensi: 'Mahasantri terampil membaca kitab kuning sesuai dengan kaidah gramatikal arab serta membedahnya dengan tepat.',
    deskripsi: 'Pengembangan dari Ilmu Nahwu 1. Membahas isim-isim yang dibaca nasob secara mendalam.',
    syllabus: [
      { pertemuan: 1, materiPokok: 'Istighol', subMateri: 'Pengertian Isytighol, Pembacaan isim sabiq, Memisah antara fiil dan dhomir syaghil, Isytighol pada isim sifat', referensi: refAlf },
      { pertemuan: 2, materiPokok: "Muta'adi dan lazim", subMateri: "Fiil muta'addi, Fiil-fiil lazim, Memuta'addikan fi'il lazim, Maf'ul bih yang menjadi fail ma'na", referensi: refAlf },
      { pertemuan: 3, materiPokok: "Tanazu'", subMateri: "Definisi tanazu', Amil Muhmal, membuang dan mengakhorkan dhomir, menjadikan dhomir menjadi isim dhohir", referensi: refAlf },
      { pertemuan: 4, materiPokok: 'Masdhar', subMateri: 'Pengertian masdar, Lafad yang dapat mengganti masdar, Masdar dijadikan tasniyah atau jama', referensi: refAlf },
      { pertemuan: 5, materiPokok: "Maf'ul lah", subMateri: "maful li ajlih, disertai (ال) dan tidak", referensi: refAlf },
      { pertemuan: 6, materiPokok: 'Dzorof', subMateri: 'Pengertian dhorof, Amil yang menashobkan dhorof, Dhorof mubham dan mukhtash', referensi: refAlf },
      { pertemuan: 7, materiPokok: "Maf'ul ma'ah", subMateri: "Pengertian maful maah, Mengira-ngirakan amil, Mengutamakan Athaf atau membaca nashob", referensi: refAlf },
      { pertemuan: 8, materiPokok: "Istisna'", subMateri: "Ketentuan istitsna' dengan إلا, Istisna mufarrogh, Istitsna dengan menggunakan غير", referensi: refAlf },
      { pertemuan: 9, materiPokok: 'Hal', subMateri: 'Pengertian hal, Kriteria hal, Syarat shohibul hal, amil hal, bentuk-bentuk hal', referensi: refAlf },
      { pertemuan: 10, materiPokok: 'Tamyiz', subMateri: 'Pengertian tamyiz, Tamyiz yang dijerkan dengan من, Amil tamyiz wajib didahulukan', referensi: refAlf },
      { pertemuan: 11, materiPokok: 'Huruf jar', subMateri: 'Huruf-huruf jer, Faedah من، لام، باء، في، على، عن، كاف', referensi: refAlf },
      { pertemuan: 12, materiPokok: 'Idhofah', subMateri: 'Efek idhofah, pembagian idhofah, Memberi ال pada mudlof, hukum-hukum idhofah', referensi: refAlf },
      { pertemuan: 13, materiPokok: "Mudhof kepada ya'", subMateri: "Huruf akhir mudlof pada ya' mutakallim", referensi: refAlf },
      { pertemuan: 14, materiPokok: 'Amalnya masdhar', subMateri: 'Tata cara mengamalkan masdhar', referensi: refAlf },
      { pertemuan: 15, materiPokok: "Amalnya isim fa'il", subMateri: "isim fa'il, Amal isim maf'ul", referensi: refAlf },
      { pertemuan: 16, materiPokok: "Bina' isim masdhar", subMateri: "bentuk-bentuk masdar, Masdar untuk selain tsulatsi mujarrod, Masdar marrah dan hai'ah", referensi: refAlf },
      { pertemuan: 17, materiPokok: "Bina' isim fa'il", subMateri: "Wazan isim fail tsulasi, Isim fail dan isim maful mazid", referensi: refAlf },
      { pertemuan: 18, materiPokok: 'Isim sifat yang serupa', subMateri: 'Pengertian dan ciri sifat musyabihat, ma\'mul dari sifat musyabihat', referensi: refAlf },
      { pertemuan: 19, materiPokok: "Ta'ajub", subMateri: "Wazan fiil ta'ajub, Fiil ta'ajjub, Ma'mul fiil ta'ajjub", referensi: refAlf },
      { pertemuan: 20, materiPokok: "Nikma dan bi'tsa", subMateri: "نعم و بئس serta lafazh yang diro'fakan, Mengumpulkan fa'il dan tamyiz", referensi: refAlf },
    ],
  })

  const idhohulQowaid = await createCourse({
    code: 'MKA002', name: 'Qowaid Fiqhiyyah (Idhohul Qowaid)', sks: 2, semester: 2, programStudi: 'Fikih wa Ushuluhu',
    standarKompetensi: 'Mahasantri memahami kaidah-kaidah fiqhiyyah dan mampu mengaplikasikannya.',
    deskripsi: 'Membahas kaidah-kaidah fiqhiyyah mulai dari kaidah kulliyah ke-17 hingga ke-40 serta kaidah mukhtalafu fihi.',
    syllabus: [
      { pertemuan: 1, materiPokok: "Kaidah ke-17 & 18", subMateri: "As-Sual Mu'adun Fi Al-Jawab, La Yunsabu Li As-Sakiti Qoulun", referensi: refIQ },
      { pertemuan: 2, materiPokok: "Kaidah ke-19 & 20", subMateri: "Ma Kana Aktsaru Fi'lan Kana Aktsaru Fadlan, Al-'Amal Al-Muta'addi Afdholu Min Al-Qoshir", referensi: refIQ },
      { pertemuan: 3, materiPokok: "Kaidah ke-21 & 22", subMateri: "Al-Fardlu Afdlolu Min An-Nafli, Al-Fadhilah Al-Muta'alliqoh Bi Nafsi Al-'Ibadah", referensi: refIQ },
      { pertemuan: 4, materiPokok: "Kaidah ke-23 & 24", subMateri: "Al-Wajib La Yutroku Illa Li Wajibin, Ma Awjaba 'A'zhoma Al-Amroini", referensi: refIQ },
      { pertemuan: 5, materiPokok: "Kaidah ke-25 & 26", subMateri: "Ma Tsabata Bi Asy-Syar'i Muqoddamun, Ma Haruma Isti'maluhu Haruma Ittikhodzuhu", referensi: refIQ },
      { pertemuan: 6, materiPokok: "Kaidah ke-27 & 28", subMateri: "Ma Haruma Akhdzuhu Haruma I'touhu, Al-Masyghul La Yusyghol", referensi: refIQ },
      { pertemuan: 7, materiPokok: "Kaidah ke-29 & 30", subMateri: "Al-Mukabbar La Yukabbar, Man 'Ista'jala Syaian Qobla Awanihi", referensi: refIQ },
      { pertemuan: 8, materiPokok: "Kaidah ke-31 & 32", subMateri: "An-Naflu Awsa'u minal Fardhi, Al-Wilaayah Al-Khos Aqwaa Minal Wilaayah Al-Am'mah", referensi: refIQ },
      { pertemuan: 9, materiPokok: "Kaidah ke-33 & 34", subMateri: "La I'brota Bid-Dzonni Al-Bayyini Khoth'uhu, Al-Isytighol Bighoril Maqsud I'rodhun", referensi: refIQ },
      { pertemuan: 10, materiPokok: "Kaidah ke-35 & 36", subMateri: "La Yunkaru Al-Mukhtalafu Fih, Yadkhulu Al-Qowiyyu Alad-Dhoif", referensi: refIQ },
      { pertemuan: 11, materiPokok: "Kaidah ke-37 & 38", subMateri: "Yughtafaru Fil-Wasaaili, Al-Maisur La Yasqutu Bil-Ma'sur", referensi: refIQ },
      { pertemuan: 12, materiPokok: "Kaidah ke-39 & 40", subMateri: "Ma La Yaqbalu At-Tab'idh, Idza Ijtama As-Sababu Wal-Mubasyaratu", referensi: refIQ },
      { pertemuan: 13, materiPokok: "Kaidah Al-Mukhtalafu Fihi 1 & 2", subMateri: "Kaidah Hal Al-jum'atu Dzuhrun, Kaidah As-Sholatu Kholfal Muhditsi", referensi: refIQ },
      { pertemuan: 14, materiPokok: "Kaidah Al-Mukhtalafu Fihi 3 & 4", subMateri: "Kaidah Man Ata Bima Yunafi Al-Fardho, Kaidah An-Nadzru", referensi: refIQ },
      { pertemuan: 15, materiPokok: "Kaidah Al-Mukhtalafu Fihi 5 & 6", subMateri: "Kaidah Hal Al-Ibrotu bishiyagil Uqudi, Kaidah Al-Ainu Al-Mustaarotu", referensi: refIQ },
      { pertemuan: 16, materiPokok: "Kaidah Al-Mukhtalafu Fihi 7 & 8", subMateri: "Kaidah Al-Hiwalatu, Kaidah Al-Ibro'u Hal Huwa Isqotun Aw Tamlikun", referensi: refIQ },
      { pertemuan: 17, materiPokok: "Kaidah Al-Mukhtalafu Fihi 9 & 10", subMateri: "Kaidah Al-Iqolatu Hal Hiya Faskhun Aw Baiun, Kaidah As-Shodaq Al-Muayyan", referensi: refIQ },
      { pertemuan: 18, materiPokok: "Kaidah Al-Mukhtalafu Fihi 11 & 12", subMateri: "Kaidah At-Tholaq Ar-Roj'i, Kaidah Ad-Dzihar", referensi: refIQ },
      { pertemuan: 19, materiPokok: "Kaidah Al-Mukhtalafu Fihi 13 & 14", subMateri: "Kaidah Fardhul kifayati, Kaidah Az-zailu Al-Aidu", referensi: refIQ },
      { pertemuan: 20, materiPokok: "Kaidah Al-Mukhtalafu Fihi 15 & 16", subMateri: "Kaidah Hal Al-Ibrotu Bil Hali Aw Bil Maali, Idza Bathola Al-Khusus", referensi: refIQ },
      { pertemuan: 21, materiPokok: "Kaidah Al-Mukhtalafu Fihi 17 & 18", subMateri: "Kaidah al-Hamlou, Kaidah An-Nadziru", referensi: refIQ },
      { pertemuan: 22, materiPokok: "Kaidah Al-Mukhtalafu Fihi 19 & 20", subMateri: "Kaidah Al-Qodiru Alal Yaqini, Kaidah Al-maaniu At-Thooriu", referensi: refIQ },
    ],
  })

  const waraqat = await createCourse({
    code: 'MKA003', name: 'Ushul Fiqh (Waraqat)', sks: 2, semester: 2, programStudi: 'Fikih wa Ushuluhu',
    standarKompetensi: 'Mahasantri memahami dasar-dasar ushul fiqih dan mampu mengaplikasikan metode istinbath hukum.',
    deskripsi: 'Membahas ilmu ushul fiqih: nasakh mansukh, pertentangan dalil, ijma, akhbar, qiyas, hukum asal, istishhab.',
    syllabus: [
      { pertemuan: 1, materiPokok: "Naskh Dan Mansukh", subMateri: "Pengertian Nasakh, Macam-Macam Nasakh", referensi: refW },
      { pertemuan: 2, materiPokok: "Naskh Dan Mansukh", subMateri: "Pembagian Nasakh, Menasakh Al-Qur'an & Sunnah", referensi: refW },
      { pertemuan: 3, materiPokok: "Pertentangan Dua Dalil", subMateri: "Pertentangan Dua Dalil 'Am, Pertentangan Dua Dalil Khas", referensi: refW },
      { pertemuan: 4, materiPokok: "Ijma'", subMateri: "Definisi Ijma', Eksistensi Ijma' sebagai Landasan Hukum", referensi: refW },
      { pertemuan: 5, materiPokok: "Ijma'", subMateri: "Syarat-Syarat Ijma', Bentuk-Bentuk Ijma'", referensi: refW },
      { pertemuan: 6, materiPokok: "Akhbar", subMateri: "Definisi Akhbar, Pembagian Khabar", referensi: refW },
      { pertemuan: 7, materiPokok: "Akhbar", subMateri: "Pembagian Khabar Ahad & Mutawwatir, Khabar 'An'anah", referensi: refW },
      { pertemuan: 8, materiPokok: "Qiyas", subMateri: "Definisi Qiyas, Pembagian Qiyas", referensi: refW },
      { pertemuan: 9, materiPokok: "Qiyas", subMateri: "Pembahasan Qiyas Illat, Qiyas Dalalah, Qiyas Syabah", referensi: refW },
      { pertemuan: 10, materiPokok: "Qiyas", subMateri: "Syarat Far'un, Syarat Ashl", referensi: refW },
      { pertemuan: 11, materiPokok: "Qiyas", subMateri: "Syarat Illat, Syarat Hukum", referensi: refW },
      { pertemuan: 12, materiPokok: "Haram dan Mubah", subMateri: "Hukum Asal Sebelum bi'tsah nabi, Hukum setelah bi'tsah nabi", referensi: refW },
      { pertemuan: 13, materiPokok: "Istishhab", subMateri: "Pengertian Istishhab, Penerapan Istishhab dalam hukum", referensi: refW },
      { pertemuan: 14, materiPokok: "Dalil Hukum", subMateri: "Dalil Jalli dan Khafi, Dalil Yaqin dan Dhan", referensi: refW },
      { pertemuan: 15, materiPokok: "Dalil Hukum", subMateri: "Dalil Ucangan, Qiyas, dan Istishhab", referensi: refW },
      { pertemuan: 16, materiPokok: "Syarat Mufti dan Mustafti", subMateri: "Syarat-Syarat Mufti, Syarat-Syarat Mustafti", referensi: refW },
      { pertemuan: 17, materiPokok: "Taqlid dan Ijtihad", subMateri: "Definisi Taqlid, Hukum Taqlid", referensi: refW },
      { pertemuan: 18, materiPokok: "Taqlid dan Ijtihad", subMateri: "Definisi Ijtihad dan Kebenaran Hukumnya", referensi: refW },
    ],
  })

  const mafahim = await createCourse({
    code: 'MKA005', name: 'Aqidah (Mafahim Yajibu Antushohhah)', sks: 2, semester: 2, programStudi: 'Fikih wa Ushuluhu',
    standarKompetensi: 'Mahasantri memahami aqidah yang benar dan mampu membedakan antara kebenaran dan kesesatan.',
    deskripsi: "Membahas aqidah Islam: larangan takfir, status Khaliq dan Makhluq, bid'ah, dan kelompok menyimpang.",
    syllabus: [
      { pertemuan: 1, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Larangan menjatuhkan vonis kufur secara membabi buta", referensi: refMaf },
      { pertemuan: 2, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Sikap Syaikh Muhammad bin Abdul Wahhab menyangkut takfir", referensi: refMaf },
      { pertemuan: 3, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Memaki orang islam adalah Tindakan fasik dan memeranginya adalah Tindakan kufur", referensi: refMaf },
      { pertemuan: 4, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Status Kholiq (Tuhan) dan Makhluq (Hamba)", referensi: refMaf },
      { pertemuan: 5, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Status Makhluq (Hamba)", referensi: refMaf },
      { pertemuan: 6, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Aspek-aspek yang sama antara Kholiq dan Makhluq", referensi: refMaf },
      { pertemuan: 7, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Majaz Aqli dan penggunaannya, Urgensi penetapan kaitan nisbat", referensi: refMaf },
      { pertemuan: 8, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Perbedaan arti akibat perbedaan nisbat lafadz", referensi: refMaf },
      { pertemuan: 9, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Dua pendapat mengenai kufur dan iman", referensi: refMaf },
      { pertemuan: 10, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Mengagungkan antara ibadah dan adab (etika)", referensi: refMaf },
      { pertemuan: 11, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Riwayat Usamah ibn Syuraik tentang Rasul dan sahabat Anshor", referensi: refMaf },
      { pertemuan: 12, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Perantara Syirik", referensi: refMaf },
      { pertemuan: 13, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Ayat yang menunjukkan ketidakjujuran orang kafir", referensi: refMaf },
      { pertemuan: 14, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Seorang mukmin sebagai mediator dari tindakan Allah", referensi: refMaf },
      { pertemuan: 15, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Baju kepalsuan", referensi: refMaf },
      { pertemuan: 16, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Antara kebaik-baik Bid'ah dan seburuk-buruknya", referensi: refMaf },
      { pertemuan: 17, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Perbedaan pasti antara Bid'ah Syar'iyyah dan Bid'ah Lughowiyyah", referensi: refMaf },
      { pertemuan: 18, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Ajakan para imam Tashawwuf untuk mengaplikasikan syari'ah", referensi: refMaf },
      { pertemuan: 19, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Perkataan Abu Yazid ibn 'Isa ibn Thoifur Al-Bashthomi", referensi: refMaf },
      { pertemuan: 20, materiPokok: "Pembahasan mengenai Aqidah", subMateri: "Hakikat kelompok imam Abul Hasan Al-Asy'ari (Asy'ariah)", referensi: refMaf },
    ],
  })

  const sullamul = await createCourse({
    code: 'MKA006', name: 'Mantiq (Sullamul Munawraq)', sks: 2, semester: 2, programStudi: 'Fikih wa Ushuluhu',
    standarKompetensi: 'Mahasantri memahami ilmu mantiq dan mampu berpikir logis dalam memahami dalil-dalil hukum.',
    deskripsi: "Membahas ilmu mantiq: muarifat, qodoya, tanaqud, aks, qiyas, askal, qiyas istisna'i, dan hujjah.",
    syllabus: [
      { pertemuan: 1, materiPokok: "Faslh Fi Muarifat", subMateri: "Mengetahui Pengertian Ta'rif, Mengetahui Pembagian Ta'rif (Had, Rasm, Lafdzi)", referensi: refSM },
      { pertemuan: 2, materiPokok: "Faslh Fi Muarifat", subMateri: "Mengetahui Memahami Syarat Ta'rif", referensi: refSM },
      { pertemuan: 3, materiPokok: "Bab Qodoya Wa Ahkamiha", subMateri: "Mengetahui Pengertian Dari Qodiyah, Mengetahiu Pembagian Qodiyah (Hamliyah Dan Syartiyah)", referensi: refSM },
      { pertemuan: 4, materiPokok: "Bab Qodoya Wa Ahkamiha", subMateri: "Qodiah Hamliyah Dan Pembagiannya (Kuliyah, Juziyyah, Muhmalah, Syakshiyah)", referensi: refSM },
      { pertemuan: 5, materiPokok: "Bab Qodoya Wa Ahkamiha", subMateri: "Qodiah Syartiyah Dan Pembagiannya (Mutashilah, Munfashilah)", referensi: refSM },
      { pertemuan: 6, materiPokok: "Fashl Fi At Tanaqud", subMateri: "Mengetahui Pengertian Tanaqud, Syarat Tanaqud, Metode Pembuatan Tanaqud", referensi: refSM },
      { pertemuan: 7, materiPokok: "Fashl Al Aks Al Mustawi", subMateri: "Mengetahui Pengertian Dari Aks, Pembagian Aks, Syarat Aks", referensi: refSM },
      { pertemuan: 8, materiPokok: "Bab Qiyas", subMateri: "Mengetahui Pengertian Qiyas, Pembagian Qiyas (Iqtironi, Istisna'i)", referensi: refSM },
      { pertemuan: 9, materiPokok: "Bab Qiyas", subMateri: "Muqodimah Kubro, Syugro Dan Natijah, Macam Macam Had", referensi: refSM },
      { pertemuan: 10, materiPokok: "Fashl Fi Askal", subMateri: "Pengertian Dan Pembagian Askal Dan Dharb, Rumus Dan Syarat Syakl Awal dan Tsani", referensi: refSM },
      { pertemuan: 11, materiPokok: "Fashl Fi Askal", subMateri: "Rumus Dan Syarat Syakl Tsalis", referensi: refSM },
      { pertemuan: 12, materiPokok: "Fashl Fi Askal", subMateri: "Rumus Dan Syarat Syakl Robi'", referensi: refSM },
      { pertemuan: 13, materiPokok: "Fashl Fi Qiyas Al Istina'i", subMateri: "Pengertian Qiyas Istisna'i, Pembagian Qiyas Istisna'i Dan Hukumnya", referensi: refSM },
      { pertemuan: 14, materiPokok: "Fashl Fi Lawahiq Qiyas", subMateri: "Qiyas Bashit Dan Qiyas Muroab, Model Pengambilan Natijah", referensi: refSM },
      { pertemuan: 15, materiPokok: "Fashl Fi Lawahiq Qiyas", subMateri: "Kelanjutan Qiyas dan pengambilan kesimpulan", referensi: refSM },
      { pertemuan: 16, materiPokok: "Fashl Anwa'i Hujjah", subMateri: "Pengertian Hujjah, Pembagian Hujjah (Naqliyah, Aqliyah)", referensi: refSM },
      { pertemuan: 17, materiPokok: "Fashl Anwa'i Hujjah", subMateri: "Pembagian Hujjah Naqliyah (Burhan, Khitob, Syi'ir, Safsatoh, Jadal)", referensi: refSM },
      { pertemuan: 18, materiPokok: "Fashl Anwa'i Hujjah", subMateri: "Unsur Pembuatan Burhan (Yaqiniyah)", referensi: refSM },
      { pertemuan: 19, materiPokok: "Fashl Anwa'i Hujjah", subMateri: "Kelanjutan pembahasan Hujjah", referensi: refSM },
      { pertemuan: 20, materiPokok: "Penutup", subMateri: "Penutup", referensi: refSM },
    ],
  })

  const tibyan = await createCourse({
    code: 'MKA007', name: 'Ulumul Quran (Tibyan fi Ulumil Quran)', sks: 2, semester: 3, programStudi: 'Fikih wa Ushuluhu',
    standarKompetensi: 'Mahasantri memahami ulumul Quran dan mampu mengkaji ayat-ayat al-Quran dengan pendekatan ilmiah.',
    deskripsi: "Membahas ulumul al-Quran: pengertian, asbabul nuzul, nasakh, tafsir, i'jaz, sab'ah ahruf, qira'ah.",
    syllabus: [
      { pertemuan: 1, materiPokok: "Ulumul al-Quran", subMateri: "Pengertian Ulumul al-Quran, Definisi al-Quran, Keutamaan al-Quran, Nama-nama al-Quran, Permulaan turunnya al-Quran", referensi: refT },
      { pertemuan: 2, materiPokok: "Asbabul Nuzul", subMateri: "Manfaat mengetahui Latarbelakang, Definisi Asbabul Nuzul, Cara mengetahui, Apakah berbilang?", referensi: refT },
      { pertemuan: 3, materiPokok: "Hikmah turunnya al-Quran berangsur", subMateri: "Proses turunnya al-Quran, Hikmah berangsur-angsur, Cara Nabi menerima, Apakah sunah wahyu?", referensi: refT },
      { pertemuan: 4, materiPokok: "Pengumpulan al-Quran", subMateri: "Pengumpulan di dalam dada, di atas kertas, Metode penulisan, di masa Abu Bakar", referensi: refT },
      { pertemuan: 5, materiPokok: "Pengumpulan al-Quran", subMateri: "Keistimewaan Mushad Abu Bakar, Kenapa tidak satu mushaf?, Pengumpulan di masa Utsman", referensi: refT },
      { pertemuan: 6, materiPokok: "Nasakh di dalam al-Quran", subMateri: "Kalimat indah perihal Nasakh, Definisi, Latarbelakang, Pembagian, Hikmah", referensi: refT },
      { pertemuan: 7, materiPokok: "Tafsir dan Penafsir", subMateri: "Kenapa menfasirkan?, Perbedaan Tafsir dan Takwil, Klasifikasi Tafsir, Penafsir terkenal", referensi: refT },
      { pertemuan: 8, materiPokok: "Penafsir Tabiin", subMateri: "Generasi Pertama, Ulama Kota Madinah, Ulama Irak", referensi: refT },
      { pertemuan: 9, materiPokok: "Dirasah Al-Quran", subMateri: "I'jaz al-Quran, Gaya Bahasa, Tantangan, Syarat Mukjizat, Macam I'jaz", referensi: refT },
      { pertemuan: 10, materiPokok: "Dirasah Al-Quran", subMateri: "Contoh I'jaz, Kisah Jariyah dan Asmu'i, Pensyariatan Ilahi, Kabar gaib", referensi: refT },
      { pertemuan: 11, materiPokok: "Mukjizat ilmiah", subMateri: "Kesatuan alam, Munculnya alam, Oksigen, Perpasangan, Janin, Penyerbukan, Sidik jari", referensi: refT },
      { pertemuan: 12, materiPokok: "Mukjizat ilmiah", subMateri: "Akidah Islam/Yahudi/Nasrani, Pemenuhan kebutuhan, Kontradiksi, Syubhat", referensi: refT },
      { pertemuan: 13, materiPokok: "Tafsir Dirayah/Ra'yi", subMateri: "Makna tafsir rasional, Kajian penafsir, Derajat tafsir, Pendapat ulama", referensi: refT },
      { pertemuan: 14, materiPokok: "Tafsir Isyarat", subMateri: "Makna Tafsir Isyarat, Pendapat ulama, Syarat legalnya, Contoh yang tidak diperbolehkan", referensi: refT },
      { pertemuan: 15, materiPokok: "Keanehan tafsir", subMateri: "Keanehan tafsir, Tafsir Syiah, Tafsir Batiniyah, Kitab tafsir terkenal", referensi: refT },
      { pertemuan: 16, materiPokok: "Kitab tafsir", subMateri: "Tafsir Dirayah, Tafsir Ayat Hukum, Tafsir Isyarat, Tafsir modern", referensi: refT },
      { pertemuan: 17, materiPokok: "Terjemah al-Quran", subMateri: "Hadis maudhu', Teks selain arab, Terjemahan, Macam, Syarat", referensi: refT },
      { pertemuan: 18, materiPokok: "Sab'ah Ahruf", subMateri: "Macam bacaan, Dalil, Hikmah, Makna, Perbedaan ulama, Pengunggulan", referensi: refT },
      { pertemuan: 19, materiPokok: "Sab'ah Ahruf", subMateri: "Apakah di mushaf?, Mazhab Tabari, Penolakan, Syubhat", referensi: refT },
      { pertemuan: 20, materiPokok: "Qira'ah", subMateri: "Definisi Qiraah, Di masa sahabat, Munculnya macam bacaan, Ahli Qiraah tujuh", referensi: refT },
    ],
  })

  console.log('✅ 7 courses created with syllabus')

  // Create class
  const defaultClass = await db.kelas.create({
    data: { name: 'Kelas Utama Semester 2', semester: 2, tahunAjaran: '2025/2026' },
  })
  console.log('✅ Default class created')

  // Add members
  await db.classMember.createMany({
    data: [
      { kelasId: defaultClass.id, userId: student1.id, role: 'ROIS_AM' },
      { kelasId: defaultClass.id, userId: student2.id, role: 'KETUA_FAN_ILMU' },
      { kelasId: defaultClass.id, userId: student3.id, role: 'MAHASANTRI' },
    ],
  })
  console.log('✅ 3 students added to class')

  // Schedule
  const jadwalData = [
    { mataKuliahId: alfiyah.id, kelasId: defaultClass.id, hari: 'AHAD', waktu: 'PAGI' },
    { mataKuliahId: fathulMuin.id, kelasId: defaultClass.id, hari: 'SENIN', waktu: 'PAGI' },
    { mataKuliahId: fathulMuin.id, kelasId: defaultClass.id, hari: 'SELASA', waktu: 'PAGI' },
    { mataKuliahId: alfiyah.id, kelasId: defaultClass.id, hari: 'RABU', waktu: 'PAGI' },
    { mataKuliahId: fathulMuin.id, kelasId: defaultClass.id, hari: 'KAMIS', waktu: 'PAGI' },
    { mataKuliahId: idhohulQowaid.id, kelasId: defaultClass.id, hari: 'SABTU', waktu: 'PAGI' },
    { mataKuliahId: sullamul.id, kelasId: defaultClass.id, hari: 'AHAD', waktu: 'SORE' },
    { mataKuliahId: tibyan.id, kelasId: defaultClass.id, hari: 'SENIN', waktu: 'SORE' },
    { mataKuliahId: waraqat.id, kelasId: defaultClass.id, hari: 'AHAD', waktu: 'MALAM' },
    { mataKuliahId: mafahim.id, kelasId: defaultClass.id, hari: 'SENIN', waktu: 'MALAM' },
  ]
  await db.jadwal.createMany({ data: jadwalData })
  console.log(`✅ ${jadwalData.length} schedule entries created`)

  // Create PertemuanLog - fetch silabus IDs first
  const allSilabus = await db.silabus.findMany({ orderBy: { pertemuan: 'asc' } })
  const silabusByCourse: Record<string, typeof allSilabus> = {}
  for (const s of allSilabus) {
    if (!silabusByCourse[s.mataKuliahId]) silabusByCourse[s.mataKuliahId] = []
    silabusByCourse[s.mataKuliahId].push(s)
  }

  // Build schedule map
  const scheduleMap: Record<string, { mataKuliahId: string; hari: string; waktu: string }[]> = {}
  for (const j of jadwalData) {
    const key = `${j.hari}-${j.waktu}`
    if (!scheduleMap[key]) scheduleMap[key] = []
    scheduleMap[key].push(j)
  }

  const dayNames = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
  // Jan 3, 2026 = Saturday = SABTU (day index 6)
  // In JS: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  // SABTU = index 6, AHAD = index 0 (next day), SENIN = index 1...
  // Jan 3 2026 is Saturday (SABTU)
  const dayIndexToHari: Record<number, string> = { 0: 'AHAD', 1: 'SENIN', 2: 'SELASA', 3: 'RABU', 4: 'KAMIS', 5: 'JUMAT', 6: 'SABTU' }

  const startDate = new Date('2026-01-03') // Saturday = SABTU
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const meetingCounters: Record<string, number> = {}
  const courseMaxMeetings: Record<string, number> = {
    [alfiyah.id]: 20, [fathulMuin.id]: 36, [idhohulQowaid.id]: 22,
    [waraqat.id]: 18, [mafahim.id]: 20, [sullamul.id]: 20, [tibyan.id]: 20,
  }
  Object.keys(courseMaxMeetings).forEach(k => { meetingCounters[k] = 0 })

  const pertemuanLogs: { silabusId: string; kelasId: string; tanggal: Date; status: string }[] = []
  let currentDate = new Date(startDate)
  const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days past today
  let iterations = 0

  while (currentDate <= endDate && iterations < 500) {
    const jsDay = currentDate.getDay()
    const hari = dayIndexToHari[jsDay]
    if (!hari) { currentDate.setDate(currentDate.getDate() + 1); iterations++; continue }

    const key = `${hari}`
    // Check each waktu for this hari
    for (const waktu of ['PAGI', 'SORE', 'MALAM']) {
      const scheduleKey = `${hari}-${waktu}`
      const entries = scheduleMap[scheduleKey] || []
      for (const entry of entries) {
        const meetingNum = meetingCounters[entry.mataKuliahId] + 1
        if (meetingNum > (courseMaxMeetings[entry.mataKuliahId] || 20)) continue

        const courseSilabus = silabusByCourse[entry.mataKuliahId] || []
        const silabusItem = courseSilabus.find(s => s.pertemuan === meetingNum)
        if (!silabusItem) continue

        const isPast = currentDate <= today
        pertemuanLogs.push({
          silabusId: silabusItem.id,
          kelasId: defaultClass.id,
          tanggal: new Date(currentDate),
          status: isPast ? 'SELESAI' : 'BELUM',
        })
        meetingCounters[entry.mataKuliahId]++
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
    iterations++
  }

  // Batch insert pertemuan logs
  for (const log of pertemuanLogs) {
    await db.pertemuanLog.create({ data: log })
  }
  console.log(`✅ ${pertemuanLogs.length} pertemuan logs created`)

  console.log('\n🎉 Seeding complete!')
  console.log('\nLogin credentials:')
  console.log('  Admin:    admin@kelas.id / admin123')
  console.log('  Rois A\'m: ahmad@kelas.id / mahasantri123')
  console.log('  Ketua FI: ridwan@kelas.id / mahasantri123')
  console.log('  Student:  ibrahim@kelas.id / mahasantri123')
  console.log('  Pending:  ubaid@kelas.id / mahasantri123 (not confirmed)')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
