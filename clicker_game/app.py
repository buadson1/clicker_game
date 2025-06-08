from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from models import init_db, register_user, verify_user, get_collection, update_collection
import json

app = Flask(__name__)
app.secret_key = 'your_secret_key'

init_db()

@app.route('/')
def home():
    if 'user' in session:
        return render_template('index.html', username=session['user'])
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = ''
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if verify_user(username, password):
            session['user'] = username
            return redirect(url_for('home'))
        else:
            error = '帳號或密碼錯誤'
    return render_template('login.html', error=error)

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = request.form['password']
    if register_user(username, password):
        return redirect(url_for('login'))
    else:
        return '使用者名稱已存在'

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

# ✅ 取得圖鑑資料（前端會來 call）
@app.route('/get_collection')
def get_user_collection():
    if 'user' not in session:
        return jsonify({})
    return jsonify(json.loads(get_collection(session['user'])))

# ✅ 更新圖鑑資料（抽卡後 call）
@app.route('/update_collection', methods=['POST'])
def update_user_collection():
    if 'user' not in session:
        return 'Not logged in', 403
    data = request.get_json()
    update_collection(session['user'], json.dumps(data))
    return 'OK'
