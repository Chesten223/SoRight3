import json
import os
from app import app
from models import db, User, Question, QuestionProgress, Note, Notebook, QuestionLog, InvitationCode

def load_json(filepath):
    if not os.path.exists(filepath):
        print(f"⚠️  Warning: File not found: {filepath}")
        return [] if 'questions' in filepath else {}
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def migrate():
    print("🚀 开始全量重置与迁移... (Clean Initialization)")
    
    # 确保 instance 目录存在
    if not os.path.exists(app.instance_path):
        os.makedirs(app.instance_path)
        print(f"📂 Created instance folder at: {app.instance_path}")

    with app.app_context():
        # 1. 暴力重置：重建表结构
        db_path = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"1️⃣  正在重置数据库: {db_path}")
        db.drop_all()
        db.create_all()
        
        # 2. 创建超级管理员
        print("2️⃣  创建超级管理员 (Admin)...")
        admin = User(username="admin", is_admin=True)
        admin.set_password("123456") # 默认密码
        db.session.add(admin)
        
        # 3. 创建初始邀请码
        print("3️⃣  生成初始邀请码...")
        init_code = InvitationCode(code="HELLO2025", created_by_id=admin.id)
        db.session.add(init_code)
        
        db.session.commit() # 提交用户以获取 ID
        # [NEW] 给管理员也整一份说明书
        from question_service import service
        service.init_new_user(admin)
        print(f"   ✅ 管理员账号: admin / 123456")
        print(f"   ✅ 通用邀请码: HELLO2025")

        # 4. 迁移静态题库 (Questions)
        print("4️⃣  导入题库数据...")
        q_files = {
            "exam": "data/exam_questions.json",
            "training": "data/training_questions.json"
        }
        count_q = 0
        for mode, path in q_files.items():
            questions_data = load_json(path)
            for q_data in questions_data:
                # 防止重复
                if db.session.get(Question, q_data['id']): continue
                
                new_q = Question(
                    id=q_data['id'],
                    content=q_data['content'],
                    options=q_data.get('options', []),
                    correct_id=q_data.get('correct_id', 'A'),
                    analysis=q_data.get('ai_context', {}).get('explanation', ''),
                    tags=q_data.get('tags', []),
                    mode=mode
                )
                db.session.add(new_q)
                count_q += 1
        db.session.commit()
        print(f"   ✅ 导入题目: {count_q} 道")

        # 5. 迁移旧版用户数据 (如果有 user_data.json)
        user_data_path = "user_data.json"
        if os.path.exists(user_data_path):
            print("5️⃣  发现旧版数据 user_data.json，正在迁移给 Admin...")
            user_data = load_json(user_data_path)
            
            # 5.1 迁移刷题进度
            metrics = user_data.get('metrics', {})
            count_p = 0
            for q_id, m in metrics.items():
                if db.session.get(Question, q_id):
                    progress = QuestionProgress(
                        user_id=admin.id,
                        question_id=q_id,
                        proficiency=m.get('proficiency', 0),
                        attempts=m.get('attempts', 0),
                        errors=m.get('errors', 0),
                        stage=m.get('stage', 0),
                        next_review_time=m.get('next_review', 0)
                    )
                    db.session.add(progress)
                    count_p += 1
            print(f"   ✅ 迁移刷题进度: {count_p} 条")

            # 5.2 迁移笔记
            raw_notes = user_data.get('notes', {})
            def create_note_node(node_id, parent_db_id=None):
                node_data = raw_notes.get(node_id)
                if not node_data: return None
                
                new_note = Note(
                    user_id=admin.id,
                    name=node_data['name'],
                    type=node_data.get('type', 'folder'),
                    content=node_data.get('content', ''),
                    parent_id=parent_db_id
                )
                db.session.add(new_note)
                db.session.flush()
                
                # [FIX] 增加 or [] 容错，防止 children 为 null
                children = node_data.get('children') or []
                for idx, child_id in enumerate(children):
                    child_obj = create_note_node(child_id, new_note.id)
                    if child_obj: child_obj.order_index = idx
                return new_note

            if 'root' in raw_notes:
                # [FIX] 增加 or [] 容错
                root_children = raw_notes['root'].get('children') or []
                for idx, child_id in enumerate(root_children):
                    note = create_note_node(child_id, None)
                    if note: note.order_index = idx
            print("   ✅ 迁移笔记完成")
            
            # 5.3 迁移错题本
            raw_books = user_data.get('notebooks', {})
            def create_book_node(book_id, parent_db_id=None):
                book_data = raw_books.get(book_id)
                if not book_data: return None
                
                new_book = Notebook(
                    user_id=admin.id,
                    name=book_data['name'],
                    tags=book_data.get('tags', []),
                    parent_id=parent_db_id
                )
                db.session.add(new_book)
                db.session.flush()
                
                for qid in book_data.get('questions', []):
                    q = db.session.get(Question, qid)
                    if q: new_book.questions.append(q)
                
                # [FIX] 增加 or [] 容错
                children = book_data.get('children') or []
                for idx, child_id in enumerate(children):
                    child_obj = create_book_node(child_id, new_book.id)
                    if child_obj: child_obj.order_index = idx
                return new_book

            if 'root' in raw_books:
                # [FIX] 增加 or [] 容错
                root_children = raw_books['root'].get('children') or []
                for idx, child_id in enumerate(root_children):
                    book = create_book_node(child_id, None)
                    if book: book.order_index = idx
            print("   ✅ 迁移错题本完成")
            
            db.session.commit()
        else:
            print("   ℹ️  未发现 user_data.json，跳过旧数据迁移。")

        print("\n🎉🎉🎉 初始化完成！请使用账号: admin / 123456 登录")

if __name__ == '__main__':
    migrate()