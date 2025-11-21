from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid
import random
import string

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

# ================== 1. 用户系统 (Updated) ==================

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    username = db.Column(db.String(80), unique=True, nullable=False) # 登录用
    nickname = db.Column(db.String(80), nullable=True)               # [NEW] 显示用昵称
    password_hash = db.Column(db.String(128))
    
    avatar = db.Column(db.String(100), default='default.png')
    
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    settings = db.Column(db.JSON, default=dict) 
    
    # 关联
    notes = db.relationship('Note', backref='owner', lazy='dynamic')
    notebooks = db.relationship('Notebook', backref='owner', lazy='dynamic')
    progress = db.relationship('QuestionProgress', backref='owner', lazy='dynamic')
    logs = db.relationship('QuestionLog', backref='owner', lazy='dynamic')
    sessions = db.relationship('StudySession', backref='owner', lazy='dynamic')
    used_invite_code_id = db.Column(db.Integer, db.ForeignKey('invitation_codes.id'), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    # 获取显示名称：如果有昵称就显示昵称，否则显示用户名
    @property
    def display_name(self):
        return self.nickname if self.nickname else self.username

class InvitationCode(db.Model):
    __tablename__ = 'invitation_codes'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    created_by_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    used_by = db.relationship('User', backref='invitation_code', foreign_keys=[User.used_invite_code_id])

    @staticmethod
    def generate_code():
        chars = string.ascii_uppercase + string.digits
        return ''.join(random.choice(chars) for _ in range(8))

# ================== 2. 笔记系统 ==================
class Note(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(20), default='file')
    content = db.Column(db.Text, nullable=True)
    parent_id = db.Column(db.String(36), db.ForeignKey('notes.id'), nullable=True)
    children = db.relationship('Note', backref=db.backref('parent', remote_side=[id]), lazy='dynamic', cascade="all, delete-orphan")
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

# ================== 3. 错题本系统 ==================
notebook_questions = db.Table('notebook_questions',
    db.Column('notebook_id', db.String(36), db.ForeignKey('notebooks.id'), primary_key=True),
    db.Column('question_id', db.String(50), db.ForeignKey('questions.id'), primary_key=True),
    db.Column('added_at', db.DateTime, default=datetime.now)
)

class Notebook(db.Model):
    __tablename__ = 'notebooks'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    tags = db.Column(db.JSON, default=list)
    parent_id = db.Column(db.String(36), db.ForeignKey('notebooks.id'), nullable=True)
    children = db.relationship('Notebook', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')
    questions = db.relationship('Question', secondary=notebook_questions, lazy='subquery', backref=db.backref('notebooks', lazy=True))
    order_index = db.Column(db.Integer, default=0)

# ================== 4. 静态题库 ==================
class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.String(50), primary_key=True)
    content = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False)
    correct_id = db.Column(db.String(10), nullable=False)
    analysis = db.Column(db.Text, nullable=True)
    tags = db.Column(db.JSON, default=list)
    mode = db.Column(db.String(20), default='training')

# ================== 5. 数据核心 ==================
class QuestionProgress(db.Model):
    __tablename__ = 'question_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    question_id = db.Column(db.String(50), db.ForeignKey('questions.id'), nullable=False)
    proficiency = db.Column(db.Integer, default=0)
    attempts = db.Column(db.Integer, default=0)
    errors = db.Column(db.Integer, default=0)
    stage = db.Column(db.Integer, default=0)
    next_review_time = db.Column(db.Float, default=0)
    last_reviewed_at = db.Column(db.DateTime, default=datetime.now)

class StudySession(db.Model):
    __tablename__ = 'study_sessions'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    mode = db.Column(db.String(20))
    start_time = db.Column(db.DateTime, default=datetime.now)
    end_time = db.Column(db.DateTime)
    duration_seconds = db.Column(db.Integer, default=0)
    total_questions = db.Column(db.Integer, default=0)
    correct_count = db.Column(db.Integer, default=0)
    score = db.Column(db.Integer, default=0)

class QuestionLog(db.Model):
    __tablename__ = 'question_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    question_id = db.Column(db.String(50), db.ForeignKey('questions.id'), nullable=False)
    session_id = db.Column(db.String(36), db.ForeignKey('study_sessions.id'), nullable=True)
    is_correct = db.Column(db.Boolean, nullable=False)
    user_choice = db.Column(db.String(10))
    duration_ms = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.now)