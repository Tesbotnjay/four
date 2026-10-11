-- Update divisi and jabatan based on user mapping

-- 1. Non-divisi
UPDATE members SET jabatan = 'Wakil Jurnalistik', divisi = NULL, is_koor = FALSE WHERE id = 'f4198433-d243-4b3e-8be5-cee5d93d740a';
UPDATE members SET jabatan = 'Bendahara', divisi = NULL, is_koor = FALSE WHERE id = '58a8c84f-f887-4019-a30a-84187919925c';

-- 2. Dokumentasi
UPDATE members SET jabatan = 'Koordinator dokumentasi foto', divisi = 'Dokumentasi', is_koor = TRUE WHERE id = '406ed693-9fab-4695-af37-2867685ef7bb';
-- Non-aktifkan / merge akun Nabila duplikat agar tidak dobel
UPDATE members SET jabatan = 'Anggota dokumentasi', divisi = 'Dokumentasi', is_koor = FALSE WHERE id = 'd534747e-9df1-417a-b9ce-3f472e45109d';

UPDATE members SET jabatan = 'Anggota dokumentasi', divisi = 'Dokumentasi', is_koor = FALSE WHERE id IN (
  '5e37c1af-b8f6-4b67-9139-ba1c5bacdf63', -- Naura Ken Nurul Izzah
  'e02f8ae7-c171-4a90-9412-66695764ca0c', -- Najla zhafarina aniesyaputri
  '76055d1c-8cb7-4290-a8e5-8886678743a7', -- Muhammad Ibnu Ayubi Furqon
  'b985720a-c046-4756-b866-bf0185b59d01', -- Rasha Leandra Prabowo
  '93070038-8524-416f-91ea-95c6f534a1f2', -- Indah Asma'ul Husnah
  'ccb64ff1-a82a-4e9a-a71f-8d5eb4ca252f', -- Bulan Zakiya Yauma
  '6dde4358-1be2-4a25-8864-1da11272fd7a', -- Adelina nafisa
  '396bb9e8-e470-4c6a-8d9c-dfefa775bdff', -- Rifiana
  'e527ac66-67d0-44f4-98a1-2b3e8ead3dc1'  -- Rizqullah Ahmada Wenas
);

-- 3. Media
UPDATE members SET jabatan = 'Koordinator Media', divisi = 'Media', is_koor = TRUE WHERE id = 'ce767c50-f7da-4cfd-a08a-1ad34e97cd0e'; -- Maria Grace
UPDATE members SET jabatan = 'Pembimbing Media', divisi = 'Media', is_koor = FALSE WHERE id = '3a3614ce-aecc-45b6-b879-f5afc9cc984d'; -- Muhammad Fadhil

UPDATE members SET jabatan = 'Anggota media', divisi = 'Media', is_koor = FALSE WHERE id IN (
  '2031c7dd-be14-405d-86b1-d28a4e8265c8', -- Arum Pramudha Wardhani
  'e14bf6ea-435b-4ddd-b144-a1e891344e12', -- Shifa Suhaimah
  'f32cfce0-c9da-48e7-a89b-e08fd84381ab', -- Avinda Aulia K
  '78f5a88c-7135-41e1-a042-56b3b777be1a'  -- Narsya Anna Rhmadani
);

-- 4. Berita
UPDATE members SET jabatan = 'Koordinator Berita', divisi = 'Berita', is_koor = TRUE WHERE id = 'bef88c97-51bd-43bb-9ab9-d134f6ac1d36'; -- Cikita Naura Ayu

UPDATE members SET jabatan = 'Anggota berita', divisi = 'Berita', is_koor = FALSE WHERE id IN (
  'e8e8e2e9-eecf-4105-9299-8aba69cf3189', -- Tsimal Zurarah Al Huda
  '39e295cb-7b1d-4c76-b7f3-945bf756e073'  -- Atiqah Fauziah
);

-- 5. Koresponden
UPDATE members SET jabatan = 'Anggota koresponden', divisi = 'Korespondensi', is_koor = FALSE WHERE id IN (
  '9859afff-e818-49be-a4ee-2c0b768ef32b', -- Tristan Elvis Pratama Putra
  'a3aeed94-eddc-4ea1-87a6-41ee9c7d18b7'  -- Yulia Putri
);
