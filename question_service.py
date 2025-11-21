import random
import time
import json
from datetime import datetime
from sqlalchemy import func, or_
from flask_login import current_user
from models import db, User, Question, QuestionProgress, Note, Notebook, QuestionLog

class QuestionService:
    def __init__(self):
        # 遗忘曲线复习间隔 (单位: 天)
        self.review_intervals = [0, 1, 3, 7, 15, 30]

    def _get_user(self):
        """获取当前登录用户"""
        if current_user.is_authenticated:
            return current_user
        return None

    # ================= [NEW] 新用户初始化逻辑 =================

    def init_new_user(self, user):
        """为新用户创建默认数据：Inbox 错题本 + 使用说明笔记"""
        
        # 1. 创建默认错题本 'Inbox'
        if not Notebook.query.filter_by(user_id=user.id, name="Inbox").first():
            inbox = Notebook(user_id=user.id, name="Inbox")
            db.session.add(inbox)

        # 2. 创建默认说明笔记
        readme_title = "使用说明 (Read Me)"
        if not Note.query.filter_by(user_id=user.id, name=readme_title).first():
            content = """# 👋 欢迎使用 Physics Pro

这是您的个人知识库。这里有一些核心功能的使用技巧：

### 1. 关联错题 🎯
在笔记中，您可以直接插入题目卡片进行分析。
* 点击工具栏的 **Import (Q)** 按钮。

### 2. 双向链接 🔗
笔记之间可以互相引用，构建您的知识网络。
* 点击工具栏的 **Link Note** 按钮。
* 被引用的笔记底部会自动出现 **Backlinks**（反向链接）。

### 3. 数学公式 📐
完美支持 LaTeX 语法。
例如：
$$ i\\hbar\\frac{\\partial}{\\partial t}\\psi = \\hat{H}\\psi $$

### 4. 高效管理 ⚡️
* **右键** 左侧列表可进行重命名、移动、删除。
* **拖拽** 可随意调整文件和文件夹的顺序。
* **自动保存**：您的每一次输入都会被安全记录。

祝您学习愉快！
"""
            readme = Note(
                user_id=user.id,
                name=readme_title,
                type="file",
                content=content,
                order_index=0 # 放在最前面
            )
            db.session.add(readme)
        
        db.session.commit()

    # ================= 辅助工具方法 =================

    def get_question_by_id(self, q_id):
        q = db.session.get(Question, q_id)
        if not q: return None
        return {
            "id": q.id,
            "content": q.content,
            "options": q.options,
            "correct_id": q.correct_id,
            "analysis": q.analysis,
            "tags": q.tags,
            "mode": q.mode,
            "ai_context": {"explanation": q.analysis}
        }

    def _find_variant_question(self, original_q_id):
        """[Restored] 查找变式题：Tag 相同但 ID 不同的题目"""
        original_q = db.session.get(Question, original_q_id)
        if not original_q or not original_q.tags:
            return None
        
        original_tags = set(original_q.tags)
        
        # 在数据库中查找同模式的其他题目
        #由于 SQLite JSON查询限制，这里先获取同模式题目再在内存筛选(数据量<1万时性能无损)
        candidates_query = Question.query.filter(
            Question.id != original_q_id, 
            Question.mode == original_q.mode
        ).all()
        
        candidates = []
        for q in candidates_query:
            q_tags = set(q.tags)
            # 如果标签有交集，视为变式
            if len(original_tags & q_tags) > 0:
                candidates.append(q)
        
        if candidates:
            # 优先选做得少的 (Attempts 少的)
            # 需联表查询进度，这里简化为随机，或者再次查询进度
            user = self._get_user()
            if user:
                # 简单排序：优先推没做过的
                candidates.sort(key=lambda x: random.random()) 
            return self.get_question_by_id(candidates[0].id)
            
        return None

    def _get_recursive_stats(self, notebook_id):
        """[Restored] 递归计算文件夹及其子文件夹的统计数据"""
        user = self._get_user()
        node = db.session.get(Notebook, notebook_id)
        if not node: return {"errors": 0, "proficiency": 0, "total": 0, "tags": {}}
        
        stats = {"errors": 0, "proficiency": 0, "total": 0, "tags": {}}
        
        # 1. 统计当前节点的题目
        for q in node.questions:
            stats['total'] += 1
            prog = QuestionProgress.query.filter_by(user_id=user.id, question_id=q.id).first()
            if prog:
                stats['errors'] += prog.errors
                stats['proficiency'] += prog.proficiency
            
            # 统计标签
            for t in q.tags:
                stats['tags'][t] = stats['tags'].get(t, 0) + 1
                
        # 2. 递归统计子节点
        for child in node.children:
            child_stats = self._get_recursive_stats(child.id)
            stats['errors'] += child_stats['errors']
            stats['proficiency'] += child_stats['proficiency']
            stats['total'] += child_stats['total']
            # 合并标签统计
            for t, count in child_stats['tags'].items():
                stats['tags'][t] = stats['tags'].get(t, 0) + count
                
        return stats

    def get_note_view(self, node_id="root"):
        user = self._get_user()
        if not user: return {"error": "No user"}

        # 1. 确定“目标节点”和“视图上下文”
        # target_node: 用户当前点击/选中的节点（可能是文件，可能是文件夹）
        # view_node:   侧边栏应该显示的文件夹节点（如果是文件，就显示它爹；如果是文件夹，就显示它自己）
        
        target_node = None
        view_node = None # None 代表 Root 根目录
        
        if node_id != "root":
            target_node = db.session.get(Note, node_id)
            if not target_node: return {"error": "Not found"}
            if target_node.user_id != user.id: return {"error": "Access denied"}
            
            # [关键修复] 
            # 如果目标是文件，视图层级应该上移一级（显示它的兄弟姐妹）
            if target_node.type == 'file':
                view_node = target_node.parent
            else:
                view_node = target_node

        # 2. 获取子项列表 (从视图上下文取)
        if view_node:
            # 特定文件夹下
            children = view_node.children.order_by(Note.order_index).all()
        else:
            # 根目录下
            children = Note.query.filter_by(user_id=user.id, parent_id=None).order_by(Note.order_index).all()

        items = []
        for child in children:
            preview = ""
            if child.type == 'file' and child.content:
                preview = child.content[:50]
            items.append({
                "id": child.id,
                "name": child.name,
                "type": child.type,
                "preview": preview
            })

        # 3. 构建面包屑 (显示文件夹路径)
        breadcrumbs = []
        curr = view_node
        while curr:
            breadcrumbs.insert(0, {"id": curr.id, "name": curr.name})
            curr = curr.parent
        breadcrumbs.insert(0, {"id": "root", "name": "My Note"})
        # 4. 获取文件内容 (只针对 target_node)
        content = None
        backlinks = []
        
        if target_node and target_node.type == 'file':
            content = target_node.content
            # 计算反向链接
            target_tag = f"[[note:{target_node.id}]]"
            refs = Note.query.filter(
                Note.user_id == user.id, 
                Note.content.contains(target_tag), 
                Note.id != target_node.id
            ).all()
            for ref in refs:
                backlinks.append({
                    "id": ref.id, 
                    "name": ref.name, 
                    "preview": (ref.content or "")[:60] + "..."
                })

        # 5. 构造 Info 信息 (用于前端判断是显示编辑器还是文件夹视图)
        if target_node:
            info = {"id": target_node.id, "name": target_node.name, "type": target_node.type}
        else:
            info = {"id": "root", "name": "My Notes", "type": "folder"}

        return {
            "info": info,
            "items": items,
            "breadcrumbs": breadcrumbs,
            "content": content,
            "backlinks": backlinks
        }

    def create_note_item(self, name, type="folder", parent_id="root"):
        user = self._get_user()
        pid = None if parent_id == "root" else parent_id
        # 计算排序：放在最后
        max_order = db.session.query(func.max(Note.order_index)).filter_by(parent_id=pid).scalar()
        new_order = (max_order or 0) + 1
        
        new_note = Note(
            user_id=user.id,
            name=name,
            type=type,
            parent_id=pid,
            content="" if type == "file" else None,
            order_index=new_order
        )
        db.session.add(new_note)
        db.session.commit()
        return True

    def save_note_content(self, note_id, content):
        note = db.session.get(Note, note_id)
        if note and note.user_id == self._get_user().id:
            note.content = content
            db.session.commit()
            return True
        return False

    def rename_note_item(self, note_id, new_name):
        note = db.session.get(Note, note_id)
        if note and note.user_id == self._get_user().id:
            note.name = new_name
            db.session.commit()
            return True
        return False

    def delete_note_item(self, note_id):
        note = db.session.get(Note, note_id)
        if note and note.user_id == self._get_user().id:
            db.session.delete(note)
            db.session.commit()
            return True
        return False

    def move_note_item(self, note_id, new_parent_id):
        user = self._get_user()
        note = db.session.get(Note, note_id)
        
        # 1. 基础检查
        if not note or note.user_id != user.id:
            return False
            
        # 2. 目标路径处理
        pid = None
        if new_parent_id != 'root':
            pid = new_parent_id
            # 检查目标文件夹是否存在
            target_folder = db.session.get(Note, pid)
            if not target_folder or target_folder.user_id != user.id:
                return False
            
            # 3. 死循环检查 (不能把爷爷移到孙子下面)
            if note.type == 'folder':
                cursor = target_folder
                while cursor:
                    if cursor.id == note.id:
                        return False # 目标是自己的子孙
                    cursor = cursor.parent

        # 4. 如果原地移动，直接返回成功
        if note.parent_id == pid:
            return True

        # 5. 执行移动
        # 计算新位置的 order_index (放在队尾)
        max_order = db.session.query(func.max(Note.order_index)).filter_by(parent_id=pid).scalar()
        new_order = (max_order or 0) + 1
        
        note.parent_id = pid
        note.order_index = new_order
        note.updated_at = datetime.now() # 强制更新时间戳
        
        db.session.commit()
        return True

    def reorder_note_children(self, parent_id, new_order_ids):
        for idx, nid in enumerate(new_order_ids):
            note = db.session.get(Note, nid)
            if note and note.user_id == self._get_user().id:
                note.order_index = idx
        db.session.commit()
        return True

    def sort_note_children(self, parent_id, sort_by='name'):
        pid = None if parent_id == 'root' else parent_id
        children = Note.query.filter_by(user_id=self._get_user().id, parent_id=pid).all()
        
        if sort_by == 'name':
            children.sort(key=lambda x: x.name.lower())
        elif sort_by == 'time':
            children.sort(key=lambda x: x.created_at, reverse=True)
            
        for idx, note in enumerate(children):
            note.order_index = idx
        db.session.commit()
        return True

    def search_notes(self, query):
        user = self._get_user()
        if not query: return []
        results = Note.query.filter(
            Note.user_id == user.id,
            Note.type == 'file',
            Note.name.ilike(f"%{query}%")
        ).limit(10).all()
        return [{"id": r.id, "name": r.name, "preview": (r.content or "")[:30]} for r in results]
    
    def get_note_by_id_simple(self, note_id):
        note = db.session.get(Note, note_id)
        if note and note.user_id == self._get_user().id:
            return {"id": note.id, "name": note.name}
        return None

    # ================= 错题本逻辑 (Mistake Notebooks) =================



    # --- [NEW] 题目管理 (移动/复制/标签) ---

    def move_question_to_book(self, q_id, from_book_id, to_book_id):
        """移动题目：从旧本子移除 -> 加入新本子"""
        user = self._get_user()
        if from_book_id == to_book_id: return False
        
        # 1. 获取两个本子
        old_book = db.session.get(Notebook, from_book_id)
        new_book = db.session.get(Notebook, to_book_id)
        question = db.session.get(Question, q_id)
        
        if not (old_book and new_book and question): return False
        if old_book.user_id != user.id or new_book.user_id != user.id: return False
        
        # 2. 执行移动
        if question in old_book.questions:
            old_book.questions.remove(question)
        if question not in new_book.questions:
            new_book.questions.append(question)
            
        db.session.commit()
        return True

    # 2. [NEW] 新增复制逻辑 (保留在源本子，同时加入目标本子)
    def copy_question_to_book(self, q_id, to_book_id):
        user = self._get_user()
        new_book = db.session.get(Notebook, to_book_id)
        question = db.session.get(Question, q_id)
        
        if not (new_book and question): return False
        if new_book.user_id != user.id: return False
        
        if question not in new_book.questions:
            new_book.questions.append(question)
            db.session.commit()
            return True
        return True # 已经在里面了也算成功

    def update_question_tags(self, q_id, new_tags):
        """更新题目标签"""
        # 注意：因为题目是共享的，修改标签会影响所有包含该题目的本子
        # 如果你想只修改当前本子的标签，那逻辑会极其复杂。这里默认修改题目全局标签。
        question = db.session.get(Question, q_id)
        if question:
            question.tags = new_tags
            db.session.commit()
            return True
        return False
    
    def remove_question_from_book(self, book_id, q_id):
        """从本子中移除题目 (不删除题目本身)"""
        user = self._get_user()
        book = db.session.get(Notebook, book_id)
        question = db.session.get(Question, q_id)
        
        if book and question and book.user_id == user.id:
            if question in book.questions:
                book.questions.remove(question)
                db.session.commit()
                return True
        return False

    def get_notebook_view(self, notebook_id="root"):
        user = self._get_user()
        
        # 1. 获取当前节点结构
        if notebook_id == "root":
            current_node = None
            sub_books = Notebook.query.filter_by(user_id=user.id, parent_id=None).order_by(Notebook.order_index).all()
            breadcrumbs = []
            current_level_questions = [] # 根目录不直接显示题
            node_tags = []
        else:
            current_node = db.session.get(Notebook, notebook_id)
            if not current_node or current_node.user_id != user.id: return {"error": "Not found"}
            
            sub_books = current_node.children
            node_tags = current_node.tags
            
            # 获取直属题目 (Direct Children Only)
            current_level_questions = []
            for q in current_node.questions:
                prog = QuestionProgress.query.filter_by(user_id=user.id, question_id=q.id).first()
                prof = prog.proficiency if prog else 0
                
                final_tags = list(set(q.tags + node_tags))
                
                current_level_questions.append({
                    "id": q.id,
                    "summary": q.content[:30].replace('<p>', '').replace('</p>', '') + "...",
                    "tags": final_tags,
                    "proficiency": prof
                })
            
            breadcrumbs = []
            curr = current_node
            while curr:
                breadcrumbs.insert(0, {"id": curr.id, "name": curr.name})
                curr = curr.parent

            breadcrumbs.insert(0, {"id": "root", "name": "My Library"})
        # 2. [Restored] 递归计算统计数据 (Total, Avg Prof, Top Tags)
        # 注意：这里需要计算包含子文件夹在内的所有数据
        if notebook_id == "root":
            # 根目录做个简化统计，或者遍历所有
            stats = {"errors": 0, "proficiency": 0, "total": 0, "top_tags": []} # 根目录暂简略
        else:
            raw_stats = self._get_recursive_stats(notebook_id)
            avg_prof = int(raw_stats['proficiency'] / raw_stats['total']) if raw_stats['total'] > 0 else 0
            
            # 排序 Tags
            sorted_tags = sorted(raw_stats['tags'].items(), key=lambda x: x[1], reverse=True)[:8]
            top_tags = [{"name": k, "count": v} for k,v in sorted_tags]
            
            stats = {
                "errors": raw_stats['errors'],
                "proficiency": raw_stats['proficiency'], # 总熟练度分
                "avg_prof": avg_prof,                    # 平均分
                "total": raw_stats['total'],             # 总题数
                "top_tags": top_tags
            }

        # 3. 格式化子目录
        sub_notebooks_data = []
        for sub in sub_books:
            # 这里显示直属题数还是递归题数？通常显示递归题数更有用
            # 为了性能，这里先显示直属，如果需要递归，可以调用 _get_recursive_stats(sub.id)['total']
            count = len(sub.questions) 
            sub_notebooks_data.append({
                "id": sub.id,
                "name": sub.name,
                "tags": sub.tags,
                "count": count
            })

        info = {"id": "root", "name": "My Library", "tags": []}
        if current_node:
            info = {"id": current_node.id, "name": current_node.name, "tags": current_node.tags}

        return {
            "info": info,
            "stats": stats,
            "sub_notebooks": sub_notebooks_data,
            "questions": current_level_questions,
            "breadcrumbs": breadcrumbs
        }

    def get_notebook_list_simple(self):
        user = self._get_user()
        options = []
        def traverse(parent_id, level=0):
            pid = None if parent_id == 'root' else parent_id
            books = Notebook.query.filter_by(user_id=user.id, parent_id=pid).all()
            for book in books:
                options.append({"id": book.id, "name": ("— " * level) + book.name})
                traverse(book.id, level + 1)
        traverse('root')
        return options

    def add_question_to_target_book(self, book_id, q_id):
        notebook = db.session.get(Notebook, book_id)
        question = db.session.get(Question, q_id)
        if notebook and question and notebook.user_id == self._get_user().id:
            if question not in notebook.questions:
                notebook.questions.append(question)
                db.session.commit()
            return True
        return False

    def create_notebook(self, name, parent_id="root", tags=[]):
        user = self._get_user()
        pid = None if parent_id == "root" else parent_id
        new_book = Notebook(user_id=user.id, name=name, parent_id=pid, tags=tags)
        db.session.add(new_book)
        db.session.commit()
        return True

    def rename_notebook(self, book_id, new_name):
        book = db.session.get(Notebook, book_id)
        if book and book.user_id == self._get_user().id:
            book.name = new_name
            db.session.commit()
            return True
        return False

    def delete_notebook(self, book_id):
        book = db.session.get(Notebook, book_id)
        if book and book.user_id == self._get_user().id:
            db.session.delete(book)
            db.session.commit()
            return True
        return False

    def move_notebook(self, book_id, new_parent_id):
        book = db.session.get(Notebook, book_id)
        pid = None if new_parent_id == 'root' else new_parent_id
        # 检查死循环略
        if book and book.user_id == self._get_user().id:
            book.parent_id = pid
            db.session.commit()
            return True
        return False

    def reorder_notebook_content(self, book_id, sub_order=None, q_order=None):
        if sub_order:
            for idx, nid in enumerate(sub_order):
                book = db.session.get(Notebook, nid)
                if book and book.user_id == self._get_user().id:
                    book.order_index = idx
            db.session.commit()
        return True

    # ================= 做题与分发逻辑 (Quiz) =================

    def get_question(self, mode="training", q_id=None, book_id=None):
        user = self._get_user()
        
        # 1. 定向 ID
        if q_id: 
            q_obj = self.get_question_by_id(q_id)
            if q_obj: return q_obj

        target_q = None

        # 2. 每日特训
        if mode == 'daily':
            now = time.time()
            due_progs = QuestionProgress.query.filter(
                QuestionProgress.user_id == user.id,
                QuestionProgress.next_review_time <= now,
                QuestionProgress.errors > 0
            ).all()
            
            if due_progs:
                prog = random.choice(due_progs)
                target_q = self.get_question_by_id(prog.question_id)
                if target_q: target_q['is_due'] = True
            else:
                low_prog = QuestionProgress.query.filter(
                    QuestionProgress.user_id == user.id,
                    QuestionProgress.proficiency < 80
                ).first()
                if low_prog:
                    target_q = self.get_question_by_id(low_prog.question_id)

        # 3. 错题本模式
        elif mode == 'mistake' and book_id:
            book = db.session.get(Notebook, book_id)
            if book and book.user_id == user.id and book.questions:
                q_orm = random.choice(book.questions)
                target_q = self.get_question_by_id(q_orm.id)
                if target_q: target_q['custom_tags'] = book.tags

        # 4. 普通/考试模式
        else:
            q_orm = Question.query.filter_by(mode=mode).order_by(func.random()).first()
            if q_orm:
                target_q = self.get_question_by_id(q_orm.id)

        # --- [Restored] 智能变式逻辑 ---
        if target_q and mode in ['daily', 'mistake']:
            # 检查做题次数
            prog = QuestionProgress.query.filter_by(user_id=user.id, question_id=target_q['id']).first()
            attempts = prog.attempts if prog else 0
            
            # 如果太熟了 (做过3次以上)，尝试换变式
            if attempts > 3:
                variant = self._find_variant_question(target_q['id'])
                if variant:
                    variant['is_variant_of'] = target_q['content'][:20] + "..."
                    variant['custom_tags'] = target_q.get('custom_tags', [])
                    return variant

        return target_q

    def check_answer(self, q_id, user_choice):
        user = self._get_user()
        question = self.get_question_by_id(q_id)
        if not question: return {"error": "Question not found"}
        
        is_correct = (user_choice == question['correct_id'])
        
        # 1. 记录流水日志
        log = QuestionLog(
            user_id=user.id,
            question_id=q_id,
            is_correct=is_correct,
            user_choice=user_choice,
            duration_ms=0
        )
        db.session.add(log)

        # 2. 更新状态
        prog = QuestionProgress.query.filter_by(user_id=user.id, question_id=q_id).first()
        if not prog:
            # [FIX] 显式初始化所有计数器为 0，防止 += 操作报错
            prog = QuestionProgress(
                user_id=user.id, 
                question_id=q_id,
                attempts=0,
                proficiency=0,
                errors=0,
                stage=0
            )
            db.session.add(prog)
        
        # 现在的 prog.attempts 绝对是 0，不会是 None
        prog.attempts += 1
        now = time.time()
        prog.last_reviewed_at = datetime.now()

        if is_correct:
            prog.proficiency = min(100, prog.proficiency + 15)
            current_stage = prog.stage
            next_stage = min(current_stage + 1, len(self.review_intervals) - 1)
            prog.stage = next_stage
            prog.next_review_time = now + (self.review_intervals[next_stage] * 24 * 3600)
        else:
            prog.errors += 1
            prog.proficiency = max(0, prog.proficiency - 10)
            prog.stage = 0
            prog.next_review_time = now + (12 * 3600)
            
            # 自动加入 Inbox
            self._add_to_inbox(q_id)

        db.session.commit()

        return {
            "is_correct": is_correct,
            "correct_id": question['correct_id'],
            "metrics": {
                "proficiency": prog.proficiency,
                "attempts": prog.attempts
            },
            "explanation": question['analysis'] or '暂无详细解析。'
        }

    def _add_to_inbox(self, q_id):
        user = self._get_user()
        inbox = Notebook.query.filter_by(user_id=user.id, name="Inbox").first()
        if not inbox:
            inbox = Notebook(user_id=user.id, name="Inbox")
            db.session.add(inbox)
            db.session.flush()
        
        question = db.session.get(Question, q_id)
        if question and question not in inbox.questions:
            inbox.questions.append(question)
            db.session.commit()

    def get_dashboard_stats(self):
        user = self._get_user()
        if not user: return {}
        
        total_done = QuestionProgress.query.filter_by(user_id=user.id).count()
        avg_score = db.session.query(func.avg(QuestionProgress.proficiency)).filter_by(user_id=user.id).scalar() or 0
        
        top_books = Notebook.query.filter_by(user_id=user.id, parent_id=None).limit(3).all()
        books_data = [{"id": b.id, "name": b.name, "tags": b.tags} for b in top_books]

        return {
            "streak_days": 1, 
            "mastery_rate": int(avg_score),
            "questions_done": total_done,
            "top_books": books_data
        }

    def find_notes_by_question(self, q_id):
        user = self._get_user()
        related = []
        ref_tag = f"[[{q_id}]]"
        
        notes = Note.query.filter(
            Note.user_id == user.id,
            Note.type == 'file',
            Note.content.contains(ref_tag)
        ).all()
        
        for n in notes:
            related.append({
                "id": n.id,
                "name": n.name,
                "preview": (n.content or "")[:60] + "..."
            })
        return related

service = QuestionService()