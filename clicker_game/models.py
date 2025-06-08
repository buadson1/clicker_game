import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

DB_NAME = 'database.db'

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        # 建立使用者帳號表
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT NOT NULL
            )
        ''')
        # 建立圖鑑資料表
        c.execute('''
            CREATE TABLE IF NOT EXISTS userdata (
                username TEXT PRIMARY KEY,
                collection TEXT DEFAULT '{}',
                FOREIGN KEY (username) REFERENCES users(username)
            )
        ''')

def register_user(username, password):
    hashed_pw = generate_password_hash(password)
    try:
        with sqlite3.connect(DB_NAME) as conn:
            c = conn.cursor()
            c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_pw))
            c.execute("INSERT INTO userdata (username) VALUES (?)", (username,))
        return True
    except sqlite3.IntegrityError:
        return False

def verify_user(username, password):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("SELECT password FROM users WHERE username = ?", (username,))
        row = c.fetchone()
        if row and check_password_hash(row[0], password):
            return True
    return False

def get_collection(username):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("SELECT collection FROM userdata WHERE username = ?", (username,))
        row = c.fetchone()
        return row[0] if row else '{}'

def update_collection(username, new_collection_json):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("UPDATE userdata SET collection = ? WHERE username = ?", (new_collection_json, username))
        conn.commit()
        print(f"更新 {username} 的圖鑑資料：{new_collection_json}")
