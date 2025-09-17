import uuid

from sqlalchemy import JSON, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    size_category = Column(String(50))
    industry = Column(String(100))
    membership_start_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("Member", back_populates="organization")
    responses = relationship("SurveyResponse", back_populates="organization")


class Member(Base):
    __tablename__ = "members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255))
    role = Column(String(100))
    preferences = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="members")
    created_surveys = relationship("Survey", back_populates="creator")
    responses = relationship("SurveyResponse", back_populates="member")


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(String)
    version = Column(String(10))
    config = Column(JSON, nullable=False)
    status = Column(String(50), default="planned")
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    max_responses = Column(Integer)
    created_by = Column(UUID(as_uuid=True), ForeignKey("members.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    published_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))

    creator = relationship("Member", back_populates="created_surveys")
    responses = relationship("SurveyResponse", back_populates="survey")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_id = Column(UUID(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"), index=True)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id", ondelete="SET NULL"), index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"))
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), index=True)
    time_spent_seconds = Column(Integer)
    answers = Column(JSON, nullable=False)
    impact_score = Column(Integer)
    meta = Column(JSON)

    survey = relationship("Survey", back_populates="responses")
    member = relationship("Member", back_populates="responses")
    organization = relationship("Organization", back_populates="responses")


class SurveyInvitation(Base):
    __tablename__ = "survey_invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_id = Column(UUID(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"), index=True)
    token = Column(String(255), unique=True, nullable=False)
    token_hash = Column(String(255), nullable=False, index=True)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id", ondelete="SET NULL"), index=True)
    email = Column(String(255))
    expires_at = Column(DateTime(timezone=True))
    used_at = Column(DateTime(timezone=True))
    max_uses = Column(Integer, default=1)
    use_count = Column(Integer, default=0)
    invitation_metadata = Column("metadata", JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    survey = relationship("Survey", backref="invitations")
    member = relationship("Member", backref="invitations")
