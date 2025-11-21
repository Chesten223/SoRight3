from flask import Flask, render_template, jsonify, request
from question_service import service

app = Flask(__name__)

def render_page(template_name, **kwargs):
    layout = "partial_layout.html" if request.headers.get('HX-Request') else "layout.html"
    return render_template(template_name, layout=layout, **kwargs)

@app.route('/')
def dashboard():
    stats = service.get_dashboard_stats()
    return render_page('dashboard.html', stats=stats)

@app.route('/quiz')
def quiz_page():
    mode = request.args.get('mode', 'training')
    book_id = request.args.get('book', 'root') 
    return render_page('quiz.html', mode=mode, book=book_id)

@app.route('/api/get_question', methods=['GET'])
def api_get_question():
    mode = request.args.get('mode', 'training')
    book = request.args.get('book')
    q_id = request.args.get('q_id')
    
    question = service.get_question(mode=mode, q_id=q_id, book_id=book)
    
    if not question:
        if mode == 'mistake':
            return jsonify({"error": "Book empty!", "code": 404}), 404
        return jsonify({"error": "No questions available", "code": 404}), 404
        
    return jsonify(question)

@app.route('/api/book_details', methods=['GET'])
def api_book_details():
    book_id = request.args.get('book', 'root')
    data = service.get_notebook_view(book_id)
    return jsonify(data)

# --- [NEW] API: 获取所有本子列表 (下拉菜单) ---
@app.route('/api/get_notebooks', methods=['GET'])
def api_get_notebooks():
    return jsonify(service.get_notebook_list_simple())

# --- [NEW] API: 添加题目到本子 ---
@app.route('/api/add_to_book', methods=['POST'])
def api_add_to_book():
    data = request.json
    book_id = data.get('book_id')
    q_id = data.get('q_id')
    if not book_id or not q_id: return jsonify({"success": False})
    success = service.add_question_to_target_book(book_id, q_id)
    return jsonify({"success": success})

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
    parent = data.get('parent', 'root')
    tags = data.get('tags', '').split(',') 
    tags = [t.strip() for t in tags if t.strip()]
    
    if not name: return jsonify({"success": False, "msg": "Name required"})
    if service.create_notebook(name, parent, tags): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Error creating book"})

@app.route('/api/ai_chat', methods=['POST'])
def api_ai_chat():
    data = request.json
    user_msg = data.get('message')
    context = data.get('context', {})
    reply = f"AI 收到：{user_msg}。提示：{context.get('hint_prompt', '请回顾基础概念。')}"
    return jsonify({"reply": reply})

# --- [NEW] Notes System Routes ---

@app.route('/notes')
def notes_page():
    note_id = request.args.get('id', 'root')
    return render_page('notes.html', note_id=note_id)

@app.route('/api/notes/view', methods=['GET'])
def api_notes_view():
    note_id = request.args.get('id', 'root')
    data = service.get_note_view(note_id)
    return jsonify(data)

@app.route('/api/notes/create', methods=['POST'])
def api_notes_create():
    data = request.json
    name = data.get('name')
    type = data.get('type', 'folder')
    parent = data.get('parent', 'root')
    if not name: return jsonify({"success": False, "msg": "Name required"})
    if service.create_note_item(name, type, parent): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/notes/save', methods=['POST'])
def api_notes_save():
    data = request.json
    note_id = data.get('id')
    content = data.get('content')
    if service.save_note_content(note_id, content): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/notes/rename', methods=['POST'])
def api_notes_rename():
    data = request.json
    if service.rename_note_item(data.get('id'), data.get('name')): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/notes/delete', methods=['POST'])
def api_notes_delete():
    data = request.json
    if service.delete_note_item(data.get('id')): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/notes/move', methods=['POST'])
def api_notes_move():
    data = request.json
    if service.move_note_item(data.get('id'), data.get('parent')): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/notes/reorder', methods=['POST'])
def api_notes_reorder():
    data = request.json
    if service.reorder_note_children(data.get('parent_id'), data.get('new_order')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/sort', methods=['POST'])
def api_notes_sort():
    data = request.json
    if service.sort_note_children(data.get('parent_id'), data.get('sort_by')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/search', methods=['GET'])
def api_notes_search():
    query = request.args.get('q', '')
    return jsonify(service.search_notes(query))

@app.route('/api/notes/info', methods=['GET'])
def api_note_info():
    # 简单的获取单个笔记信息的接口，用于前端渲染链接标题
    note_id = request.args.get('id')
    note = service.user_data['notes'].get(note_id)
    if note:
        return jsonify({"id": note['id'], "name": note['name']})
    return jsonify({"error": "Not found"})

@app.route('/api/notebooks/rename', methods=['POST'])
def api_notebooks_rename():
    data = request.json
    if service.rename_notebook(data.get('id'), data.get('name')): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/notebooks/delete', methods=['POST'])
def api_notebooks_delete():
    data = request.json
    if service.delete_notebook(data.get('id')): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/notebooks/move', methods=['POST'])
def api_notebooks_move():
    data = request.json
    if service.move_notebook(data.get('id'), data.get('parent')): return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/notebooks/reorder', methods=['POST'])
def api_notebooks_reorder():
    data = request.json
    if service.reorder_notebook_content(data.get('id'), data.get('sub_order'), data.get('q_order')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/get_related_notes', methods=['GET'])
def api_get_related_notes():
    q_id = request.args.get('q_id')
    return jsonify(service.find_notes_by_question(q_id))

if __name__ == '__main__':
    app.run(debug=True, port=5000)