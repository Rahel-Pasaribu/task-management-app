from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Mengembalikan daftar seluruh user, dipakai frontend untuk mengisi
    dropdown assignee pada form task.
    """
    return db.query(models.User).order_by(models.User.full_name).all()
