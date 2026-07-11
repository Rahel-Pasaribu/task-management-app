"""
Bonus feature: AI Chatbot untuk menjawab pertanyaan seputar data task.

Cara kerja (lihat penjelasan lengkap di README.md):
1. Backend mengambil seluruh data task terkini dari PostgreSQL.
2. Data itu diringkas menjadi teks konteks singkat (judul, status,
   deadline, assignee tiap task).
3. Konteks + pertanyaan user dikirim ke LLM sungguhan untuk dijawab
   secara natural language:
   - Google Gemini (`GEMINI_API_KEY`) — punya tier gratis, direkomendasikan
     untuk demo/penilaian tanpa biaya.
   - OpenAI (`OPENAI_API_KEY`) — dipakai jika Gemini key tidak diisi.
4. Jika TIDAK ADA API key sama sekali (mis. saat demo offline), sistem
   otomatis fallback ke mode "rule-based intent matching" yang
   mendeteksi pola pertanyaan umum dan menjawab langsung dari database
   tanpa memanggil LLM eksternal, supaya fitur tetap bisa dicoba.

Pendekatan ini disebut RAG sederhana (Retrieval-Augmented Generation):
LLM tidak diberi akses bebas ke DB, melainkan hanya ke ringkasan data
yang relevan, supaya jawaban selalu akurat & tidak berhalusinasi.
"""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas, auth
from app.config import settings

router = APIRouter(prefix="/chatbot", tags=["Chatbot (Bonus)"])


def _build_task_context(db: Session) -> str:
    tasks = db.query(models.Task).options(joinedload(models.Task.assignee)).all()
    lines = []
    for t in tasks:
        assignee_name = t.assignee.full_name if t.assignee else "Belum ada assignee"
        deadline_str = t.deadline.strftime("%Y-%m-%d") if t.deadline else "Tidak ada deadline"
        lines.append(
            f"- Judul: {t.title} | Status: {t.status.value} | Deadline: {deadline_str} | Assignee: {assignee_name}"
        )
    return "\n".join(lines) if lines else "Tidak ada task sama sekali."


def _rule_based_answer(question: str, db: Session) -> str:
    """Fallback sederhana tanpa memanggil LLM eksternal."""
    q = question.lower()
    tasks = db.query(models.Task).options(joinedload(models.Task.assignee)).all()

    if any(k in q for k in ["belum selesai", "belum done", "outstanding", "belum beres"]):
        pending = [t for t in tasks if t.status != models.TaskStatus.DONE]
        if not pending:
            return "Semua task sudah selesai. 🎉"
        listing = "\n".join(f"- {t.title} ({t.status.value})" for t in pending)
        return f"Task yang belum selesai ({len(pending)}):\n{listing}"

    if "jumlah" in q and ("selesai" in q or "done" in q):
        done_count = sum(1 for t in tasks if t.status == models.TaskStatus.DONE)
        return f"Jumlah task yang sudah selesai: {done_count} dari total {len(tasks)} task."

    if "deadline" in q and ("hari ini" in q or "today" in q):
        today = date.today()
        due_today = [t for t in tasks if t.deadline and t.deadline.date() == today]
        if not due_today:
            return "Tidak ada task dengan deadline hari ini."
        listing = "\n".join(f"- {t.title} (assignee: {t.assignee.full_name if t.assignee else '-'})" for t in due_today)
        return f"Task dengan deadline hari ini:\n{listing}"

    if "assignee" in q or "siapa" in q:
        match = None
        for t in tasks:
            if t.title.lower() in q:
                match = t
                break
        if match:
            name = match.assignee.full_name if match.assignee else "belum ditentukan"
            return f"Assignee dari task '{match.title}' adalah {name}."
        return "Task tersebut tidak ditemukan. Coba sebutkan judul task secara lengkap."

    total = len(tasks)
    todo = sum(1 for t in tasks if t.status == models.TaskStatus.TODO)
    in_progress = sum(1 for t in tasks if t.status == models.TaskStatus.IN_PROGRESS)
    done = sum(1 for t in tasks if t.status == models.TaskStatus.DONE)
    return (
        "Maaf, saya belum memahami pertanyaan itu secara spesifik. "
        f"Ringkasan saat ini: total {total} task ({todo} Todo, {in_progress} In Progress, {done} Done). "
        "Coba tanyakan misalnya: 'task apa saja yang belum selesai?', "
        "'berapa jumlah task yang sudah selesai?', atau 'siapa assignee dari task <judul>?'"
    )


def _build_system_prompt(context: str) -> str:
    return (
        "Kamu adalah asisten yang menjawab pertanyaan seputar data task "
        "manajemen di bawah ini. Jawab singkat, akurat, dan hanya berdasarkan "
        "data yang diberikan. Jika data tidak cukup, katakan terus terang.\n\n"
        f"Data task saat ini:\n{context}"
    )


def _gemini_answer(question: str, context: str) -> str:
    """Panggil Google Gemini API (generateContent) jika GEMINI_API_KEY tersedia."""
    import httpx

    system_prompt = _build_system_prompt(context)
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    )
    resp = httpx.post(
        url,
        json={
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": question}]}],
            "generationConfig": {"temperature": 0.2},
        },
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def _openai_answer(question: str, context: str) -> str:
    """Panggil OpenAI Chat Completions API jika OPENAI_API_KEY tersedia."""
    import httpx

    system_prompt = _build_system_prompt(context)
    resp = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
        json={
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            "temperature": 0.2,
        },
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


@router.post("/query", response_model=schemas.ChatbotResponse)
def chatbot_query(
    payload: schemas.ChatbotQuery,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    context = _build_task_context(db)

    # Prioritas: Gemini (gratis) -> OpenAI -> rule-based fallback
    if settings.GEMINI_API_KEY:
        try:
            answer = _gemini_answer(payload.question, context)
            return schemas.ChatbotResponse(answer=answer)
        except Exception:
            pass  # fallback di bawah jika panggilan Gemini gagal

    if settings.OPENAI_API_KEY:
        try:
            answer = _openai_answer(payload.question, context)
            return schemas.ChatbotResponse(answer=answer)
        except Exception:
            pass  # fallback di bawah jika panggilan OpenAI gagal

    answer = _rule_based_answer(payload.question, db)
    return schemas.ChatbotResponse(answer=answer)
