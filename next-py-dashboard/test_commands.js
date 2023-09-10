const sqlite3 = require("sqlite3").verbose();

const connection = new sqlite3.Database("../TestResults/TeStReSuLtS.db", sqlite3.OPEN_READONLY)

const results = connection.each("select * from suitebase where suiteType = 'SUITE' and session_id = (select sessionID from sessionbase where test_id = ?)", "d73a1528-ec50-4813-9072-69187faa5db4", function (_, __) {
    console.log(__, __.passed)
})

connection.close()