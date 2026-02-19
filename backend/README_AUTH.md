# YuBuBu - Veli Odaklı Kayıt Sistemi

## Genel Bakış

YuBuBu platformunda **veli odaklı kayıt sistemi** kullanılmaktadır:
1. **Veli** e-posta ile kayıt olur
2. Veli, çocuğunu sisteme ekler
3. Sistem çocuk için **otomatik kullanıcı adı ve şifre** üretir
4. Çocuk bu basit bilgilerle giriş yapar

## Veritabanı Şeması

### Yeni Tablolar
| Tablo | Açıklama |
|-------|----------|
| `schools` | Okullar (ad, şehir, ilçe) |
| `teachers` | Öğretmenler (kullanıcıya bağlı, okula bağlı, branş) |
| `parent_student_relations` | Veli-öğrenci ilişki tablosu |

### Güncellenen Tablolar
| Tablo | Yeni Alanlar |
|-------|-------------|
| `users` | `username` (benzersiz, nullable), `email` artık nullable |
| `student_profiles` | `parent_id`, `school_id`, `teacher_id`, `grade` |

## API Endpointleri

### Kayıt
| Method | URL | Açıklama | Auth |
|--------|-----|----------|------|
| POST | `/api/auth/register/parent` | Veli kaydı | - |
| POST | `/api/auth/register/student` | Çocuk kaydı (otomatik credential) | PARENT |

### Giriş
| Method | URL | Açıklama | Auth |
|--------|-----|----------|------|
| POST | `/api/auth/login` | Giriş (e-posta veya kullanıcı adı) | - |

### Bilgi
| Method | URL | Açıklama | Auth |
|--------|-----|----------|------|
| GET | `/api/auth/me` | Mevcut kullanıcı bilgisi | JWT |
| GET | `/api/auth/my-children` | Velinin çocukları | PARENT |
| GET | `/api/auth/schools` | Okul listesi | - |
| GET | `/api/auth/schools/{id}/teachers` | Okuldaki öğretmenler | - |

## Kullanıcı Adı ve Şifre Üretimi

### Kullanıcı Adı Formatı
```
ad_soyad_XXXX
```
- Türkçe karakterler dönüştürülür (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u)
- Küçük harfe çevrilir
- XXXX = 4 haneli rastgele sayı
- Örnek: `ali_yilmaz_1234`

### Şifre Formatı
```
adXXXX
```
- Çocuğun adının ilk kısmı + 4 haneli rastgele sayı
- Örnek: `ali1234`

## Seed Verileri

### Çalıştırma
```bash
cd backend
python -m app.seed_data          # Bölüm verileri
python -m app.seed_auth_data     # Auth verileri (okul, öğretmen, veli, öğrenci)
```

### İçerik
- **10 Okul**: İstanbul, Ankara, İzmir, Bursa, Antalya, Eskişehir, Konya
- **40 Öğretmen**: Her okulda 4 (2 sınıf öğr. + 1 özel eğitim + 1 rehber)
- **5 Veli**: Selma Yılmaz, Kemal Demir, Fatma Arslan, Hüseyin Çelik, Ayşegül Koç
- **8 Öğrenci**: Her velinin 1-2 çocuğu
- **1 Admin**: admin@yububu.com

### Test Giriş Bilgileri

Tam bilgiler için: `backend/test_credentials.txt`

**Hızlı Test:**

| Rol | Giriş | Şifre |
|-----|-------|-------|
| Öğrenci | `ali_yilmaz_1234` | `ali1234` |
| Veli | `selma.yilmaz@test.com` | `veli123` |
| Öğretmen | `ayse.kaya@test.com` | `ogretmen123` |
| Admin | `admin@yububu.com` | `admin123` |

## Frontend Akış

### Giriş Sayfası (`/login`)
- **Öğrenci modu**: Kullanıcı adı ile giriş
- **Veli modu**: E-posta ile giriş
- Mod geçiş butonu ile değiştirilebilir

### Kayıt Sayfası (`/register`)
1. Veli bilgileri (ad, e-posta, şifre, telefon)
2. Başarılı kayıt → Çocuk ekleme
3. Çocuk bilgileri (ad, yaş, sınıf, öğrenme güçlüğü)
4. Okul & öğretmen seçimi (opsiyonel)
5. Oluşturulan kullanıcı adı ve şifre gösterimi (kopyalama destekli)
