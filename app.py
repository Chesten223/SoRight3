import os
import logging
from functools import wraps
from logging.handlers import RotatingFileHandler
from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, abort
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_wtf.csrf import CSRFProtect
from question_service import service
from models import db, User, InvitationCode
from config import Config
from werkzeug.utils import secure_filename # <--- [新增]

app = Flask(__name__)
app.config.from_object(Config)

# --- [关键修改] 数据库路径重定向到 instance 文件夹 ---
# 1. 确保 instance 文件夹存在
try:
    os.makedirs(app.instance_path)
except OSError:
    pass

# 2. 重新设置数据库 URI，指向 instance/physics.db
# app.instance_path 会自动指向项目根目录下的 instance 文件夹
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'physics.db')
# --------------------------------------------------

db.init_app(app)
csrf = CSRFProtect(app)

login_manager = LoginManager()
# ... (后面的代码保持不变)
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, user_id)

# --- 日志系统 ---
if not app.debug:
    if not os.path.exists('logs'): os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/physics.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Physics Pro startup')

# --- [NEW] 管理员权限装饰器 ---
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            abort(403) # 禁止访问
        return f(*args, **kwargs)
    return decorated_function

# ================== 错误处理 ==================
@app.errorhandler(404)
def not_found_error(error):
    if request.path.startswith('/api/'): return jsonify({"error": "Endpoint not found", "code": 404}), 404
    return render_template('404.html', user=current_user), 404

@app.errorhandler(403)
def forbidden_error(error):
    return "Access Denied", 403

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    app.logger.error(f'Server Error: {error}')
    if request.path.startswith('/api/'): return jsonify({"error": "Internal server error", "code": 500}), 500
    return render_template('500.html', user=current_user), 500

# ================== 认证路由 (Updated) ==================

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated: return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            if not user.is_active:
                flash('Account is banned.')
                return render_template('login.html')
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated: return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        invite_code = request.form.get('invite_code', '').strip().upper()
        
        # 1. 检查邀请码 (如果是第一个注册的用户，可以免码成为管理员，方便初始化)
        is_first_user = (User.query.count() == 0)
        invitation = None
        
        if not is_first_user:
            invitation = InvitationCode.query.filter_by(code=invite_code, is_used=False).first()
            if not invitation:
                flash('Invalid or used invitation code')
                return render_template('register.html')

        # 2. 检查用户名
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
        else:
            # 3. 创建用户
            new_user = User(username=username, is_admin=is_first_user)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.flush() # 获取 ID
            
            # 4. 标记邀请码已用
            if invitation:
                invitation.is_used = True
                invitation.used_by.append(new_user)
                new_user.used_invite_code_id = invitation.id
            
            db.session.commit()
            service.init_new_user(new_user)
            login_user(new_user)
            return redirect(url_for('dashboard'))
            
    return render_template('register.html')

@app.route('/api/question/move', methods=['POST'])
@login_required
def api_question_move():
    d = request.json
    if service.move_question_to_book(d.get('q_id'), d.get('from_book'), d.get('to_book')):
        return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed to move"})

@app.route('/api/question/update_tags', methods=['POST'])
@login_required
def api_question_update_tags():
    d = request.json
    tags = [t.strip() for t in d.get('tags', '').split(',') if t.strip()]
    if service.update_question_tags(d.get('q_id'), tags):
        return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed"})

@app.route('/api/question/remove', methods=['POST'])
@login_required
def api_question_remove():
    d = request.json
    if service.remove_question_from_book(d.get('book_id'), d.get('q_id')):
        return jsonify({"success": True})
    return jsonify({"success": False})
# 在 app.py 的 API 区域添加/确认以下路由

@app.route('/api/question/copy', methods=['POST'])
@login_required
def api_question_copy():
    d = request.json
    # q_id, to_book (from_book 不需要，因为是复制)
    if service.copy_question_to_book(d.get('q_id'), d.get('to_book')):
        return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Failed to copy"})

# 确认 update_tags 路由存在 (原文件中已有，无需修改，确保没删即可)
# @app.route('/api/question/update_tags', methods=['POST']) ...
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# ================== [NEW] 管理员后台 ==================

@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    users = User.query.all()
    codes = InvitationCode.query.filter_by(is_used=False).all()
    return render_template('admin.html', user=current_user, users=users, codes=codes)

@app.route('/admin/generate_code', methods=['POST'])
@login_required
@admin_required
def admin_generate_code():
    code_str = InvitationCode.generate_code()
    new_code = InvitationCode(code=code_str, created_by_id=current_user.id)
    db.session.add(new_code)
    db.session.commit()
    return jsonify({"success": True, "code": code_str})

@app.route('/admin/toggle_user/<user_id>', methods=['POST'])
@login_required
@admin_required
def admin_toggle_user(user_id):
    if user_id == current_user.id: return jsonify({"success": False, "msg": "Cannot ban yourself"})
    user = db.session.get(User, user_id)
    if user:
        user.is_active = not user.is_active
        db.session.commit()
        return jsonify({"success": True, "status": user.is_active})
    return jsonify({"success": False})

# ================== 业务路由 (保持不变) ==================

def render_page(template_name, **kwargs):
    layout = "partial_layout.html" if request.headers.get('HX-Request') else "layout.html"
    return render_template(template_name, layout=layout, user=current_user, **kwargs)

@app.route('/')
@login_required
def dashboard():
    stats = service.get_dashboard_stats()
    return render_page('dashboard.html', stats=stats)

@app.route('/quiz')
@login_required
def quiz_page():
    mode = request.args.get('mode', 'training')
    book_id = request.args.get('book', 'root') 
    return render_page('quiz.html', mode=mode, book=book_id)

@app.route('/notes')
@login_required
def notes_page():
    note_id = request.args.get('id', 'root')
    return render_page('notes.html', note_id=note_id)

# ================== API 路由 (保持不变，全部省略以节省篇幅) ==================
# 请保留原有的所有 API 路由代码！
# 下面仅仅是示例占位，请不要删除你原有的 API 代码
# ... (Copy paste your original API routes here) ...

@app.route('/api/get_question', methods=['GET'])
@login_required
def api_get_question():
    mode = request.args.get('mode', 'training')
    book = request.args.get('book')
    q_id = request.args.get('q_id')
    question = service.get_question(mode=mode, q_id=q_id, book_id=book)
    if not question:
        if mode == 'mistake': return jsonify({"error": "Book empty!", "code": 404}), 404
        return jsonify({"error": "No questions available", "code": 404}), 404
    return jsonify(question)

# ... 在 app.py 的 API 区域添加以下代码 ...

# --- User Settings API ---

@app.route('/api/user/upload_avatar', methods=['POST'])
@login_required
def api_upload_avatar():
    if 'file' not in request.files:
        return jsonify({"success": False, "msg": "No file part"})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "msg": "No selected file"})
    
    if file:
        # 确保文件名安全，并使用 User ID 防止重名
        # 保存为: static/avatars/user_id.png (覆盖旧图，节省空间)
        ext = file.filename.rsplit('.', 1)[1].lower()
        if ext not in ['png', 'jpg', 'jpeg', 'gif']:
            return jsonify({"success": False, "msg": "Invalid file type"})
            
        filename = f"{current_user.id}.{ext}"
        upload_folder = os.path.join(app.root_path, 'static', 'avatars')
        
        # 确保目录存在
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        # 更新数据库
        current_user.avatar = filename
        db.session.commit()
        
        # 返回新头像的 URL (加时间戳防缓存)
        new_url = url_for('static', filename=f'avatars/{filename}')
        return jsonify({"success": True, "url": new_url})

@app.route('/api/user/change_password', methods=['POST'])
@login_required
def api_change_password():
    data = request.json
    old_pass = data.get('old_password')
    new_pass = data.get('new_password')
    
    if not current_user.check_password(old_pass):
        return jsonify({"success": False, "msg": "Incorrect current password"})
    
    if len(new_pass) < 6:
        return jsonify({"success": False, "msg": "Password too short (min 6 chars)"})
        
    current_user.set_password(new_pass)
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/book_details', methods=['GET'])
@login_required
def api_book_details():
    book_id = request.args.get('book', 'root')
    return jsonify(service.get_notebook_view(book_id))

@app.route('/api/get_notebooks', methods=['GET'])
@login_required
def api_get_notebooks():
    return jsonify(service.get_notebook_list_simple())

@app.route('/api/add_to_book', methods=['POST'])
@login_required
def api_add_to_book():
    data = request.json
    if service.add_question_to_target_book(data.get('book_id'), data.get('q_id')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/submit', methods=['POST'])
@login_required
def api_submit():
    data = request.json
    result = service.check_answer(data['q_id'], data['choice'])
    return jsonify(result)

@app.route('/api/create_book', methods=['POST'])
@login_required
def api_create_book():
    data = request.json
    tags = [t.strip() for t in data.get('tags', '').split(',') if t.strip()]
    if service.create_notebook(data.get('name'), data.get('parent', 'root'), tags): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/ai_chat', methods=['POST'])
@login_required
def api_ai_chat():
    data = request.json
    return jsonify({"reply": f"AI 收到：{data.get('message')}"})

# --- Notes API ---
@app.route('/api/notes/view', methods=['GET'])
@login_required
def api_notes_view():
    return jsonify(service.get_note_view(request.args.get('id', 'root')))

@app.route('/api/notes/create', methods=['POST'])
@login_required
def api_notes_create():
    d = request.json
    if service.create_note_item(d.get('name'), d.get('type', 'folder'), d.get('parent', 'root')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/save', methods=['POST'])
@login_required
def api_notes_save():
    d = request.json
    if service.save_note_content(d.get('id'), d.get('content')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/rename', methods=['POST'])
@login_required
def api_notes_rename():
    d = request.json
    if service.rename_note_item(d.get('id'), d.get('name')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/delete', methods=['POST'])
@login_required
def api_notes_delete():
    if service.delete_note_item(request.json.get('id')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/move', methods=['POST'])
@login_required
def api_notes_move():
    d = request.json
    if service.move_note_item(d.get('id'), d.get('parent')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/reorder', methods=['POST'])
@login_required
def api_notes_reorder():
    d = request.json
    if service.reorder_note_children(d.get('parent_id'), d.get('new_order')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/sort', methods=['POST'])
@login_required
def api_notes_sort():
    d = request.json
    if service.sort_note_children(d.get('parent_id'), d.get('sort_by')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notes/search', methods=['GET'])
@login_required
def api_notes_search():
    return jsonify(service.search_notes(request.args.get('q', '')))

@app.route('/api/notes/info', methods=['GET'])
@login_required
def api_note_info():
    note = service.get_note_by_id_simple(request.args.get('id'))
    if note: return jsonify(note)
    return jsonify({"error": "Not found"})

# --- Notebooks API ---
@app.route('/api/notebooks/rename', methods=['POST'])
@login_required
def api_notebooks_rename():
    d = request.json
    if service.rename_notebook(d.get('id'), d.get('name')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notebooks/delete', methods=['POST'])
@login_required
def api_notebooks_delete():
    if service.delete_notebook(request.json.get('id')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notebooks/move', methods=['POST'])
@login_required
def api_notebooks_move():
    d = request.json
    if service.move_notebook(d.get('id'), d.get('parent')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/notebooks/reorder', methods=['POST'])
@login_required
def api_notebooks_reorder():
    d = request.json
    if service.reorder_notebook_content(d.get('id'), d.get('sub_order'), d.get('q_order')): return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/api/get_related_notes', methods=['GET'])
@login_required
def api_get_related_notes():
    return jsonify(service.find_notes_by_question(request.args.get('q_id')))

# ================== [NEW] 用户设置 API (头像/昵称/密码) ==================

@app.route('/api/user/update_profile', methods=['POST'])
@login_required
def api_update_profile():
    data = request.json
    new_nickname = data.get('nickname')
    if new_nickname:
        current_user.nickname = new_nickname
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "msg": "Empty nickname"})



if __name__ == '__main__':
    app.run(debug=True, port=5000)