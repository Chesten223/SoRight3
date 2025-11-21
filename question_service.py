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
        [修改版] 获取视图数据
        新增：backlinks 字段 (谁引用了当前笔记)
        """
        node = self.user_data['notes'].get(node_id)
        if not node: return {"error": "Not found"}
        
        # ... (原有的 breadcrumbs 和 items 构建逻辑保持不变，为了节省篇幅省略，请保留原代码) ...
        # ... 这里请保留你原来的 list_source_id, items, breadcrumbs, content 逻辑 ...
        
        # ---------------------------------------------------------
        # 复制你原来的逻辑 (为了上下文完整，我这里简写，请确保不要删掉原来的逻辑)
        list_source_id = node_id if node.get('type') == 'folder' else node.get('parent')
        if not list_source_id and node.get('type') == 'file': list_source_id = 'root'
        list_source_node = self.user_data['notes'].get(list_source_id)
        
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
        
        breadcrumbs = []
        curr = list_source_node
        while curr:
            breadcrumbs.insert(0, {"id": curr['id'], "name": curr['name']})
            curr = self.user_data['notes'].get(curr.get('parent'))
            
        content = node.get('content', '') if node.get('type') == 'file' else None
        # ---------------------------------------------------------

        # [新增] 计算反向链接 (Backlinks)
        backlinks = []
        if node.get('type') == 'file':
            target_link = f"[[note:{node_id}]]" # 搜索目标
            for other_id, other_node in self.user_data['notes'].items():
                if other_node.get('type') == 'file' and other_id != node_id:
                    # 简单的字符串包含检查
                    if target_link in (other_node.get('content') or ""):
                        backlinks.append({
                            "id": other_id,
                            "name": other_node['name'],
                            "preview": (other_node.get('content') or "")[:60] + "..."
                        })

        return {
            "info": {"id": node['id'], "name": node['name'], "type": node.get('type', 'folder')},
            "items": items,
            "breadcrumbs": breadcrumbs,
            "content": content,
            "backlinks": backlinks # 新增字段
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

    def rename_note_item(self, note_id, new_name):
        if note_id not in self.user_data['notes']: return False
        self.user_data['notes'][note_id]['name'] = new_name
        self._save_user_data()
        return True

    def delete_note_item(self, note_id):
        """删除笔记或文件夹（及其子项）"""
        if note_id not in self.user_data['notes'] or note_id == 'root': return False
        
        target = self.user_data['notes'][note_id]
        parent_id = target['parent']
        
        # 1. 从父节点的 children 中移除
        if parent_id and parent_id in self.user_data['notes']:
            if note_id in self.user_data['notes'][parent_id]['children']:
                self.user_data['notes'][parent_id]['children'].remove(note_id)

        # 2. 递归删除自身及子项 (简单实现：只删引用，残留数据暂不清理，或递归清理)
        # 为了数据整洁，建议递归清理：
        def recursive_delete(nid):
            if nid not in self.user_data['notes']: return
            node = self.user_data['notes'][nid]
            if node.get('children'):
                for child_id in list(node['children']):
                    recursive_delete(child_id)
            del self.user_data['notes'][nid]

        recursive_delete(note_id)
        self._save_user_data()
        return True

    def move_note_item(self, note_id, new_parent_id):
        """移动笔记/文件夹"""
        if note_id not in self.user_data['notes'] or new_parent_id not in self.user_data['notes']: return False
        if note_id == 'root': return False
        
        target = self.user_data['notes'][note_id]
        old_parent_id = target['parent']
        
        # 检查循环引用（不能移动到自己的子孙节点下）
        def is_descendant(parent, child):
            if parent == child: return True
            node = self.user_data['notes'][parent]
            if not node.get('children'): return False
            for c in node['children']:
                if is_descendant(c, child): return True
            return False

        if is_descendant(note_id, new_parent_id): return False # 目标是自己的子孙，禁止

        # 1. 从旧父节点移除
        if old_parent_id in self.user_data['notes']:
            if note_id in self.user_data['notes'][old_parent_id]['children']:
                self.user_data['notes'][old_parent_id]['children'].remove(note_id)
        
        # 2. 加入新父节点
        self.user_data['notes'][new_parent_id]['children'].append(note_id)
        target['parent'] = new_parent_id
        
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

    def get_notebook_view(self, notebook_id="root"):
        """
        [修正版] 获取错题本视图
        - 统计数据 (Stats): 递归计算 (包含所有子文件夹数据)
        - 列表数据 (Questions): 仅返回当前层级的直属题目 (解决显示杂乱问题)
        """
        node = self.user_data['notebooks'].get(notebook_id)
        if not node: return {"error": "Not found"}
        
        # 1. 递归计算统计数据 (Stats) - 保持不变，为了看总数
        all_recursive_items, _ = self._get_all_questions_recursive(notebook_id)
        
        stats = {"errors": 0, "proficiency": 0, "tags": {}}
        
        # 计算递归统计
        for item in all_recursive_items:
            metrics = self.user_data['metrics'].get(item['id'], {"errors": 0, "proficiency": 0})
            stats['errors'] += metrics['errors']
            stats['proficiency'] += metrics['proficiency']
            for t in item['tags']:
                stats['tags'][t] = stats['tags'].get(t, 0) + 1
            
        # 2. [关键修改] 仅获取当前直属题目 (Direct Children Only)
        # 之前的代码这里用了 raw_items (递归数据)，导致题目重复显示
        current_level_questions = []
        
        # node['questions'] 存储的是当前笔记本直属的题目ID列表
        for q_id in node['questions']:
            q = self.get_question_by_id(q_id)
            if not q: continue
            
            metrics = self.user_data['metrics'].get(q_id, {"errors": 0, "proficiency": 0})
            
            # 合并 Tag: 题目原生 Tag + 笔记本继承 Tag
            # 注意：这里只取当前笔记本的 tags，不再递归累加父级 tags，保持界面清爽
            final_tags = list(set(q.get('tags', []) + node.get('tags', [])))
            
            current_level_questions.append({
                "id": q['id'],
                "summary": q['content'][:30].replace('<p>', '').replace('</p>', '') + "...", # 稍微加长预览
                "tags": final_tags, 
                "proficiency": metrics['proficiency']
            })

        # 3. 获取子笔记本列表
        sub_notebooks = []
        for child_id in node['children']:
            child = self.user_data['notebooks'].get(child_id)
            if child:
                # 这里 count 我们显示它下面的直属题目数，或者递归数都可以，这里显示直属
                sub_notebooks.append({
                    "id": child['id'],
                    "name": child['name'],
                    "tags": child['tags'],
                    "count": len(child['questions']) 
                })

        # 4. 构建面包屑
        breadcrumbs = []
        curr = node
        while curr:
            breadcrumbs.insert(0, {"id": curr['id'], "name": curr['name']})
            curr = self.user_data['notebooks'].get(curr.get('parent')) # 使用 get 防止报错

        # 计算平均熟练度
        total_count = len(all_recursive_items) # 统计用总数
        avg_prof = int(stats['proficiency'] / total_count) if total_count > 0 else 0
        sorted_tags = sorted(stats['tags'].items(), key=lambda x: x[1], reverse=True)[:8]

        return {
            "info": {"id": node['id'], "name": node['name'], "tags": node['tags']},
            "stats": {
                "total": total_count, # 这里的 Total 显示的是整个分支的总题数
                "avg_prof": avg_prof,
                "errors": stats['errors'],
                "top_tags": [{"name": k, "count": v} for k,v in sorted_tags]
            },
            "sub_notebooks": sub_notebooks,
            "questions": current_level_questions, # 这里的 questions 只包含当前层级
            "breadcrumbs": breadcrumbs
        }

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

    def reorder_note_children(self, parent_id, new_order_ids):
        """更新子节点顺序"""
        if parent_id not in self.user_data['notes']: return False
        # 确保 new_order_ids 里的 ID 确实都在原来的 children 里 (安全检查)
        current_children = set(self.user_data['notes'][parent_id]['children'])
        safe_new_order = [nid for nid in new_order_ids if nid in current_children]
        
        # 如果有遗漏（比如新建的没传过来），补在后面
        for nid in self.user_data['notes'][parent_id]['children']:
            if nid not in safe_new_order:
                safe_new_order.append(nid)
                
        self.user_data['notes'][parent_id]['children'] = safe_new_order
        self._save_user_data()
        return True
    # --- [新增] 笔记搜索与反链逻辑 ---
    
    def search_notes(self, query):
        """搜索笔记（用于插入链接）"""
        results = []
        query = query.lower().strip()
        for nid, node in self.user_data['notes'].items():
            if node.get('type') == 'file' and nid != 'root':
                if query in node['name'].lower():
                    results.append({"id": nid, "name": node['name'], "preview": node.get('content', '')[:30]})
        return results[:10] # 只返回前10个

    def sort_note_children(self, parent_id, sort_by='name'):
        """按规则排序: name 或 time"""
        if parent_id not in self.user_data['notes']: return False
        children_ids = self.user_data['notes'][parent_id]['children']
        
        def get_sort_key(nid):
            node = self.user_data['notes'].get(nid)
            if not node: return ""
            if sort_by == 'time': return node.get('created_at', 0)
            return node.get('name', '').lower()

        # 文件夹排前面逻辑（可选，这里统一排）
        children_ids.sort(key=get_sort_key, reverse=(sort_by=='time')) # 时间倒序，名称正序
        
        self.user_data['notes'][parent_id]['children'] = children_ids
        self._save_user_data()
        return True


    # --- [NEW] 错题本管理 (重命名/删除/移动/排序) ---
    
    def rename_notebook(self, book_id, new_name):
        if book_id not in self.user_data['notebooks']: return False
        self.user_data['notebooks'][book_id]['name'] = new_name
        self._save_user_data()
        return True

    def delete_notebook(self, book_id):
        """删除错题本（及其子本），里面的题目引用也会消失"""
        if book_id not in self.user_data['notebooks'] or book_id == 'root': return False
        
        target = self.user_data['notebooks'][book_id]
        parent_id = target['parent']
        
        # 1. 从父节点移除
        if parent_id and parent_id in self.user_data['notebooks']:
            if book_id in self.user_data['notebooks'][parent_id]['children']:
                self.user_data['notebooks'][parent_id]['children'].remove(book_id)
        
        # 2. 递归删除数据
        def recursive_del(bid):
            if bid not in self.user_data['notebooks']: return
            node = self.user_data['notebooks'][bid]
            for child in list(node['children']):
                recursive_del(child)
            del self.user_data['notebooks'][bid]
            
        recursive_del(book_id)
        self._save_user_data()
        return True

    def move_notebook(self, book_id, new_parent_id):
        if book_id not in self.user_data['notebooks'] or new_parent_id not in self.user_data['notebooks']: return False
        if book_id == 'root': return False
        
        # 检查死循环（不能移到自己子孙里）
        def is_descendant(parent, child):
            if parent == child: return True
            node = self.user_data['notebooks'][parent]
            for c in node['children']:
                if is_descendant(c, child): return True
            return False
            
        if is_descendant(book_id, new_parent_id): return False

        # 1. 从旧父节点移除
        target = self.user_data['notebooks'][book_id]
        old_parent = target['parent']
        if old_parent in self.user_data['notebooks']:
            if book_id in self.user_data['notebooks'][old_parent]['children']:
                self.user_data['notebooks'][old_parent]['children'].remove(book_id)
        
        # 2. 加入新父节点
        self.user_data['notebooks'][new_parent_id]['children'].append(book_id)
        target['parent'] = new_parent_id
        self._save_user_data()
        return True

    def reorder_notebook_content(self, book_id, sub_order=None, q_order=None):
        """排序：分别处理子文件夹顺序和题目顺序"""
        if book_id not in self.user_data['notebooks']: return False
        node = self.user_data['notebooks'][book_id]
        
        if sub_order is not None:
            # 简单的交集校验，防止数据丢失
            valid_ids = [i for i in sub_order if i in node['children']]
            for i in node['children']: # 把没传过来的补后面
                if i not in valid_ids: valid_ids.append(i)
            node['children'] = valid_ids
            
        if q_order is not None:
            valid_qs = [q for q in q_order if q in node['questions']]
            for q in node['questions']: 
                if q not in valid_qs: valid_qs.append(q)
            node['questions'] = valid_qs
            
        self._save_user_data()
        return True

    # --- [NEW] 关联查询：找引用了某题目的笔记 ---
    def find_notes_by_question(self, q_id):
        related = []
        ref_tag = f"[[{q_id}]]" # 笔记里引用题目的格式
        
        for nid, node in self.user_data['notes'].items():
            if node.get('type') == 'file':
                content = node.get('content', '')
                if ref_tag in content:
                    related.append({
                        "id": nid,
                        "name": node['name'],
                        "preview": content[:60] + "..."
                    })
        return related
service = QuestionService()