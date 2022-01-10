// Import express into our project
const express = require("express");

// Import multer
const multer = require("multer");

// Creating an instance of express function
const app = express();

// Import dotenv
require("dotenv").config();

// The port we want our project to run on
const port = process.env.PORT || 3000;


// Express should add our path -middleware
app.use(express.static("public"));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Nodemailer
const nodemailer = require("nodemailer");

// Googleapis
const { google } = require("googleapis");
// Pull out OAuth from googleapis
const OAuth2 = google.auth.OAuth2;

// Multer file storage
const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./attachments");
  },
  filename: function (req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});

// Middleware to get attachments
const attachmentUpload = multer({
  storage: Storage,
}).single("attachment");

const createTransporter = async () => {
  //Connect to the oauth playground
  const oauth2Client = new OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  // Add the refresh token to the Oauth2 connection
  oauth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject("Failed to create access token : error message(" + err);
      }
      resolve(token);
    });
  });

  // Authenticating and creating a method to send a mail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.SENDER_EMAIL,
      accessToken,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
  });

  return transporter;
};

// Root directory -homepage
app.get("/", (req, res) => {
  res.sendFile("/index.html");
});

app.get("/home", (req, res) => {
  res.sendFile(__dirname+"/public/profi.html");
});

// Route to handle sending mails
app.post("/send_email", (req, res) => {
  attachmentUpload(req, res, async function (error) {
    if (error) {
      return res.send("Error uploading file");
    } else {
      // Pulling out the form data from the request body


      const recipient = req.body.email;
      const mailSubject = "I've received your Mail! Thank you!";
      const mailBody = `Hey,
      
      How's it going? I've received your Mail! Thank you for Contacting me.
      If any, I'll let you know ASAP.

      Have a nice day. aloha:)

      ~ Sree
      
      Spread love
      /////////////////////////////////////////////////////
      Your Message is:
      ////////////////////////////////////////////////////

      Subject: ${req.body.subject}
      
      Message: ${req.body.message}
      
      Attachment:`;

      const attachmentPath = req.file?.path;

      // Mail options
      let mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: recipient,
        subject: mailSubject,
        text: mailBody,
        attachments: [
          {
            path: attachmentPath,
          },
        ],
      };

      try {
        // Get response from the createTransport
        let emailTransporter = await createTransporter();

        // Send email
        emailTransporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            // failed block
            console.log(error);
          } else {
            // Success block
            console.log("Email sent: " + info.response);
            return res.redirect("/success.html");
          }
        });
      } catch (error) {
        return console.log(error);
      }
    }
  });
});

// Express allows us to listen to the port and trigger a console.log() when you visit the port
const server = app.listen(port,listening)
function listening (){
  console.log(`server running on ${port}`)
}