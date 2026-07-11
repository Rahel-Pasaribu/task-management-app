import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models import TaskStatus


# ---------- Auth ----------

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ---------- User ----------

class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


# ---------- Task ----------

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    deadline: Optional[datetime] = None
    assignee_id: Optional[uuid.UUID] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    deadline: Optional[datetime] = None
    assignee_id: Optional[uuid.UUID] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskOut(TaskBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)


# ---------- Chatbot ----------

class ChatbotQuery(BaseModel):
    question: str


class ChatbotResponse(BaseModel):
    answer: str
