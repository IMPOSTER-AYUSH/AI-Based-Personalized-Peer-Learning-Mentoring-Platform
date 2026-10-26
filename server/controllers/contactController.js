const Contact = require('../models/Contact');

exports.submitContact = async (req, res, next) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({ message: 'Message sent successfully!', contact });
  } catch (error) {
    next(error);
  }
};
