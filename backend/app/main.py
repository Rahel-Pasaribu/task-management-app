from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, tasks, chatbot

app = FastAPI(
    title="Task Management API",
    description="Technical Test - Moonlay Technologies (Software Developer Intern)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Membuat tabel jika belum ada. Untuk kebutuhan produksi sebaiknya
    # menggunakan Alembic migration, tapi untuk technical test ini
    # create_all sudah cukup (lihat README).
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(chatbot.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "task-management-api"}
