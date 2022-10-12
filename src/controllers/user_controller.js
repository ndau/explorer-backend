const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
let fs = require("fs");
require("dotenv").config();

const frontEndUrl = process.env.FRONT_END_URL; //define this to enable resetPassword
const hostEmail = process.env.HOST_USER; //define this to enable sendEmail
const hostPassword = process.env.HOST_PASS; // get this through process.env
const tokenKey = process.env.TOKEN_KEY;

deleteSingleUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Users.findOneAndDelete({ _id: id });
    res.status(200).json({
      status: true,
      message: "User Deleted Successfully",
    });
  } catch (err) {
    next(err);
    console.log(err.message);
    res.status(500).json({
      status: false,
      message: "Something went wrong please try again later",
    });
  }
};

let sendEmail = async (mailOptions) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: `${hostEmail}`,
        pass: `${hostPassword}`,
      },
    });

    await smtpTransport.sendMail(mailOptions);
  } catch (error) {
    console.log(error, "email not sent");
  }
};

// CONSTOLLERS USING POSTGRES

exports.PGuserProfileDetails = async (req, res, next) => {
  try {
    let user_id = req.user_id;

    let searchUserQuery = `
    SELECT * FROM users where "user_id" = '${user_id}'`;

    let user = await pool.query(searchUserQuery);
    const foundUser = user.rows[0];

    if (foundUser) {
      res.status(200).json({
        status: true,
        message: "User Exist",
        email: foundUser.email,
      });
    } else {
      res.status(400).json({
        status: false,
        message: "No User Exist",
      });
    }
  } catch (err) {
    next(err);
    console.log(err.message);
    res.status(500).json({
      status: false,
      message: "Something went wrong please try again later",
    });
  }
};

exports.PGregisterUser = async (req, res, next) => {
  try {
    console.log(req.body);
    let { email, password, username } = req.body;
    if (email == undefined || password == undefined || username == undefined) {
      res.status(400).json({
        status: false,
        message: "All Inputs are Required..!",
      });
    } else {
      const query = `
    CREATE TABLE IF NOT EXISTS "users" (
	    "user_id" SERIAL PRIMARY KEY,
	    "username" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "token" TEXT,
      "verificationtoken" TEXT,
      "role" TEXT,
      "verified" BOOLEAN NOT NULL    
      );`;

      let newTable = await pool.query(query);
      if (newTable) {
        let addUserQuery = `INSERT INTO users(username, email, password,verified) VALUES($1,$2,$3,$4)`;

        const encryptedPassword = await bcrypt.hash(password, 10);

        let values = [
          `${username}`,
          `${email}`,
          `${encryptedPassword}`,
          false,
          // `${"12345"}`,
          // `${"1"}`,
        ];

        let addUser = await pool.query(addUserQuery, values);
        console.log(addUser, "add user query result");

        if (addUser) {
          await sendUserVerificationRequest(email);

          res.status(201).json({
            status: true,
            message: "User registered successfully",
          });
        } else {
          res.status(500).json({
            status: false,
            message: "Error while saving user data",
          });
        }
      } else {
        res.status(500).json({
          status: false,
          message: "Table not created",
        });
      }
    }
  } catch (err) {
    next(err);

    let errorMsg = "Something went wrong please try again later";

    if (
      err.message ===
      `duplicate key value violates unique constraint "users_email_key"`
    )
      errorMsg = "Email already exists";

    res.status(500).json({
      status: false,
      error: err.message,
      message: errorMsg,
    });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    let { verificationtoken } = req.body;
    if (verificationtoken) {
      let addUserQuery = `UPDATE users SET verificationtoken = '' ,verified=true WHERE verificationtoken = '${verificationtoken}'`;
      let updateQueryResult = await pool.query(addUserQuery);

      if (updateQueryResult.rowCount > 0) {
        res.json({ message: "Email Approved" });
      } else {
        return res.status(422).json({ error: "Try again session expired" });
      }
    }
  } catch (err) {
    console.log(err);
  }
};

sendUserVerificationRequest = (email) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        console.log(err);
      }

      const verifyUserToken = buffer.toString("hex");
      let addUserQuery = `UPDATE users SET verificationtoken = '${verifyUserToken}' WHERE email = '${email}'`;
      let updateQueryResult = await pool.query(addUserQuery);

      const link = ` ${frontEndUrl}/verify-user/${verifyUserToken}`;

      const mailOptions = {
        to: email,
        from: `${hostEmail}`,
        subject: "Verify Email Address",
        text:
          "Thank you for registering for the ndau Blockchain Explorer. Please verify your email to ensure you can access all the features.\n\n" +
          "Your Verification Link is: " +
          link,
      };
      console.log(link);
      await sendEmail(mailOptions);
    });
  } catch (err) {
    next(err);
    console.log(err.message);
    res.status(500).json({
      status: false,
      message: "Something went wrong please try again later",
    });
  }
};

exports.PGloginUser = async (req, res, next) => {
  try {
    let { email, password, rememberMe } = req.body;
    let searchUserQuery = `
    SELECT * FROM users where "email" = '${email}'`;
    let user = await pool.query(searchUserQuery);
    const foundUser = user.rows[0];

    if (foundUser) {
      let isMatch = await bcrypt.compare(password, foundUser.password);

      console.log(foundUser.user_id, "foundUser.user_id");
      if (isMatch) {
        const token = jwt.sign(
          {
            user_id: foundUser.user_id,
            email: foundUser.email,
          },
          tokenKey,
          { expiresIn: rememberMe ? "1d" : "1h" }
        );

        res.status(200).json({
          status: true,
          user_token: token,
          verify: foundUser.verified,
          email: user.email,
        });
      } else {
        res.status(400).json({
          status: false,
          message: "No Match",
        });
      }
    } else {
      res.status(400).json({
        status: false,
        message: "Invalid",
      });
    }
  } catch (err) {
    next(err);
    console.log(err.message);
    res.status(500).json({
      status: false,
      message: "Something went wrong please try again later",
    });
  }
};

exports.PGforgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    let userSearchQuery = `SELECT * FROM users WHERE "email"= '${email}' `;
    let foundUserArr = await pool.query(userSearchQuery);
    let foundUser = foundUserArr.rows[0];
    console.log(foundUser, "foundUser");
    if (foundUser) {
      crypto.randomBytes(32, async (err, buffer) => {
        if (err) {
          console.log(err);
        }

        const token = buffer.toString("hex");

        console.log(token, "crypto token");
        let addUserQuery = `UPDATE users SET token = '${token}' WHERE email = '${email}'`;

        let updateQueryResult = await pool.query(addUserQuery);
        console.log(updateQueryResult, "updateQueryResult");

        const link = ` ${frontEndUrl}/change-password/${token}`;
        const mailOptions = {
          to: email,
          from: `${hostEmail}`,
          subject: "Reset Password",
          text:
            "Please follow the link given below to reset your password.\n\n" +
            "Your Password Reset Link is: " +
            link,
        };
        await sendEmail(mailOptions);
        res.status(200).json({
          status: true,
          message: "Reset Password Link Sent",
        });
      });
    } else {
      res.status(400).json({
        status: false,
        message: "Email Does not Exist",
      });
    }
  } catch (err) {
    next(err);
    console.log(err.message);
    res.status(500).json({
      status: false,
      message: "Something went wrong please try again later",
    });
  }
};

exports.PGresetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;
    const token = req.headers.authorization;
    console.log(token, "token");

    const searchUserByTokenQuery = `SELECT * FROM users WHERE token = '${token}'`;
    let foundUserArr = await pool.query(searchUserByTokenQuery);

    let foundUser = foundUserArr.rows[0];

    console.log(foundUser, "foundUser");

    // let user = await Users.findById({ _id: user_id });
    if (foundUser) {
      const encryptedPassword = await bcrypt.hash(new_password, 10);
      const updateUserPasswordQuery = `UPDATE users SET password ='${encryptedPassword}', token = ${null} WHERE user_id = '${
        foundUser.user_id
      }'`;

      let updateQueryResult = await pool.query(updateUserPasswordQuery);
      console.log(updateQueryResult, "updateQueryResult");

      res.status(200).json({
        status: true,
        message: "Password Changed Successfully..!",
      });
    } else {
      res.status(400).json({
        status: false,
        message: "User Does not Exist..",
      });
    }
  } catch (err) {
    next(err);
    console.log(err.message);
    res.status(500).json({
      status: false,
      message: "Something went wrong please try again later",
    });
  }
};

exports.createBookmark = async (req, res, next) => {
  console.log(req.user_id, "req.user_id");

  try {
    const addBookmarkedAccountQuery = `    
    --create bookmark_type_enum if not exist firstime
  DO $$ BEGIN
    CREATE TYPE bookmark_type_enum AS ENUM ('account', 'transaction', 'block');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

--create table
    CREATE TABLE IF NOT EXISTS "bookmarks" (
	    "bookmark_ID" SERIAL PRIMARY KEY,
      "bookmark_value" TEXT NOT NULL,
      "bookmark_type" bookmark_type_enum NOT NULL,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(user_id)   
      );`;

    const bookmarkTable = await pool.query(addBookmarkedAccountQuery);
    const user_ID = req.user_id;
    const bookmark_value = req.body.bookmark_value;
    const bookmark_type = req.body.bookmark_type;
    const getBookmarks = `
    SELECT * FROM bookmarks WHERE user_id = '${user_ID}' and bookmark_value='${bookmark_value}'`;
    let user_bookmarks_get = await pool.query(getBookmarks);
    let user_bookmarks = user_bookmarks_get.rows;
    //     CREATE TYPE IF NOT EXISTS bookmark_type_enum AS ENUM ('account', 'transaction', 'block');
    if (user_bookmarks.length > 0) {
      const getBookmarks = `
  Delete  FROM bookmarks WHERE user_id = '${user_ID}' and bookmark_value='${bookmark_value}'`;
      let user_bookmarks_get = await pool.query(getBookmarks);
      let user_bookmarks = user_bookmarks_get.rows;
      res.status(201).json({
        status: false,
        message: "Bookmark deleted  successfully",
      });
    } else {
      // return "here";

      if (bookmarkTable) {
        const addBookmarkQuery = `INSERT INTO bookmarks(user_ID, bookmark_value, bookmark_type) VALUES($1,$2,$3)`;
        const values = [`${user_ID}`, `${bookmark_value}`, `${bookmark_type}`];

        const addBookmark = await pool.query(addBookmarkQuery, values);
        if (addBookmark) {
          res.status(201).json({
            status: true,
            message: "Bookmark created successfully",
          });
        } else {
          res.status(400).json({
            status: false,
            message: "Error while creating bookmark",
          });
        }
      } else {
        res.status(500).json({
          status: false,
          message: "Table not created",
        });
      }
    }
  } catch (e) {
    console.log(e, "bookmark error");
    res.status(500).json({
      status: false,
      message: "Something went wrong",
    });
  }
};

exports.getBookmarks = async (req, res, next) => {
  console.log(req.user_id, "req.user_id");

  try {
    const user_ID = req.user_id;
    const getBookmarksQuery = `
    SELECT * FROM bookmarks WHERE user_id = '${user_ID}'`;
    let user_bookmarks_obj = await pool.query(getBookmarksQuery);
    let user_bookmarks = user_bookmarks_obj.rows;

    res.status(200).json({ user_bookmarks });
  } catch (e) {
    console.log(e, "getBookmarksError");
  }
};

exports.getSpecificBookmarks = async (req, res, next) => {
  console.log(req.user_id, "req.user_id");
  const user_ID = req.user_id;
  const bookmark_value = req.body.bookmark_value;

  try {
    console.log(bookmark_value, user_ID, "test");
    const getBookmarks = `
    SELECT * FROM bookmarks WHERE user_id = '${user_ID}' and bookmark_value='${bookmark_value}'`;
    let user_bookmarks_get = await pool.query(getBookmarks);
    let user_bookmarks = user_bookmarks_get.rows;

    console.log(user_bookmarks, "awais");
    if (user_bookmarks.length > 0) {
      res.status(200).json({ status: true });
    } else {
      res.status(200).json({ status: false });
    }
  } catch (e) {
    console.log(e, "getBookmarksError");
  }
};
deleteSingleUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Users.findOneAndDelete({ _id: id });
    res.status(200).json({
      status: true,
      message: "User Deleted Successfully",
    });
  } catch (err) {
    next(err);
    console.log(err.message);
    res.status(500).json({
      status: false,
      message: "Something went wrong please try again later",
    });
  }
};
