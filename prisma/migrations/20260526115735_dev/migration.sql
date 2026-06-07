-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MAHASANTRI',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClassMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kelasId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MAHASANTRI',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassMember_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MataKuliah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sks" INTEGER NOT NULL DEFAULT 2,
    "semester" INTEGER NOT NULL,
    "programStudi" TEXT NOT NULL DEFAULT '',
    "standarKompetensi" TEXT NOT NULL DEFAULT '',
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Silabus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mataKuliahId" TEXT NOT NULL,
    "pertemuan" INTEGER NOT NULL,
    "materiPokok" TEXT NOT NULL DEFAULT '',
    "subMateri" TEXT NOT NULL DEFAULT '',
    "referensi" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Silabus_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jadwal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mataKuliahId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "hari" TEXT NOT NULL,
    "waktu" TEXT NOT NULL,
    CONSTRAINT "Jadwal_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Jadwal_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kehadiran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pertemuanLogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kehadiran_pertemuanLogId_fkey" FOREIGN KEY ("pertemuanLogId") REFERENCES "PertemuanLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kehadiran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PertemuanLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "silabusId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BELUM',
    "catatan" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PertemuanLog_silabusId_fkey" FOREIGN KEY ("silabusId") REFERENCES "Silabus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PertemuanLog_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "silabusId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "persentase" INTEGER NOT NULL DEFAULT 0,
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialAchievement_silabusId_fkey" FOREIGN KEY ("silabusId") REFERENCES "Silabus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pengumuman" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'UMUM',
    "kelasId" TEXT,
    "authorId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pengumuman_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pengumuman_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMember_kelasId_userId_key" ON "ClassMember"("kelasId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Jadwal_kelasId_hari_waktu_key" ON "Jadwal"("kelasId", "hari", "waktu");

-- CreateIndex
CREATE UNIQUE INDEX "Kehadiran_pertemuanLogId_userId_key" ON "Kehadiran"("pertemuanLogId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAchievement_silabusId_kelasId_tanggal_key" ON "MaterialAchievement"("silabusId", "kelasId", "tanggal");
