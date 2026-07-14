const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

const client = twilio(
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
);

app.post('/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;

    console.log(`Sending SMS to ${to}: ${message}`);

    const result = await client.messages.create({
      body: message,
      from: '+14129462781',
      to: to
    });

    console.log(`SMS sent successfully: ${result.sid}`);
    res.json({ success: true, sid: result.sid });
  } catch (error) {
    console.error('SMS Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

app.listen(3000, () => {
  console.log('SMS server running on port 3000');
});
