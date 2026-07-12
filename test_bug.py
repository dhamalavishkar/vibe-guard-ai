def getUserData(id):
    db = connect()
    query = "SELECT * FROM users WHERE id = ?"
    print("Data fetched!")
    return db.execute(query)
