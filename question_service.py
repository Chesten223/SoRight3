import json
import random
import os
import uuid
import time

class QuestionService:
    def __init__(self):
        self.files = {
            "exam": "data/exam_questions.json",
            "training": "data/training_questions.json"
        }
        self.user_data_path = "user_data.json"
        self.questions = []
        
        # 遗忘曲线复习间隔 (单位: 天)
        # Stage 0: 立即, 1: 1天, 2: 3天, 3: 7天, 4: 15天, 5: 30天
        self.review_intervals = [0, 1, 3, 7, 15, 30]

        # 初始化加载
        self.reload_data()
        self.user_data = self._load_user_data()

    def reload_data(self):
        self.questions = []
        for mode, filepath in self.files.items():
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for q in data:
                        q['mode'] = mode
                    self.questions.extend(data)

    def get_question_by_id(self, q_id):
        return next((q for q in self.questions if q['id'] == q_id), None)

    # --- 数据结构管理 ---
    def _load_user_data(self):
        # 默认数据结构：包含 notebooks (错题本树) 和 notes (笔记树)
        default_data = {
            "notebooks": {
                "root": {"id": "root", "name": "My Library", "parent": None, "children": [], "questions": [], "tags": []}
            },
            "notes": {
                "root": {"id": "root", "name": "My Notes", "parent": None, "children": [], "type": "folder"}
            },
            "metrics": {}, # q_id -> {errors, proficiency, attempts, stage, next_review}
            "streak": 1
        }
        
        if os.path.exists(self.user_data_path):
            try:
                with open(self.user_data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # 1. 兼容性迁移：旧版 mistake_books -> 新版 notebooks
                    if "mistake_books" in data:
                        for name, q_ids in data["mistake_books"].items():
                            new_id = str(uuid.uuid4())
                            default_data["notebooks"][new_id] = {
                                "id": new_id, "name": name, "parent": "root", 
                                "children": [], "questions": q_ids, "tags": []
                            }
                            default_data["notebooks"]["root"]["children"].append(new_id)
                        data["notebooks"] = default_data["notebooks"]
                        del data["mistake_books"]
                    
                    # 2. 兼容性合并：确保 notes 存在
                    if "notes" not in data:
                        data["notes"] = default_data["notes"]
                        
                    return data
            except:
                pass
        return default_data

    def _save_user_data(self):
        with open(self.user_data_path, 'w', encoding='utf-8') as f:
            json.dump(self.user_data, f, indent=2, ensure_ascii=False)

    # --- [NEW] 笔记系统逻辑 (智能上下文版) ---
    def get_note_view(self, node_id="root"):
        """
        获取视图数据。
        - 如果是文件夹：返回该文件夹下的子项。
        - 如果是文件：返回该文件内容，同时返回**同级兄弟文件**列表（用于侧边栏显示）。
        """
        node = self.user_data['notes'].get(node_id)
        if not node: return {"error": "Not found"}
        
        # 1. 确定列表的数据源 (List Source)
        # 如果当前是文件夹，列表就是它的孩子
        # 如果当前是文件，列表就是它的兄弟 (它父节点的孩子)
        list_source_id = node_id if node.get('type') == 'folder' else node.get('parent')
        
        # 如果是根节点的文件（极少情况），父节点为空，做容错
        if not list_source_id and node.get('type') == 'file':
            list_source_id = 'root' # 此时无法获取兄弟，或者 fallback 到 root

        list_source_node = self.user_data['notes'].get(list_source_id)
        
        # 2. 构建列表 (Items)
        items = []
        if list_source_node:
            for cid in list_source_node.get('children', []):
                child = self.user_data['notes'].get(cid)
                if child:
                    items.append({
                        "id": child['id'],
                        "name": child['name'],
                        "type": child.get('type', 'file'),
                        "preview": child.get('content', '')[:50] if child.get('type') == 'file' else ""
                    })
        
        # 3. 构建面包屑 (Breadcrumbs)
        breadcrumbs = []
        curr = list_source_node # 面包屑一直显示到文件夹层级
        while curr:
            breadcrumbs.insert(0, {"id": curr['id'], "name": curr['name']})
            curr = self.user_data['notes'].get(curr.get('parent'))
            
        # 4. 获取文件内容 (Content)
        content = node.get('content', '') if node.get('type') == 'file' else None
        
        return {
            "info": {"id": node['id'], "name": node['name'], "type": node.get('type', 'folder')},
            "items": items,
            "breadcrumbs": breadcrumbs,
            "content": content
        }

    def create_note_item(self, name, type="folder", parent_id="root"):
        if parent_id not in self.user_data['notes']: return False
        
        new_id = str(uuid.uuid4())
        new_node = {
            "id": new_id,
            "name": name,
            "parent": parent_id,
            "type": type,
            "children": [] if type == "folder" else None,
            "content": "" if type == "file" else None,
            "created_at": time.time()
        }
        
        self.user_data['notes'][new_id] = new_node
        self.user_data['notes'][parent_id]['children'].append(new_id)
        self._save_user_data()
        return True

    def save_note_content(self, note_id, content):
        if note_id not in self.user_data['notes']: return False
        self.user_data['notes'][note_id]['content'] = content
        self._save_user_data()
        return True

    # --- [NEW] 笔记管理功能 (重命名/删除/移动) ---
    def rename_note_item(self, node_id, new_name):
        if node_id not in self.user_data['notes']: return False
        self.user_data['notes'][node_id]['name'] = new_name
        self._save_user_data()
        return True

    def delete_note_item(self, node_id):
        """删除节点及其所有子节点"""
        if node_id not in self.user_data['notes'] or node_id == 'root': return False
        
        parent_id = self.user_data['notes'][node_id]['parent']
        
        # 1. 从父节点的 children 中移除
        if parent_id and parent_id in self.user_data['notes']:
            if node_id in self.user_data['notes'][parent_id]['children']:
                self.user_data['notes'][parent_id]['children'].remove(node_id)
        
        # 2. 递归收集所有需要删除的 ID
        to_delete = []
        def collect_ids(nid):
            to_delete.append(nid)
            node = self.user_data['notes'].get(nid)
            if node and node.get('children'):
                for child in node['children']:
                    collect_ids(child)
        collect_ids(node_id)
        
        # 3. 执行删除
        for nid in to_delete:
            if nid in self.user_data['notes']:
                del self.user_data['notes'][nid]
                
        self._save_user_data()
        return True

    def move_note_item(self, node_id, new_parent_id):
        """移动节点到新父节点"""
        if node_id == 'root': return False
        if node_id not in self.user_data['notes']: return False
        if new_parent_id not in self.user_data['notes']: return False
        
        # 防止移动到自己或自己的子节点中 (简单防环)
        if node_id == new_parent_id: return False
        
        # 检查 new_parent_id 是否在 node_id 的子树里
        curr = self.user_data['notes'][new_parent_id]
        while curr.get('parent'):
            if curr['parent'] == node_id: return False # 目标父节点是当前节点的子孙，禁止移动
            curr = self.user_data['notes'].get(curr['parent'])
            
        node = self.user_data['notes'][node_id]
        old_parent_id = node['parent']
        
        # 1. 从旧父节点移除
        if old_parent_id in self.user_data['notes']:
            if node_id in self.user_data['notes'][old_parent_id]['children']:
                self.user_data['notes'][old_parent_id]['children'].remove(node_id)
                
        # 2. 加入新父节点
        self.user_data['notes'][new_parent_id]['children'].append(node_id)
        
        # 3. 更新 parent 属性
        node['parent'] = new_parent_id
        
        self._save_user_data()
        return True

    # --- [模块 2] 错题本逻辑 (Notebook System) ---
    
    def _get_all_questions_recursive(self, notebook_id, accumulated_tags=None):
        """递归获取某笔记本下（含子本子）的所有题目，并处理 Tag 继承"""
        node = self.user_data['notebooks'].get(notebook_id)
        if not node: return [], []
        
        current_tags = (accumulated_tags or []) + node.get('tags', [])
        
        # 当前层题目
        all_q_ids = [{"id": qid, "tags": current_tags} for qid in node['questions']]
        
        # 递归子层
        for child_id in node['children']:
            child_qs, _ = self._get_all_questions_recursive(child_id, current_tags)
            all_q_ids.extend(child_qs)
            
        return all_q_ids, node.get('children', [])

    def get_note_view(self, node_id="root"):
        """
        获取视图数据。
        - 如果是文件夹：返回该文件夹下的子项。
        - 如果是文件：返回该文件内容，同时返回**同级兄弟文件**列表（用于侧边栏显示）。
        """
        node = self.user_data['notes'].get(node_id)
        if not node: return {"error": "Not found"}
        
        # 1. 确定列表的数据源 (List Source)
        list_source_id = node_id if node.get('type') == 'folder' else node.get('parent')
        
        # 如果是根节点的文件（极少情况），父节点为空，做容错
        if not list_source_id and node.get('type') == 'file':
            list_source_id = 'root'

        list_source_node = self.user_data['notes'].get(list_source_id)
        
        # 2. 构建列表 (Items) - 必须按照 children 的顺序返回，以保持排序
        items = []
        if list_source_node:
            child_ids = list_source_node.get('children', [])
            # 过滤掉不存在的 ID (数据清洗)
            valid_children = []
            for cid in child_ids:
                child = self.user_data['notes'].get(cid)
                if child:
                    items.append({
                        "id": child['id'],
                        "name": child['name'],
                        "type": child.get('type', 'file'),
                        "preview": child.get('content', '')[:50] if child.get('type') == 'file' else "",
                        "created_at": child.get('created_at', 0) # [NEW] 用于排序
                    })
                    valid_children.append(cid)
            
            # 如果发现有坏死链接，静默修复
            if len(valid_children) != len(child_ids):
                list_source_node['children'] = valid_children
                self._save_user_data()
        
        # 3. 构建面包屑 (Breadcrumbs)
        breadcrumbs = []
        curr = list_source_node
        while curr:
            breadcrumbs.insert(0, {"id": curr['id'], "name": curr['name']})
            curr = self.user_data['notes'].get(curr.get('parent'))
            
        # 4. 获取文件内容 (Content)
        content = node.get('content', '') if node.get('type') == 'file' else None
        
        return {
            "info": {"id": node['id'], "name": node['name'], "type": node.get('type', 'folder')},
            "items": items,
            "breadcrumbs": breadcrumbs,
            "content": content
        }

    # [NEW] 保存子节点顺序
    def reorder_note_children(self, parent_id, child_ids):
        if parent_id not in self.user_data['notes']: return False
        
        # 验证提交的 ID 是否都是该节点的子节点（安全检查）
        current_children = set(self.user_data['notes'][parent_id]['children'])
        new_children_set = set(child_ids)
        
        if current_children != new_children_set:
            return False # ID 集合不匹配，拒绝修改
            
        self.user_data['notes'][parent_id]['children'] = child_ids
        self._save_user_data()
        return True

    def get_notebook_list_simple(self):
        """获取简单的笔记本列表（用于下拉菜单）"""
        options = []
        def traverse(node_id, level=0):
            node = self.user_data['notebooks'].get(node_id)
            if not node: return
            if node_id != 'root': # 根目录通常不可直接添加题目
                options.append({"id": node['id'], "name": ("— " * level) + node['name']})
            for child in node['children']:
                traverse(child, level + (0 if node_id=='root' else 1))
        traverse('root')
        return options

    def add_question_to_target_book(self, book_id, q_id):
        """手动添加题目到指定笔记本"""
        if book_id not in self.user_data['notebooks']: return False
        if q_id not in self.user_data['notebooks'][book_id]['questions']:
             self.user_data['notebooks'][book_id]['questions'].append(q_id)
             self._save_user_data()
        return True

    def create_notebook(self, name, parent_id="root", tags=[]):
        """新建笔记本/文件夹"""
        if parent_id not in self.user_data['notebooks']: return False
        
        new_id = str(uuid.uuid4())
        new_book = {
            "id": new_id,
            "name": name,
            "parent": parent_id,
            "children": [],
            "questions": [],
            "tags": tags if isinstance(tags, list) else []
        }
        
        self.user_data['notebooks'][new_id] = new_book
        self.user_data['notebooks'][parent_id]['children'].append(new_id)
        self._save_user_data()
        return True
    
    # --- [模块 3] 题目分发与变式逻辑 ---

    def _find_variant_question(self, original_q_id):
        """查找变式题：Tag 相同但 ID 不同的题目"""
        original_q = self.get_question_by_id(original_q_id)
        if not original_q or 'tags' not in original_q or not original_q['tags']:
            return None
        
        original_tags = set(original_q['tags'])
        candidates = []
        
        for q in self.questions:
            if q['id'] == original_q_id: continue
            q_tags = set(q.get('tags', []))
            if len(original_tags & q_tags) > 0:
                candidates.append(q)
        
        if candidates:
            # 优先选做得少的
            candidates.sort(key=lambda x: self.user_data['metrics'].get(x['id'], {}).get('attempts', 0))
            return candidates[0]
            
        return None

    def get_question(self, mode="training", q_id=None, book_id=None):
        """获取题目的总入口"""
        # 1. 定向 ID
        if q_id: return self.get_question_by_id(q_id)
        
        target_q = None

        # 2. 每日特训模式 (基于遗忘曲线)
        if mode == 'daily':
            now = time.time()
            due_questions = []
            
            for qid, m in self.user_data['metrics'].items():
                # 必须是错过的题，且复习时间已到
                if m.get('errors', 0) > 0:
                    if m.get('next_review', 0) <= now:
                        due_questions.append(qid)
            
            if due_questions:
                target_id = random.choice(due_questions)
                target_q = self.get_question_by_id(target_id)
                if target_q: target_q['is_due'] = True
            else:
                # 如果没有到期的，找熟练度低的
                low_prof = [qid for qid, m in self.user_data['metrics'].items() if m.get('proficiency', 0) < 80]
                if low_prof:
                    target_q = self.get_question_by_id(random.choice(low_prof))

        # 3. 错题本模式
        elif mode == 'mistake' and book_id:
            items, _ = self._get_all_questions_recursive(book_id)
            if items:
                target_item = random.choice(items)
                target_q = self.get_question_by_id(target_item['id'])
                if target_q: target_q['custom_tags'] = target_item['tags']

        # 4. 普通/考试模式
        else:
            filtered = [q for q in self.questions if q.get('mode') == mode]
            if filtered: target_q = random.choice(filtered)

        # --- 变式置换逻辑 ---
        if target_q:
            metrics = self.user_data['metrics'].get(target_q['id'], {})
            # 如果做过超过3次，且是在复习模式下 -> 尝试换变式
            if metrics.get('attempts', 0) > 3 and mode in ['daily', 'mistake']:
                variant = self._find_variant_question(target_q['id'])
                if variant:
                    variant['is_variant_of'] = target_q['content'][:20] + "..."
                    variant['custom_tags'] = target_q.get('custom_tags', [])
                    return variant

        return target_q

    def check_answer(self, q_id, user_choice):
        """判题逻辑 & 遗忘曲线更新"""
        question = self.get_question_by_id(q_id)
        if not question: return {"error": "Question not found"}
        
        is_correct = (user_choice == question['correct_id'])
        
        if q_id not in self.user_data['metrics']:
            self.user_data['metrics'][q_id] = {"errors": 0, "proficiency": 0, "attempts": 0, "stage": 0, "next_review": 0}
        
        m = self.user_data['metrics'][q_id]
        m['attempts'] += 1
        now = time.time()
        
        if is_correct:
            m['proficiency'] = min(100, m['proficiency'] + 15)
            # SRS: Stage + 1, 间隔延长
            current_stage = m.get('stage', 0)
            next_stage = min(current_stage + 1, len(self.review_intervals) - 1)
            m['stage'] = next_stage
            m['next_review'] = now + (self.review_intervals[next_stage] * 24 * 3600)
        else:
            m['errors'] += 1
            m['proficiency'] = max(0, m['proficiency'] - 10)
            # SRS: Stage 重置
            m['stage'] = 0 
            m['next_review'] = now + (12 * 3600) # 12小时后重来
            self._add_to_inbox(q_id)

        self._save_user_data()

        return {
            "is_correct": is_correct,
            "correct_id": question['correct_id'],
            "metrics": m,
            "explanation": question.get('ai_context', {}).get('explanation', '暂无详细解析。'),
            "diagnosis": question.get('diagnosis')
        }

    def _add_to_inbox(self, q_id):
        """将错题自动加入默认 Inbox 笔记本"""
        inbox_id = next((k for k,v in self.user_data['notebooks'].items() if v['name'] in ['Default', 'Inbox']), None)
        
        if not inbox_id:
            inbox_id = str(uuid.uuid4())
            self.user_data['notebooks'][inbox_id] = {
                "id": inbox_id, "name": "Inbox", "parent": "root", "children": [], "questions": [q_id], "tags": []
            }
            self.user_data['notebooks']["root"]['children'].append(inbox_id)
        else:
            if q_id not in self.user_data['notebooks'][inbox_id]['questions']:
                self.user_data['notebooks'][inbox_id]['questions'].append(q_id)

    def get_dashboard_stats(self):
        total_done = len(self.user_data['metrics'])
        avg_prof = 0
        if total_done > 0:
            total_score = sum(m['proficiency'] for m in self.user_data['metrics'].values())
            avg_prof = int(total_score / total_done)

        # 仅获取 Root 下的一级笔记本作为展示
        root_children = []
        root_node = self.user_data['notebooks'].get("root")
        if root_node:
            for cid in root_node['children']:
                child = self.user_data['notebooks'].get(cid)
                if child: root_children.append(child)

        return {
            "streak_days": self.user_data.get('streak', 1),
            "mastery_rate": avg_prof,
            "questions_done": total_done,
            "top_books": root_children
        }

service = QuestionService()