var express = require("express");
var app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
var sql = require("mssql");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(cors());

var config = {
  user: process.env.MSSQL_USER_LOGIN,
  password: process.env.MSSQL_USER_PASSWORD,
  server: process.env.MSSQL_SERVER_API,
  database: process.env.MSSQL_DATABASE_NAME,
  trustServerCertificate: true,
};


app.use(express.static("public"));
app.use(bodyParser.json());

//Регистрация пользователя
app.post("/api/users/signup", async (req, res) => {
  const { Login, Password } = req.body;
  const hashedPassword = await bcrypt
    .hash(req.body.Password, saltRounds)
    .then((hash) => {
      return hash;
    })
    .catch((err) => console.error(err.message));

  const pool = await sql.connect(config);
  let connection = new sql.ConnectionPool(config, function (err) {
    let request = new sql.Request(connection);
    try {
      pool
        .request()
        .input("Login", sql.NVarChar, Login)
        .input("Password", sql.NVarChar(sql.MAX), hashedPassword)
        .query("INSERT INTO Users (Login, Password) VALUES (@Login, @Password)")
        .then((result) => {
          res
            .status(200)
            .json({ success: true, message: "Data added succesfully" });
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

//Авторизация пользователя
app.post("/api/users/signin", async (req, res) => {
  const { Login, Password } = req.body;

  const pool = await sql.connect(config);
  let connection = new sql.ConnectionPool(config, function (err) {
    let request = new sql.Request(connection);
    try {
      pool
        .request()
        .input("Login", sql.NVarChar, Login)
        .input("Password", sql.NVarChar, Password)
        .query(
          `SELECT * FROM Users
        WHERE Login = @Login`
        )
        .then(async(result) => {
          const checkPass = await bcrypt.compareSync(Password, result.recordset[0].password);


          if (checkPass) {
            res.status(200).json({
              Id: result.recordset[0].Id,
              Login: result.recordset[0].Login,
            });
          } else {
            res
              .status(401)
              .json({ success: false, message: "Password is not equal" });
          }
        })

        .catch((error) => {
          console.error(error);
          res.status(500).json({ success: false, message: "Server problem" });
        })

        .finally(() => {
          connection.close();
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server problem (2)" });
    }
  });
});

//Получить всех пользователей
app.get("/api/users", function (req, res) {
  sql.connect(config, function (err) {
    if (err) console.log(err);

    var request = new sql.Request();

    request.query("select * from Users", function (err, recordset) {
      if (err) console.log(err);

      res.send(recordset.recordset);
    });
  });
});

//Добавить заметку
app.post("/api/tasks/add", async (req, res) => {
  const { UserId, title } = req.body;
  const pool = await sql.connect(config);
  let connection = new sql.ConnectionPool(config, function (err) {
    let request = new sql.Request(connection);
    try {
      pool
        .request()
        .input("UserId", sql.Int, UserId)
        .input("title", sql.NVarChar, title)
        .query("INSERT INTO TaskList (UserId, title) VALUES (@UserId, @title)")
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

//Получить список всех заметок для текущего пользователя
app.get("/api/tasks/:id", async (req, res) => {
  const UserId = req.params.id;
  const pool = await sql.connect(config);
  let connection = new sql.ConnectionPool(config, function (err) {
    let request = new sql.Request(connection);
    try {
      pool
        .request()
        .input("UserId", sql.Int, UserId)
        .query(`Select * FROM TaskList where UserId = @UserId`)
        .then((result) => {
          res.status(200).json({ tasks: result.recordset });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ success: false, message: "Error on server" });
        })
        .finally(() => {
          connection.close();
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error on server" });
    }
  });
});

var server = app.listen(5000, function () {
  console.log("Server is running..");
});
