from flask import Flask, render_template, jsonify, request
from question_service import service

app = Flask(__name__)

# --- 核心修复：自动判断是否为 HTMX 请求 ---
def render_page(template_name, **kwargs):
    # 如果是 HTMX 请求，使用 partial_layout (只渲染内容，不刷新音乐)
    # 如果是普通请求，使用 layout (渲染全页，初始化音乐)
    layout = "partial_layout.html" if request.headers.get('HX-Request') else "layout.html"
    return render_template(template_name, layout=layout, **kwargs)

@app.route('/')
def dashboard():
    stats = service.get_dashboard_stats()
    return render_page('dashboard.html', stats=stats)

@app.route('/quiz')
def quiz_page():
    mode = request.args.get('mode', 'training')
    book = request.args.get('book')
    return render_page('quiz.html', mode=mode, book=book)

@app.route('/api/get_question', methods=['GET'])
def api_get_question():
    mode = request.args.get('mode', 'training')
    book = request.args.get('book')
    q_id = request.args.get('q_id')
    
    question = service.get_question(mode=mode, q_id=q_id, book_name=book)
    
    if not question:
        if mode == 'mistake':
            return jsonify({"error": "Mistake book is empty!", "code": 404}), 404
        return jsonify({"error": "No questions available", "code": 404}), 404
        
    return jsonify(question)

@app.route('/api/submit', methods=['POST'])
def api_submit():
    data = request.json
    if not data or 'q_id' not in data or 'choice' not in data:
        return jsonify({"error": "Invalid data"}), 400
    result = service.check_answer(data['q_id'], data['choice'])
    return jsonify(result)

@app.route('/api/create_book', methods=['POST'])
def api_create_book():
    data = request.json
    name = data.get('name')
    if not name: return jsonify({"success": False, "msg": "Name required"})
    if service.create_mistake_book(name): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Book exists"})

@app.route('/api/ai_chat', methods=['POST'])
def api_ai_chat():
    data = request.json
    user_msg = data.get('message')
    context = data.get('context', {})
    reply = f"AI 收到：{user_msg}。提示：{context.get('hint_prompt', '请回顾基础概念。')}"
    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(debug=True, port=5000)