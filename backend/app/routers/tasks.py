import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _get_task_or_404(db: Session, task_id: uuid.UUID) -> models.Task:
    task = (
        db.query(models.Task)
        .options(joinedload(models.Task.assignee))
        .filter(models.Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task tidak ditemukan")
    return task


@router.get("", response_model=List[schemas.TaskOut])
def list_tasks(
    status_filter: Optional[models.TaskStatus] = None,
    assignee_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Melihat daftar seluruh task, dengan filter opsional by status/assignee."""
    query = db.query(models.Task).options(joinedload(models.Task.assignee))
    if status_filter:
        query = query.filter(models.Task.status == status_filter)
    if assignee_id:
        query = query.filter(models.Task.assignee_id == assignee_id)
    return query.order_by(models.Task.created_at.desc()).all()


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return _get_task_or_404(db, task_id)


@router.post("", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if payload.assignee_id:
        assignee = db.query(models.User).filter(models.User.id == payload.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=400, detail="Assignee tidak ditemukan")

    task = models.Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return _get_task_or_404(db, task.id)


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: uuid.UUID,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = _get_task_or_404(db, task_id)

    update_data = payload.model_dump(exclude_unset=True)
    if "assignee_id" in update_data and update_data["assignee_id"]:
        assignee = db.query(models.User).filter(models.User.id == update_data["assignee_id"]).first()
        if not assignee:
            raise HTTPException(status_code=400, detail="Assignee tidak ditemukan")

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return _get_task_or_404(db, task.id)


@router.patch("/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: uuid.UUID,
    payload: schemas.TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Endpoint khusus untuk mengubah status task (dipakai saat drag/drop atau quick-toggle di UI)."""
    task = _get_task_or_404(db, task_id)
    task.status = payload.status
    db.commit()
    db.refresh(task)
    return _get_task_or_404(db, task.id)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = _get_task_or_404(db, task_id)
    db.delete(task)
    db.commit()
    return None
