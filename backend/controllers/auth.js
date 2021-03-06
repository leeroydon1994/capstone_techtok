const express = require("express");
const jwt = require("jsonwebtoken"); // JWT

const cors = require("cors"); // CORS - Cross Origin Resource Sharing
const bodyParser = require("body-parser");
const axios = require("axios");
const config = require("../config");
const app = express();

const bcrypt = require("./bcrypt.js");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const knexFile = require("../knexfile")[process.env.NODE_ENV || "development"];
const knex = require("knex")(knexFile);

const authClass = require("../auth")(knex);
app.use(authClass.initialize());

exports.postLogin = async function (req, res) {
  // FROM A REAL DATABASE
  if (req.body.email && req.body.password) {
    let email = req.body.email;
    let password = req.body.password;
    let query = await knex.select("*").from("users").where("email", email);

    if (query) {
      let result = await bcrypt.checkPassword(password, query[0].password);

      if (result === true) {
        let payload = {
          id: query[0].id,
          name: query[0].name,
        };
        let token = jwt.sign(payload, config.jwtSecret);
        res.json({
          token: token,
          userName: query[0].name,
        });
      } else {
        console.error("Incorrect password.");
        res.sendStatus(401);
      }
    } else {
      console.error("No such user.");
      res.sendStatus(401);
    }
  } else {
    console.error("No input!");
    res.sendStatus(401);
  }
};

exports.postFBLogin = function async(req, res) {
  if (req.body) {
    let { name, email, id, accessToken } = req.body;

    // update this logic to put the user into the database
    axios
      .get(`https://graph.facebook.com/me?access_token=${accessToken}`)
      .then(async (data) => {
        if (!data.data.error) {
          var payload = {
            accessToken: accessToken,
            id: id,
            name: name,
            email: email,
          };

          // an if condition to check if that user is inside.

          let query = await knex
            .select("email")
            .from("users")
            .where("email", email)
            .then((query) => {
              if (query.length == 0) {
                return knex("users")
                  .insert({
                    email: email,
                    name: name,
                    accessToken: accessToken,
                  })
                  .returning("id");
              } else {
                return knex("users")
                  .where("email", email)
                  .update({
                    accessToken: accessToken,
                  })
                  .returning("id");
              }
            });

          // Return the JWT token after checking
          var token = jwt.sign(payload, config.jwtSecret);
          res.json({
            token: token,
            id: query[0].id,
            userName: name,
            // optionally provide also the user id to frontend
          });
        } else {
          res.sendStatus(401);
        }
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(401);
      });
  } else {
    res.sendStatus(401);
  }
};

// Sign Up

exports.postSignUp = async function (req, res) {
  if (req.body) {
    let { name, password, email } = req.body;

    let hash = await bcrypt.hashPassword(password);

    let query = await knex
      .select("email")
      .from("users")
      .where("email", email)
      .then((query) => {
        if (query.length == 0) {
          return knex("users")
            .insert({
              name: name,
              password: hash,
              email: email,
            })
            .returning("id");
        } else {
          return console.error("fail");
        }
      });

    let payload = {
      id: query[0].id,
    };

    let token = jwt.sign(payload, config.jwtSecret);

    //send token and id to frontend
    res.json({
      token: token,
      id: query[0].id,
    });
  }
};
