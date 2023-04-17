var express = require("express");
var app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
var sql = require("mssql");

app.use(cors());
// config for your database
var config = {
  user: "ad0rfin",
  password: "chdefa432125e",
  server: "localhost",
  database: "todolist",
  trustServerCertificate: true,
};

app.use(express.static("public"));
app.use(bodyParser.json());

app.post("/api/login", async (req, res) => {
  const { Login, Password } = req.body;
});

app.post("/api/users", async (req, res) => {
  const { Login, Password } = req.body;
  const pool = await sql.connect(config);
  let connection = new sql.ConnectionPool(config, function (err) {
    let request = new sql.Request(connection);
    try {
      pool
        .request()
        .input("Login", sql.NVarChar, Login)
        .input("Password", sql.NVarChar, Password)
        .query("INSERT INTO Users (Login, Password) VALUES (@Login, @Password)")
        .then((result) => {
          res
            .status(200)
            .json({ success: true, message: "Data added successfully" });
        })
        .catch((error) => {
          console.error(error);
          res
            .status(500)
            .json({ success: false, message: "Error adding data" });
        })
        .finally(() => {
          connection.close();
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error adding data" });
    }
  });
});

app.get("/api/users", function (req, res) {
  // connect to your database
  sql.connect(config, function (err) {
    if (err) console.log(err);
    var request = new sql.Request();
    // query to the database and get the records
    request.query("select * from Users", function (err, recordset) {
      if (err) console.log(err);

      // send records as a response
      res.send(recordset.recordset);
      console.log(recordset.recordset);
    });
  });
});

app.post("/api/tasks", async (req, res) => {
  const { UserId, title, completed, deleted } = req.body;
  const pool = await sql.connect(config);
  let connection = new sql.ConnectionPool(config, function (err) {
    let request = new sql.Request(connection);
    try {
      pool
        .request()
        .input("UserId", sql.Int, UserId)
        .input("title", sql.NVarChar, title)
        .input("completed", sql.Bit, completed)
        .input("deleted", sql.Bit, deleted)
        .query(
          "INSERT INTO TaskList (UserId, title, completed, deleted) VALUES (@UserId, @title, @completed, @deleted)"
        )
        .then((result) => {
          res
            .status(200)
            .json({ success: true, message: "Data added successfully" });
        })
        .catch((error) => {
          console.error(error);
          res
            .status(500)
            .json({ success: false, message: "Error adding data" });
        })
        .finally(() => {
          connection.close();
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error adding data" });
    }
  });
});

app.get("/api/tasks", function (req, res) {
  // connect to your database
  sql.connect(config, function (err) {
    if (err) console.log(err);
    var request = new sql.Request();
    // query to the database and get the records
    request.query("select * from TaskList", function (err, recordset) {
      if (err) console.log(err);

      // send records as a response
      res.send(recordset.recordset);
      console.log(recordset.recordset);
    });
  });
});

var server = app.listen(5000, function () {
  console.log("Server is running..");
});
