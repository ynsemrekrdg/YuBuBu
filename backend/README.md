# 🎓 YuBuBu — Öğrenme Güçlüğü Çeken Çocuklar İçin Eğitim Platformu

Disleksi, Disgrafi ve Diskalkuli özel öğrenme güçlüğü olan çocukların bireysel öğrenme ihtiyaçlarına özel olarak tasarlanmış, yapay zekâ destekli **cross-platform eğitim uygulaması** backend servisi.

## 📖 İçindekiler

- [Mimari](#mimari)
- [Teknolojiler](#teknolojiler)
- [Proje Yapısı](#proje-yapısı)
- [Kurulum](#kurulum)
- [Veritabanı](#veritabanı)
- [Çalıştırma](#çalıştırma)
- [API Dökümantasyonu](#api-dökümantasyonu)
- [Test](#test)
- [Seed Data](#seed-data)
- [Özellikler](#özellikler)
- [Ortam Değişkenleri](#ortam-değişkenleri)

---

## 🏗️ Mimari

Proje **Clean Architecture** (Temiz Mimari) prensiplerine göre yapılandırılmıştır:

```
┌─────────────────────────────────┐
│          API Layer              │  ← FastAPI Routes, Dependencies
├─────────────────────────────────┤
│      Application Layer          │  ← Services, DTOs
├─────────────────────────────────┤
│        Domain Layer             │  ← Entities, Repository Interfaces
├─────────────────────────────────┤
│     Infrastructure Layer        │  ← DB Models, Repo Implementations,
│                                 │     AI Service, Cache
└─────────────────────────────────┘
```

**Katman Bağımlılık Kuralı:** Üst katmanlar alt katmanlara bağımlıdır, alt katmanlar üst katmanları bilmez.

---

## 🛠️ Teknolojiler

| Teknoloji | Kullanım |
|---|---|
| **Python 3.11+** | Ana dil |
| **FastAPI** | Web framework (async) |
| **SQLAlchemy 2.0** | ORM (async, mapped_column) |
| **PostgreSQL** | Veritabanı |
| **Redis** | Cache layer |
| **Anthropic Claude** | Yapay zekâ (Sonnet 4) |
| **Pydantic v2** | Veri validasyonu & DTOs |
| **JWT (python-jose)** | Kimlik doğrulama |
| **Alembic** | Veritabanı migration |
| **Loguru** | Logging |
| **slowapi** | Rate limiting |
| **pytest** | Test framework |

---

## 📁 Proje Yapısı

```
backend/
├── alembic/                          # Migration dosyaları
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial.py
├── app/
│   ├── config.py                     # Pydantic Settings
│   ├── seed_data.py                  # 20 bölüm + test kullanıcıları
│   ├── domain/                       # Domain Entity & Repository Interfaces
│   │   ├── entities/
│   │   │   ├── enums.py              # UserRole, LearningDifficulty, ActivityType...
│   │   │   ├── user.py
│   │   │   ├── student_profile.py
│   │   │   ├── chapter.py
│   │   │   ├── progress.py
│   │   │   ├── ai_conversation.py
│   │   │   └── badge.py
│   │   └── repositories/
│   │       ├── user_repository.py
│   │       ├── student_profile_repository.py
│   │       ├── chapter_repository.py
│   │       ├── progress_repository.py
│   │       ├── ai_conversation_repository.py
│   │       └── badge_repository.py
│   ├── application/                  # Business Logic
│   │   ├── dtos/
│   │   │   ├── auth_dtos.py
│   │   │   ├── student_dtos.py
│   │   │   ├── chapter_dtos.py
│   │   │   ├── progress_dtos.py
│   │   │   └── ai_dtos.py
│   │   └── services/
│   │       ├── auth_service.py
│   │       ├── student_service.py
│   │       ├── chapter_service.py
│   │       ├── progress_service.py
│   │       └── gamification_service.py
│   ├── infrastructure/               # Implementasyonlar
│   │   ├── database/
│   │   │   ├── session.py            # Async engine & session
│   │   │   ├── models.py             # SQLAlchemy ORM modelleri
│   │   │   ├── user_repository_impl.py
│   │   │   ├── student_profile_repository_impl.py
│   │   │   ├── chapter_repository_impl.py
│   │   │   ├── progress_repository_impl.py
│   │   │   ├── ai_conversation_repository_impl.py
│   │   │   └── badge_repository_impl.py
│   │   ├── cache/
│   │   │   └── redis_cache.py
│   │   └── ai/
│   │       ├── prompts.py            # Türkçe AI promptları
│   │       └── ai_service.py         # Claude entegrasyonu
│   └── api/                          # HTTP Layer
│       ├── dependencies.py           # DI setup
│       └── routes/
│           ├── auth_routes.py
│           ├── student_routes.py
│           ├── chapter_routes.py
│           ├── progress_routes.py
│           └── ai_routes.py
├── tests/
│   ├── conftest.py
│   ├── test_entities.py
│   └── test_services.py
├── main.py
├── alembic.ini
├── requirements.txt
├── pytest.ini
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Kurulum

### 1. Gereksinimler

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- [Anthropic API Key](https://console.anthropic.com/)

### 2. Sanal Ortam

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

### 3. Bağımlılıklar

```bash
pip install -r requirements.txt
```

### 4. Ortam Değişkenleri

```bash
cp .env.example .env
# .env dosyasını düzenleyerek kendi değerlerinizi girin
```

### 5. Veritabanı

```bash
# PostgreSQL'de veritabanı oluşturun
createdb yububu_db

# Migration'ları çalıştırın
alembic upgrade head
```

### 6. Seed Data (İsteğe Bağlı)

```bash
python -m app.seed_data
```

Bu komut:
- 7 kullanıcı oluşturur (admin, öğretmen, veli, 4 öğrenci)
- 4 öğrenci profili oluşturur (her zorluk türü için 1)
- 20 bölüm oluşturur (her zorluk türü için 5)

---

## 🗄️ Veritabanı

### Tablolar

| Tablo | Açıklama |
|---|---|
| `users` | Tüm kullanıcılar (öğrenci, veli, öğretmen, admin) |
| `student_profiles` | Öğrenci profilleri (zorluk türü, tercihler, skor) |
| `chapters` | Eğitim bölümleri (içerik, aktivite, zorluk seviyesi) |
| `progress` | Öğrenci ilerleme kayıtları |
| `ai_conversations` | Yapay zekâ sohbet geçmişi |
| `badges` | Kazanılan rozetler |

### Migration

```bash
# Yeni migration oluştur
alembic revision --autogenerate -m "açıklama"

# Migration uygula
alembic upgrade head

# Bir adım geri al
alembic downgrade -1
```

---

## ▶️ Çalıştırma

### Geliştirme

```bash
python main.py
# veya
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Üretim

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 📚 API Dökümantasyonu

Uygulama çalıştıktan sonra:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

### API Endpoints

#### 🔐 Kimlik Doğrulama (`/api/v1/auth`)

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/register` | Yeni kullanıcı kaydı |
| POST | `/login` | Giriş yapma (JWT token) |
| GET | `/me` | Mevcut kullanıcı bilgisi |

#### 👨‍🎓 Öğrenci (`/api/v1/students`)

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/profile` | Öğrenci profili oluştur |
| GET | `/profile` | Profil bilgisi getir |
| PUT | `/profile` | Profil güncelle |
| GET | `/progress-summary` | İlerleme özeti |

#### 📖 Bölümler (`/api/v1/chapters`)

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/` | Bölümleri listele (zorluk türüne göre) |
| GET | `/{id}` | Bölüm detayı |
| POST | `/` | Yeni bölüm oluştur (Admin/Öğretmen) |

#### 📊 İlerleme (`/api/v1/progress`)

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/complete` | Bölüm tamamla |
| GET | `/student/{id}` | Öğrenci ilerlemesi |
| GET | `/student/{id}/stats` | İstatistikler |

#### 🤖 Yapay Zekâ (`/api/v1/ai`)

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/chat` | AI sohbet |
| POST | `/hint` | İpucu al |
| POST | `/analyze` | Öğrenci analizi |
| GET | `/history` | Sohbet geçmişi |

---

## 🧪 Test

```bash
# Tüm testleri çalıştır
pytest

# Detaylı çıktı
pytest -v

# Belirli bir dosyayı test et
pytest tests/test_entities.py

# Coverage raporu
pytest --cov=app --cov-report=html
```

---

## 🎮 Seed Data — 15 Eğitim Bölümü

### Disleksi (5 Bölüm)
1. **Harfleri Tanıyalım** — Harf eşleştirme (OpenDyslexic font)
2. **Kelime Avcısı** — Kelime-resim eşleştirme (sesli geri bildirim)
3. **Sesli Okuma Dostum** — Sesli hikaye takip etme
4. **Hece Bulmaca** — Hece ayırma ve birleştirme
5. **Cümle Kurma Şampiyonu** — Kelimelerden cümle oluşturma

### Disgrafi (5 Bölüm)
1. **Harfleri Tanıyalım** — Parmakla harf izleme
2. **Çizgi Takibi** — İnce motor beceri geliştirme
3. **Harf Yazma Sırası** — Doğru yazılış sırası öğrenme
4. **Kelime Yazma** — Noktalı çizgi üzerinde yazma
5. **Cümle Kopyalama** — Cümle bakarak kopyalama

### Diskalkuli (5 Bölüm)
1. **Sayıları Tanıyalım** — Somut nesnelerle sayma
2. **Sayı Çizgisi Macerası** — İnteraktif sayı çizgisi
3. **Toplama Arkadaşım** — Görsel toplama
4. **Şekiller Dünyası** — Geometrik şekil tanıma
5. **Grafik Okuma Macerası** — Çubuk grafik okuma

---

## 🏆 Oyunlaştırma Sistemi

### Rozetler

| Rozet | Koşul |
|---|---|
| 🌟 İlk Adım | İlk bölümü tamamla |
| ⚡ Hızlı Öğrenci | Beklenen sürenin yarısında tamamla |
| 💯 Mükemmel Skor | 100 puan al |
| 🔥 3 Gün Seri | 3 gün üst üste çalış |
| 🔥 Hafta Serisi | 7 gün üst üste çalış |
| 🔥 Ay Serisi | 30 gün üst üste çalış |
| 📚 Bölüm Ustası | 5 bölümü tamamla |
| 🏆 Zorluk Fatihi | Bir zorluk türünün tüm bölümlerini bitir |
| 🦋 Sosyal Kelebek | 10 AI sohbeti yap |
| 🤖 AI Kaşifi | İlk AI sohbetini başlat |

### Skor Hesaplama

```
Temel Skor + Hız Bonusu + İlk Deneme Bonusu − Deneme Cezası
```

- **Hız Bonusu:** Beklenen sürenin altında tamamlarsan +20 puan
- **İlk Deneme Bonusu:** İlk denemede başarılı olursan +15 puan
- **Deneme Cezası:** Her ek deneme için −5 puan (min 0)

---

## 🤖 AI Entegrasyonu

Claude Sonnet 4, her zorluk türü ve kullanıcı rolü için özelleştirilmiş Türkçe promptlar kullanır:

- **Öğrenci Promptları:** Basit, destekleyici, oyunlaştırılmış dil
- **Veli Promptları:** Ev desteği önerileri, ilerleme bilgilendirmesi
- **Öğretmen Promptları:** Pedagojik öneriler, müfredat uyarlama

---

## ⚙️ Ortam Değişkenleri

| Değişken | Açıklama | Varsayılan |
|---|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı URL'i | `postgresql+asyncpg://...` |
| `REDIS_URL` | Redis bağlantı URL'i | `redis://localhost:6379` |
| `JWT_SECRET_KEY` | JWT imzalama anahtarı | *(zorunlu)* |
| `JWT_ALGORITHM` | JWT algoritması | `HS256` |
| `JWT_EXPIRE_MINUTES` | Token geçerlilik süresi | `1440` (24 saat) |
| `ANTHROPIC_API_KEY` | Anthropic API anahtarı | *(zorunlu)* |
| `AI_MODEL` | Claude model adı | `claude-sonnet-4-20250514` |
| `AI_MAX_TOKENS` | AI max çıktı token | `1024` |
| `CORS_ORIGINS` | İzin verilen origin'ler | `http://localhost:3000` |
| `RATE_LIMIT` | Rate limit (req/min) | `60/minute` |
| `LOG_LEVEL` | Log seviyesi | `INFO` |

---

## 📄 Lisans

Bu proje eğitim amaçlıdır.

---

**YuBuBu** — *Her çocuk öğrenebilir!* 🌈
