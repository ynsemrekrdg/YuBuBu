"""
Comprehensive seed data script for YuBuBu platform.
Creates: 10 schools, ~40 teachers, 5 parents, 8 students with auto-generated credentials.
Also seeds chapter data.

Run: cd backend && python -m app.seed_auth_data
"""

import asyncio
import uuid
from datetime import datetime

from loguru import logger
from passlib.context import CryptContext

from app.domain.entities.enums import LearningDifficulty, UserRole
from app.infrastructure.database.models import (
    ParentStudentRelationModel,
    SchoolModel,
    StudentProfileModel,
    TeacherModel,
    UserModel,
)
from app.infrastructure.database.session import async_session_factory, init_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_pw(plain: str) -> str:
    return pwd_context.hash(plain)


# ═══════════════════════════════════════════════════════════════
# SEED DATA DEFINITIONS
# ═══════════════════════════════════════════════════════════════

# ─── 10 Schools ──────────────────────────────────────────────

SCHOOLS = [
    {"name": "Atatürk İlkokulu", "city": "İstanbul", "district": "Kadıköy"},
    {"name": "Cumhuriyet İlkokulu", "city": "İstanbul", "district": "Beşiktaş"},
    {"name": "Fatih İlkokulu", "city": "Ankara", "district": "Çankaya"},
    {"name": "Mevlana İlkokulu", "city": "Ankara", "district": "Keçiören"},
    {"name": "Yunus Emre İlkokulu", "city": "İzmir", "district": "Bornova"},
    {"name": "Mehmet Akif İlkokulu", "city": "İzmir", "district": "Konak"},
    {"name": "Namık Kemal İlkokulu", "city": "Bursa", "district": "Nilüfer"},
    {"name": "Hasan Ali Yücel İlkokulu", "city": "Antalya", "district": "Muratpaşa"},
    {"name": "İnönü İlkokulu", "city": "Eskişehir", "district": "Tepebaşı"},
    {"name": "Ziya Gökalp İlkokulu", "city": "Konya", "district": "Selçuklu"},
]

# ─── ~40 Teachers (4 per school) ─────────────────────────────

TEACHER_NAMES = [
    # School 0 - Atatürk İlkokulu
    ("Ayşe Kaya", "Sınıf Öğretmeni"),
    ("Mehmet Demir", "Sınıf Öğretmeni"),
    ("Fatma Yılmaz", "Özel Eğitim"),
    ("Ali Çelik", "Rehber Öğretmen"),
    # School 1 - Cumhuriyet İlkokulu
    ("Zeynep Arslan", "Sınıf Öğretmeni"),
    ("Hasan Koç", "Sınıf Öğretmeni"),
    ("Emine Şahin", "Özel Eğitim"),
    ("Mustafa Aydın", "Rehber Öğretmen"),
    # School 2 - Fatih İlkokulu
    ("Hatice Öztürk", "Sınıf Öğretmeni"),
    ("İbrahim Kılıç", "Sınıf Öğretmeni"),
    ("Merve Yıldız", "Özel Eğitim"),
    ("Osman Polat", "Rehber Öğretmen"),
    # School 3 - Mevlana İlkokulu
    ("Elif Güneş", "Sınıf Öğretmeni"),
    ("Ahmet Ay", "Sınıf Öğretmeni"),
    ("Sultan Erdoğan", "Özel Eğitim"),
    ("Yusuf Aktaş", "Rehber Öğretmen"),
    # School 4 - Yunus Emre İlkokulu
    ("Büşra Çetin", "Sınıf Öğretmeni"),
    ("Emre Kaplan", "Sınıf Öğretmeni"),
    ("Seda Kurt", "Özel Eğitim"),
    ("Burak Özkan", "Rehber Öğretmen"),
    # School 5 - Mehmet Akif İlkokulu
    ("Gülsüm Taş", "Sınıf Öğretmeni"),
    ("Serkan Yalçın", "Sınıf Öğretmeni"),
    ("Derya Aksoy", "Özel Eğitim"),
    ("Kadir Doğan", "Rehber Öğretmen"),
    # School 6 - Namık Kemal İlkokulu
    ("Canan Acar", "Sınıf Öğretmeni"),
    ("Tolga Başaran", "Sınıf Öğretmeni"),
    ("Dilek Erdem", "Özel Eğitim"),
    ("Murat Uçar", "Rehber Öğretmen"),
    # School 7 - Hasan Ali Yücel İlkokulu
    ("Pınar Güler", "Sınıf Öğretmeni"),
    ("Volkan Işık", "Sınıf Öğretmeni"),
    ("Nurgül Tuncer", "Özel Eğitim"),
    ("Cem Karaca", "Rehber Öğretmen"),
    # School 8 - İnönü İlkokulu
    ("Gamze Koçak", "Sınıf Öğretmeni"),
    ("Erhan Yavuz", "Sınıf Öğretmeni"),
    ("Sibel Deniz", "Özel Eğitim"),
    ("Bilal Tekin", "Rehber Öğretmen"),
    # School 9 - Ziya Gökalp İlkokulu
    ("Hülya Şen", "Sınıf Öğretmeni"),
    ("Erdem Ceylan", "Sınıf Öğretmeni"),
    ("Aslı Korkmaz", "Özel Eğitim"),
    ("Ferhat Özdemir", "Rehber Öğretmen"),
]

# ─── 5 Parents ───────────────────────────────────────────────

PARENTS = [
    {"name": "Selma Yılmaz", "email": "selma.yilmaz@test.com", "password": "veli123"},
    {"name": "Kemal Demir", "email": "kemal.demir@test.com", "password": "veli123"},
    {"name": "Fatma Arslan", "email": "fatma.arslan@test.com", "password": "veli123"},
    {"name": "Hüseyin Çelik", "email": "huseyin.celik@test.com", "password": "veli123"},
    {"name": "Ayşegül Koç", "email": "aysegul.koc@test.com", "password": "veli123"},
]

# ─── 8 Students (linked to parents) ─────────────────────────
# parent_idx: which parent owns this child
# school_idx: which school
# teacher_idx: index in TEACHER_NAMES

STUDENTS = [
    {
        "name": "Ali Yılmaz",
        "age": 8,
        "grade": 2,
        "difficulty": LearningDifficulty.DYSLEXIA,
        "parent_idx": 0,
        "school_idx": 0,
        "teacher_idx": 0,
        "username": "ali_yilmaz_1234",
        "password": "ali1234",
    },
    {
        "name": "Zeynep Yılmaz",
        "age": 10,
        "grade": 4,
        "difficulty": LearningDifficulty.DYSGRAPHIA,
        "parent_idx": 0,
        "school_idx": 0,
        "teacher_idx": 1,
        "username": "zeynep_yilmaz_5678",
        "password": "zeynep5678",
    },
    {
        "name": "Enes Demir",
        "age": 7,
        "grade": 1,
        "difficulty": LearningDifficulty.DYSCALCULIA,
        "parent_idx": 1,
        "school_idx": 1,
        "teacher_idx": 4,
        "username": "enes_demir_3456",
        "password": "enes3456",
    },
    {
        "name": "Elif Demir",
        "age": 9,
        "grade": 3,
        "difficulty": LearningDifficulty.DYSLEXIA,
        "parent_idx": 1,
        "school_idx": 1,
        "teacher_idx": 5,
        "username": "elif_demir_7890",
        "password": "elif7890",
    },
    {
        "name": "Yusuf Arslan",
        "age": 8,
        "grade": 2,
        "difficulty": LearningDifficulty.DYSGRAPHIA,
        "parent_idx": 2,
        "school_idx": 2,
        "teacher_idx": 8,
        "username": "yusuf_arslan_2345",
        "password": "yusuf2345",
    },
    {
        "name": "Beren Çelik",
        "age": 6,
        "grade": 1,
        "difficulty": LearningDifficulty.DYSCALCULIA,
        "parent_idx": 3,
        "school_idx": 3,
        "teacher_idx": 12,
        "username": "beren_celik_6789",
        "password": "beren6789",
    },
    {
        "name": "Mert Çelik",
        "age": 11,
        "grade": 5,
        "difficulty": LearningDifficulty.DYSLEXIA,
        "parent_idx": 3,
        "school_idx": 3,
        "teacher_idx": 13,
        "username": "mert_celik_4567",
        "password": "mert4567",
    },
    {
        "name": "Defne Koç",
        "age": 9,
        "grade": 3,
        "difficulty": LearningDifficulty.DYSGRAPHIA,
        "parent_idx": 4,
        "school_idx": 4,
        "teacher_idx": 16,
        "username": "defne_koc_8901",
        "password": "defne8901",
    },
]


async def seed_auth_data():
    """Seed schools, teachers, parents, students, and relationships."""
    await init_db()

    async with async_session_factory() as session:
        try:
            # ─── Check if already seeded ────────────
            from sqlalchemy import select, func
            count = await session.execute(
                select(func.count()).select_from(SchoolModel)
            )
            if count.scalar() > 0:
                logger.info("Auth seed data already exists, skipping...")
                return

            logger.info("🌱 Seeding auth data...")

            # ─── 1. Create Schools ──────────────────
            school_models = []
            school_ids = []
            for s in SCHOOLS:
                sid = uuid.uuid4()
                school_ids.append(sid)
                model = SchoolModel(
                    id=sid,
                    name=s["name"],
                    city=s["city"],
                    district=s["district"],
                    is_active=True,
                )
                session.add(model)
                school_models.append(model)
            await session.flush()
            logger.info(f"✅ {len(SCHOOLS)} okul oluşturuldu")

            # ─── 2. Create Teacher Users + Teacher Profiles ─
            teacher_ids = []  # TeacherModel IDs
            teacher_user_ids = []  # User IDs
            for i, (name, branch) in enumerate(TEACHER_NAMES):
                school_idx = i // 4
                school_id = school_ids[school_idx]

                # Create teacher user
                email_name = name.lower().replace(" ", ".").replace("ı", "i").replace("ö", "o").replace("ü", "u").replace("ş", "s").replace("ç", "c").replace("ğ", "g")
                user_id = uuid.uuid4()
                user = UserModel(
                    id=user_id,
                    email=f"{email_name}@test.com",
                    name=name,
                    hashed_password=hash_pw("ogretmen123"),
                    role=UserRole.TEACHER,
                    is_active=True,
                )
                session.add(user)
                teacher_user_ids.append(user_id)

                # Create teacher profile
                tid = uuid.uuid4()
                teacher_ids.append(tid)
                teacher = TeacherModel(
                    id=tid,
                    user_id=user_id,
                    school_id=school_id,
                    branch=branch,
                )
                session.add(teacher)

            await session.flush()
            logger.info(f"✅ {len(TEACHER_NAMES)} öğretmen oluşturuldu")

            # ─── 3. Create Parents ──────────────────
            parent_ids = []
            for p in PARENTS:
                pid = uuid.uuid4()
                parent_ids.append(pid)
                user = UserModel(
                    id=pid,
                    email=p["email"],
                    name=p["name"],
                    hashed_password=hash_pw(p["password"]),
                    role=UserRole.PARENT,
                    is_active=True,
                )
                session.add(user)
            await session.flush()
            logger.info(f"✅ {len(PARENTS)} veli oluşturuldu")

            # ─── 4. Create Students ─────────────────
            credentials = []
            for st in STUDENTS:
                student_user_id = uuid.uuid4()
                parent_id = parent_ids[st["parent_idx"]]
                school_id = school_ids[st["school_idx"]]
                t_id = teacher_ids[st["teacher_idx"]]

                # Create student user (username-based, no email)
                user = UserModel(
                    id=student_user_id,
                    email=None,
                    username=st["username"],
                    name=st["name"],
                    hashed_password=hash_pw(st["password"]),
                    role=UserRole.STUDENT,
                    is_active=True,
                )
                session.add(user)

                # Create student profile
                profile_id = uuid.uuid4()
                profile = StudentProfileModel(
                    id=profile_id,
                    user_id=student_user_id,
                    age=st["age"],
                    learning_difficulty=st["difficulty"],
                    current_level=1,
                    total_score=0,
                    preferences={},
                    streak_days=0,
                    parent_id=parent_id,
                    school_id=school_id,
                    teacher_id=t_id,
                    grade=st["grade"],
                )
                session.add(profile)

                # Create parent-student relation
                relation = ParentStudentRelationModel(
                    id=uuid.uuid4(),
                    parent_id=parent_id,
                    student_id=student_user_id,
                )
                session.add(relation)

                credentials.append({
                    "student_name": st["name"],
                    "username": st["username"],
                    "password": st["password"],
                    "parent_name": PARENTS[st["parent_idx"]]["name"],
                    "school": SCHOOLS[st["school_idx"]]["name"],
                    "difficulty": st["difficulty"].value,
                    "grade": st["grade"],
                })

            await session.flush()
            logger.info(f"✅ {len(STUDENTS)} öğrenci oluşturuldu")

            # ─── 5. Create admin user (skip if exists) ───────────────
            from sqlalchemy import select as sa_select
            existing_admin = await session.execute(
                sa_select(UserModel).where(UserModel.email == "admin@yububu.com")
            )
            if not existing_admin.scalar_one_or_none():
                admin_id = uuid.uuid4()
                admin = UserModel(
                    id=admin_id,
                    email="admin@yububu.com",
                    username="admin",
                    name="Admin",
                    hashed_password=hash_pw("admin123"),
                    role=UserRole.ADMIN,
                    is_active=True,
                )
                session.add(admin)
                await session.flush()
                logger.info("✅ Admin kullanıcı oluşturuldu")
            else:
                logger.info("ℹ️ Admin kullanıcı zaten var, atlanıyor")

            await session.commit()
            logger.info("🎉 Tüm auth seed verileri başarıyla oluşturuldu!")

        except Exception as e:
            await session.rollback()
            logger.error(f"❌ Seed hatası: {e}")
            raise

    # Always write credentials file
    _write_credentials(credentials)


def _write_credentials(credentials: list):
    """Write test credentials to a file."""
    lines = [
        "=" * 60,
        "  YuBuBu - TEST GİRİŞ BİLGİLERİ",
        "=" * 60,
        "",
        "─── VELİ HESAPLARI ─────────────────────────────",
    ]

    for p in PARENTS:
        lines.append(f"  İsim:    {p['name']}")
        lines.append(f"  E-posta: {p['email']}")
        lines.append(f"  Şifre:   {p['password']}")
        lines.append("")

    lines.append("─── ÖĞRENCİ HESAPLARI ──────────────────────────")
    for c in credentials:
        lines.append(f"  İsim:     {c['student_name']}")
        lines.append(f"  K.Adı:    {c['username']}")
        lines.append(f"  Şifre:    {c['password']}")
        lines.append(f"  Veli:     {c['parent_name']}")
        lines.append(f"  Okul:     {c['school']}")
        lines.append(f"  Sınıf:    {c['grade']}")
        lines.append(f"  Güçlük:   {c['difficulty']}")
        lines.append("")

    lines.append("─── ÖĞRETMEN HESAPLARI ─────────────────────────")
    lines.append("  Tüm öğretmenler:")
    lines.append("  Şifre: ogretmen123")
    lines.append("  E-posta: isim.soyisim@test.com biçiminde")
    lines.append("")
    for i, (name, branch) in enumerate(TEACHER_NAMES[:8]):
        email_name = name.lower().replace(" ", ".").replace("ı", "i").replace("ö", "o").replace("ü", "u").replace("ş", "s").replace("ç", "c").replace("ğ", "g")
        school_idx = i // 4
        lines.append(f"  {name} ({branch}) - {SCHOOLS[school_idx]['name']}")
        lines.append(f"    E-posta: {email_name}@test.com")
    lines.append("  ... ve 32 öğretmen daha")
    lines.append("")

    lines.append("─── ADMİN HESABI ───────────────────────────────")
    lines.append("  E-posta/K.Adı: admin@yububu.com / admin")
    lines.append("  Şifre:         admin123")
    lines.append("")
    lines.append("=" * 60)

    import os
    filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_credentials.txt")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    logger.info(f"📄 Test bilgileri yazıldı: {filepath}")


if __name__ == "__main__":
    asyncio.run(seed_auth_data())
