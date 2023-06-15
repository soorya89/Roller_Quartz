const dotenv = require("dotenv");
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

const twilioFunctions = {
  generateOtp: async (phonenumber) => {
    client,
      client.verify.v2
        .services("VAf913db46a166f7e828f161f6acc5e7e6")
        .verifications.create({ to: `+91${phonenumber}`, channel: "sms" })
        .then((service) => console.log("VAf913db46a166f7e828f161f6acc5e7e6"));
  },
};

module.exports = twilioFunctions;
