var express = require("express");
var app = express();

var sql = require("mssql");

// config for your database
var config = {
  user: "sa",
  password: "123",
  server: "localhost",
  database: "todolist",
  trustServerCertificate: true,
};

app.post("/api/users"),
  async (req, res) => {
    const { login, password } = req.body;
    const pool = await sql.connect(config);
    try {
      const result = await pool
        .request()
        .input("login", sql.NVarChar, login)
        .input("password", sql.NVarChar, password)
        .query(
          "INSERT INTO Users (login, password) VALUES (@login, @password)"
        );
      res
        .status(200)
        .json({ success: true, message: "Data added successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error adding data" });
    }
  };

app.get("/api/users", function (req, res) {
  // connect to your database
  sql.connect(config, function (err) {
    if (err) console.log(err);
    // create Request object
    var request = new sql.Request();
    // query to the database and get the records
    request.query("select * from Users", function (err, recordset) {
      if (err) console.log(err);

      // send records as a response
      res.send(recordset.recordset);
    });
  });
});

var server = app.listen(5000, function () {
  console.log("Server is running..");
});
