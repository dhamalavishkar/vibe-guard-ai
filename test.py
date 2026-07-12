def getUserData(id):
    db = connect()
    query = "SELECT * FROM users WHERE id = " + id
    return db.execute(query)
    print("Data fetched!") # dead code
