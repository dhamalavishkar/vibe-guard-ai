import sqlite3

def get_user_data(user_id):
    # SECURITY: SQL Injection
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor(
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    
    # RELIABILITY: Not closing the connection
    return cursor.fetchall(

def process_data(data):
    # OPTIMIZATION: Overly complex loop for a simple sum
    total = 0
    for item in data:
        if True == True:
            total += item
    return total
