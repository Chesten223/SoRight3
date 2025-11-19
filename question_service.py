import json
import random
import os
import uuid
import time  # [NEW] 引入时间模块处理遗忘曲线

class QuestionService:
    def __init__(self):
        self.files = {
            "exam": "data/exam_questions.json",
            "training": "data/training_questions.json"
        }
        self.user_data_path = "user_data.json"
        self.questions = []
        
        # 遗忘曲线间隔 (单位: 天) - 简单的 Leitner System 变体
        # Stage 0: 立即, 1: 1天, 2: 3天, 3: 7天, 4: 15天, 5: 30天
        self.review_intervals = [0, 1, 3, 7, 15, 30]

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

    def _load_user_data(self):
        default_data = {
            "notebooks": {
                "root": {"id": "root", "name": "My Library", "parent": None, "children": [], "questions": [], "tags": []}
            },
            "metrics": {}, # q_id -> {errors, proficiency, attempts, stage, next_review}
            "streak": 1
        }
        
        if os.path.exists(self.user_data_path):
            try:
                with open(self.user_data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # 简单迁移：如果没有 metrics，初始化一下
                    if "metrics" not in data: data["metrics"] = {}
                    return data
            except:
                pass
        return default_data

    def _save_user_data(self):
        with open(self.user_data_path, 'w', encoding='utf-8') as f:
            json.dump(self.user_data, f, indent=2, ensure_ascii=False)

    # --- 核心功能：寻找变式题 (Variant Finder) ---
    def _find_variant_question(self, original_q_id):
        """
        如果某题做太多次(>3次)，防止背答案，尝试找同Tag的其他题。
        """
        original_q = self.get_question_by_id(original_q_id)
        if not original_q or 'tags' not in original_q or not original_q['tags']:
            return None
        
        original_tags = set(original_q['tags'])
        
        # 寻找至少包含一个相同标签，且ID不同的题目
        candidates = []
        for q in self.questions:
            if q['id'] == original_q_id: continue
            
            q_tags = set(q.get('tags', []))
            # 计算标签重合度
            overlap = len(original_tags & q_tags)
            
            if overlap > 0:
                candidates.append(q)
        
        if candidates:
            # 优先选择还没怎么做过的题
            candidates.sort(key=lambda x: self.user_data['metrics'].get(x['id'], {}).get('attempts', 0))
            return candidates[0] # 返回尝试次数最少的那个变式
            
        return None

    # --- 获取题目逻辑 (含每日特训 + 变式置换) ---
    def get_question(self, mode="training", q_id=None, book_id=None):
        # 1. 指定ID直接返回
        if q_id: return self.get_question_by_id(q_id)
        
        target_q = None

        # 2. [NEW] 每日特训 (Daily Review) - 基于遗忘曲线
        if mode == 'daily':
            now = time.time()
            due_questions = []
            
            for qid, m in self.user_data['metrics'].items():
                # 如果 next_review 存在且小于当前时间，或者根本没有 next_review (新错题)
                # 且有过错误记录 (errors > 0)
                if m.get('errors', 0) > 0:
                    next_review = m.get('next_review', 0)
                    if next_review <= now:
                        due_questions.append(qid)
            
            if due_questions:
                target_id = random.choice(due_questions)
                target_q = self.get_question_by_id(target_id)
                if target_q: target_q['is_due'] = True # 标记为“到期复习”
            else:
                # 如果今天没有到期的，就随机抽一个熟练度低的复习
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

        # 4. 普通训练模式
        else:
            filtered = [q for q in self.questions if q.get('mode') == mode]
            if filtered: target_q = random.choice(filtered)

        # --- [Core] 变式置换逻辑 ---
        if target_q:
            metrics = self.user_data['metrics'].get(target_q['id'], {})
            attempts = metrics.get('attempts', 0)
            
            # 如果这道题做了超过3次，且是为了复习（Daily或Mistake模式）
            # 尝试寻找变式题
            if attempts > 3 and mode in ['daily', 'mistake']:
                variant = self._find_variant_question(target_q['id'])
                if variant:
                    # 只要找到了变式，就用变式。
                    # 并在前端提示用户：“这是 [原题] 的相似变式”
                    variant['is_variant_of'] = target_q['content'][:20] + "..." # 简略提示
                    variant['custom_tags'] = target_q.get('custom_tags', []) # 继承Tag
                    return variant

        return target_q

    # --- 判题与遗忘曲线更新 ---
    def check_answer(self, q_id, user_choice):
        question = self.get_question_by_id(q_id)
        if not question: return {"error": "Question not found"}
        
        is_correct = (user_choice == question['correct_id'])
        
        if q_id not in self.user_data['metrics']:
            # 初始化：Stage 0
            self.user_data['metrics'][q_id] = {"errors": 0, "proficiency": 0, "attempts": 0, "stage": 0, "next_review": 0}
        
        m = self.user_data['metrics'][q_id]
        m['attempts'] += 1
        
        now = time.time()
        
        if is_correct:
            m['proficiency'] = min(100, m['proficiency'] + 15)
            
            # [SRS] 遗忘曲线逻辑：做对了，Stage + 1，间隔延长
            current_stage = m.get('stage', 0)
            next_stage = min(current_stage + 1, len(self.review_intervals) - 1)
            days_delta = self.review_intervals[next_stage]
            
            m['stage'] = next_stage
            m['next_review'] = now + (days_delta * 24 * 3600) # 计算下一次复习的时间戳
            
        else:
            m['errors'] += 1
            m['proficiency'] = max(0, m['proficiency'] - 10)
            
            # [SRS] 遗忘曲线逻辑：做错了，打回原形 (Stage 0 or 1)
            # 立即复习 (或明天)
            m['stage'] = 0 
            m['next_review'] = now + (12 * 3600) # 12小时后再次复习
            
            self._add_to_inbox(q_id)

        self._save_user_data()

        return {
            "is_correct": is_correct,
            "correct_id": question['correct_id'],
            "metrics": m,
            "explanation": question.get('ai_context', {}).get('explanation', '暂无详细解析。'),
            "diagnosis": question.get('diagnosis')
        }

    # --- 辅助功能 (保持不变) ---
    def _get_all_questions_recursive(self, notebook_id, accumulated_tags=None):
        node = self.user_data['notebooks'].get(notebook_id)
        if not node: return [], []
        current_tags = (accumulated_tags or []) + node.get('tags', [])
        all_q_ids = [{"id": qid, "tags": current_tags} for qid in node['questions']]
        for child_id in node['children']:
            child_qs, _ = self._get_all_questions_recursive(child_id, current_tags)
            all_q_ids.extend(child_qs)
        return all_q_ids, node.get('children', [])

    def get_notebook_view(self, notebook_id="root"):
        node = self.user_data['notebooks'].get(notebook_id)
        if not node: return {"error": "Not found"}
        raw_items, _ = self._get_all_questions_recursive(notebook_id)
        questions = []
        stats = {"errors": 0, "proficiency": 0, "tags": {}}
        for item in raw_items:
            q = self.get_question_by_id(item['id'])
            if not q: continue
            metrics = self.user_data['metrics'].get(item['id'], {"errors": 0, "proficiency": 0})
            final_tags = list(set(q.get('tags', []) + item['tags']))
            stats['errors'] += metrics['errors']
            stats['proficiency'] += metrics['proficiency']
            for t in final_tags: stats['tags'][t] = stats['tags'].get(t, 0) + 1
            questions.append({
                "id": item['id'],
                "summary": q['content'][:20].replace('<p>', '').replace('</p>', '') + "...",
                "tags": final_tags, 
                "proficiency": metrics['proficiency']
            })
        sub_notebooks = []
        for child_id in node['children']:
            child = self.user_data['notebooks'].get(child_id)
            if child: sub_notebooks.append({"id": child['id'],"name": child['name'],"tags": child['tags'],"count": len(child['questions'])})
        breadcrumbs = []
        curr = node
        while curr:
            breadcrumbs.insert(0, {"id": curr['id'], "name": curr['name']})
            curr = self.user_data['notebooks'].get(curr['parent'])
        avg_prof = int(stats['proficiency'] / len(questions)) if questions else 0
        sorted_tags = sorted(stats['tags'].items(), key=lambda x: x[1], reverse=True)[:8]
        return {
            "info": {"id": node['id'], "name": node['name'], "tags": node['tags']},
            "stats": {"total": len(questions), "avg_prof": avg_prof, "errors": stats['errors'], "top_tags": [{"name": k, "count": v} for k,v in sorted_tags]},
            "sub_notebooks": sub_notebooks, "questions": questions, "breadcrumbs": breadcrumbs
        }

    def get_notebook_list_simple(self):
        options = []
        def traverse(node_id, level=0):
            node = self.user_data['notebooks'].get(node_id)
            if not node: return
            if node_id != 'root': options.append({"id": node['id'], "name": ("— " * level) + node['name']})
            for child in node['children']: traverse(child, level + (0 if node_id=='root' else 1))
        traverse('root')
        return options

    def add_question_to_target_book(self, book_id, q_id):
        if book_id not in self.user_data['notebooks']: return False
        if q_id not in self.user_data['notebooks'][book_id]['questions']:
             self.user_data['notebooks'][book_id]['questions'].append(q_id)
             self._save_user_data()
        return True

    def create_notebook(self, name, parent_id="root", tags=[]):
        if parent_id not in self.user_data['notebooks']: return False
        new_id = str(uuid.uuid4())
        new_book = {"id": new_id, "name": name, "parent": parent_id, "children": [], "questions": [], "tags": tags if isinstance(tags, list) else []}
        self.user_data['notebooks'][new_id] = new_book
        self.user_data['notebooks'][parent_id]['children'].append(new_id)
        self._save_user_data()
        return True

    def _add_to_inbox(self, q_id):
        inbox_id = next((k for k,v in self.user_data['notebooks'].items() if v['name'] in ['Default', 'Inbox']), None)
        if not inbox_id:
            inbox_id = str(uuid.uuid4())
            self.user_data['notebooks'][inbox_id] = {"id": inbox_id, "name": "Inbox", "parent": "root", "children": [], "questions": [q_id], "tags": []}
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
        root_children = []
        root_node = self.user_data['notebooks'].get("root")
        if root_node:
            for cid in root_node['children']:
                child = self.user_data['notebooks'].get(cid)
                if child: root_children.append(child)
        return {"streak_days": self.user_data.get('streak', 1), "mastery_rate": avg_prof, "questions_done": total_done, "top_books": root_children}

service = QuestionService()