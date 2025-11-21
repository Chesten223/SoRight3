from app import app
from models import db
import sqlite3
import os

def update_database():
    print("🔄 Updating Database Schema...")
    
    # 确保上传目录存在
    upload_path = os.path.join('static', 'avatars')
    if not os.path.exists(upload_path):
        os.makedirs(upload_path)
        print(f"📂 Created avatars folder: {upload_path}")

    conn = sqlite3.connect(os.path.join('instance', 'physics.db'))
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN nickname VARCHAR(80)")
        print("✅ Added 'nickname' column.")
    except Exception as e:
        print(f"ℹ️  Column 'nickname' might already exist: {e}")

    # 确保 avatar 列存在（以防万一）
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar VARCHAR(100) DEFAULT 'default.png'")
        print("✅ Added 'avatar' column.")
    except:
        pass

    conn.commit()
    conn.close()
    print("🎉 Update complete!")

if __name__ == '__main__':
    update_database()