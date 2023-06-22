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
app.get("/api/userlist", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    const result = await request.query("SELECT * FROM Users");
    res.status(200).json({ userlist: result.recordset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error on server" });
  } finally {
    sql.close();
  }
});

//Регистрация пользователя
app.post('/api/users/signup', async (req, res) => {
  try {
    const { login, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('login', sql.NVarChar, login);
    request.input('password', sql.NVarChar(sql.MAX), hashedPassword);

    const result = await request.query('INSERT INTO Users (login, password) VALUES (@login, @password)');

    res.status(200).json({ success: true, message: 'Data added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error adding data' });
  } finally {
    sql.close();
  }
});

//Авторизация пользователя
app.post("/api/users/signin", async (req, res) => {
  try {
    const { login, password } = req.body;
    console.log(password);

    const pool = await sql.connect(config);
    const request = pool.request();
    
    const result = await request
      .input("login", sql.NVarChar, login)
      .query(
        `SELECT * FROM Users
        WHERE login = @login`
      );

    if (result.recordset.length > 0) {
      const checkPass = bcrypt.compareSync(password, result.recordset[0].password);
      if (checkPass) {
        res.status(200).json({
          id: result.recordset[0].id,
          login: result.recordset[0].login,
        });
      } else {
        res.status(401).json({ success: false, message: "Password is not equal" });
      }
    } else {
      res.status(401).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server problem" });
  }
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
