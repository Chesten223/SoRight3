import json
import random
import os

class QuestionService:
    def __init__(self):
        self.files = {
            "exam": "data/exam_questions.json",
            "training": "data/training_questions.json"
        }
        self.user_data_path = "user_data.json"
        self.questions = []
        self.user_data = self._load_user_data()
        self.reload_data()

    def _load_user_data(self):
        """加载用户进度和错题本，如果不存在则初始化默认结构"""
        if os.path.exists(self.user_data_path):
            try:
                with open(self.user_data_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass # 如果文件损坏，返回默认值
        return {
            "mistake_books": {"default": []},
            "metrics": {}, # q_id -> {errors: 0, proficiency: 0, attempts: 0}
            "streak": 5
        }

    def _save_user_data(self):
        with open(self.user_data_path, 'w', encoding='utf-8') as f:
            json.dump(self.user_data, f, indent=2, ensure_ascii=False)

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

    def get_question(self, mode="training", q_id=None, book_name=None):
        # 1. 错题本模式
        if mode == 'mistake' and book_name:
            book = self.user_data['mistake_books'].get(book_name, [])
            if not book:
                return None
            
            # 随机抽题
            target_id = random.choice(book)
            metrics = self.user_data['metrics'].get(target_id, {})
            
            # --- 核心逻辑：陈旧题目置换 (Variant Swapping) ---
            # 如果做过超过5次，且熟练度还行，或者只是为了防止背答案
            if metrics.get('attempts', 0) > 5:
                original_q = self.get_question_by_id(target_id)
                if original_q and 'tags' in original_q:
                    # 寻找同标签的其他题目 (且不在当前错题本中)
                    variants = [
                        q for q in self.questions 
                        if any(t in q.get('tags', []) for t in original_q['tags']) 
                        and q['id'] != target_id
                    ]
                    if variants:
                        # 返回变式题，但此时我们不把变式题加入错题本，只是临时展示
                        # 前端会看到这是一道“新题”
                        return random.choice(variants)
            
            return self.get_question_by_id(target_id)

        # 2. 普通模式 / 定向跳转
        if q_id:
            return self.get_question_by_id(q_id)
        
        # 3. 随机筛选
        filtered = [q for q in self.questions if q.get('mode') == mode]
        return random.choice(filtered) if filtered else None

    def check_answer(self, q_id, user_choice):
        question = self.get_question_by_id(q_id)
        if not question: return {"error": "Question not found"}
        
        is_correct = (user_choice == question['correct_id'])
        
        # --- 更新指标 ---
        if q_id not in self.user_data['metrics']:
            self.user_data['metrics'][q_id] = {"errors": 0, "proficiency": 0, "attempts": 0}
        
        m = self.user_data['metrics'][q_id]
        m['attempts'] += 1
        
        if is_correct:
            # 熟练度 +15 (上限100)
            m['proficiency'] = min(100, m['proficiency'] + 15)
        else:
            # 错题次数 +1，熟练度 -10
            m['errors'] += 1
            m['proficiency'] = max(0, m['proficiency'] - 10)
            
            # 自动加入默认错题本 (如果还不在里面的话)
            if q_id not in self.user_data['mistake_books']['default']:
                self.user_data['mistake_books']['default'].append(q_id)

        self._save_user_data()

        return {
            "is_correct": is_correct,
            "correct_id": question['correct_id'],
            "metrics": m,
            "explanation": question.get('ai_context', {}).get('explanation', '暂无详细解析，请咨询AI助教。'),
            "diagnosis": question.get('diagnosis') if not is_correct and question.get('mode') == 'training' else None
        }

    def create_mistake_book(self, name):
        if name in self.user_data['mistake_books']:
            return False
        self.user_data['mistake_books'][name] = []
        self._save_user_data()
        return True

    def get_dashboard_stats(self):
        # 计算总做题数 (metrics 的 key 数量)
        total_done = len(self.user_data['metrics'])
        # 计算平均掌握度
        avg_proficiency = 0
        if total_done > 0:
            total_score = sum(m['proficiency'] for m in self.user_data['metrics'].values())
            avg_proficiency = int(total_score / total_done)

        return {
            "streak_days": self.user_data.get('streak', 1),
            "mastery_rate": avg_proficiency,
            "questions_done": total_done,
            "books": list(self.user_data['mistake_books'].keys())
        }

service = QuestionService()