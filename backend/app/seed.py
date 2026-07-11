"""
Seed data awal: 3 hardcoded users + beberapa sample task.
Jalankan: python -m app.seed
"""
from datetime import datetime, timedelta

from app.database import SessionLocal, engine, Base
from app import models, auth


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            users = [
                models.User(username="admin", full_name="Admin Moonlay", hashed_password=auth.hash_password("admin123")),
                models.User(username="budi", full_name="Budi Santoso", hashed_password=auth.hash_password("budi123")),
                models.User(username="sari", full_name="Sari Dewi", hashed_password=auth.hash_password("sari123")),
            ]
            db.add_all(users)
            db.commit()
            for u in users:
                db.refresh(u)
            print("Seeded users: admin/admin123, budi/budi123, sari/sari123")
        else:
            users = db.query(models.User).all()
            print("Users already exist, skipping user seed.")

        if db.query(models.Task).count() == 0:
            budi = next(u for u in users if u.username == "budi")
            sari = next(u for u in users if u.username == "sari")
            now = datetime.utcnow()
            tasks = [
                models.Task(
                    title="Setup project repository",
                    description="Inisialisasi repo frontend & backend, setup CI dasar.",
                    status=models.TaskStatus.DONE,
                    deadline=now - timedelta(days=2),
                    assignee_id=budi.id,
                ),
                models.Task(
                    title="Desain skema database",
                    description="Rancang ERD untuk tabel users dan tasks.",
                    status=models.TaskStatus.IN_PROGRESS,
                    deadline=now + timedelta(days=1),
                    assignee_id=sari.id,
                ),
                models.Task(
                    title="Implementasi endpoint CRUD task",
                    description="Buat endpoint create, read, update, delete untuk task.",
                    status=models.TaskStatus.TODO,
                    deadline=now + timedelta(days=3),
                    assignee_id=budi.id,
                ),
                models.Task(
                    title="Integrasi AI chatbot",
                    description="Tambahkan fitur chatbot untuk tanya jawab data task.",
                    status=models.TaskStatus.TODO,
                    deadline=now,
                    assignee_id=None,
                ),
            ]
            db.add_all(tasks)
            db.commit()
            print("Seeded sample tasks.")
        else:
            print("Tasks already exist, skipping task seed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
