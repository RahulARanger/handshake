const sqlite3 = require("sqlite3").verbose();

const connection = new sqlite3.Database("../TestResults/TeStReSuLtS.db", sqlite3.OPEN_READONLY)

const results = connection.each("select suiteSummary from runbase where started = (select max(started) from runbase);", function (_, __) {
    console.log(__, __.passed)
})

connection.close()