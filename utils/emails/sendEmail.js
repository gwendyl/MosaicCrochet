const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
//const path = require("path");

const sendTemplateEmail = async (email, template_id, link) => {

  const msg = {
    to: email, // Change to your recipient
    from: process.env.VERIFIEDFROMEMAIL, // Change to your verified sender
    template_id: template_id,
    dynamic_template_data: {
        Weblink: link,
    },
  }
    
   sgMail
     .send(msg)
     .then(() => {
     })
     .catch((error) => {
       console.error(error)
     })
  

};

module.exports = sendTemplateEmail;
