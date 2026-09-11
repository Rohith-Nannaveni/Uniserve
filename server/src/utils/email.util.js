const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"UniServe" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully to:", to);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

const sendOTPEmail = async (to, otp) => {
  const subject = "Verify your UniServe Account";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a2a47; margin: 0; font-size: 28px;">Welcome to UniServe!</h1>
        <p style="color: #64748b; margin-top: 10px;">University Talent, Verified and Trusted.</p>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">Thank you for joining UniServe. To complete your registration and activate your account, please use the verification code below:</p>
      <div style="text-align: center; margin: 40px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #10b981; padding: 15px 30px; background: #f1fdf7; border: 2px dashed #10b981; border-radius: 8px; display: inline-block;">${otp}</span>
      </div>
      <p style="color: #ef4444; font-size: 14px; text-align: center; font-weight: 600;">This code will expire in exactly 10 minutes.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 30px; line-height: 1.6;">If you didn't create an account with us, please disregard this message.</p>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 UniServe Marketplace. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendResetOTPEmail = async (to, otp) => {
  const subject = "Reset your UniServe Password";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a2a47; margin: 0; font-size: 28px;">Password Reset Request</h1>
        <p style="color: #64748b; margin-top: 10px;">Security is our top priority at UniServe.</p>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Use the verification code below to proceed with the reset process:</p>
      <div style="text-align: center; margin: 40px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #10b981; padding: 15px 30px; background: #f1fdf7; border: 2px dashed #10b981; border-radius: 8px; display: inline-block;">${otp}</span>
      </div>
      <p style="color: #ef4444; font-size: 14px; text-align: center; font-weight: 600;">This code will expire in exactly 10 minutes.</p>
      <p style="color: #64748b; font-size: 14px; margin-top: 30px; line-height: 1.6;">If you did not request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 UniServe Marketplace. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendOrderNotification = async (to, order, isVendor = false) => {
  const subject = isVendor ? "New Order Received! - UniServe" : "Order Confirmation - UniServe";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #f1fdf7; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: #10b981; font-size: 30px;">✓</span>
        </div>
        <h1 style="color: #1a2a47; margin: 0; font-size: 24px;">${isVendor ? "You have a new order!" : "Thank you for your order!"}</h1>
      </div>
      
      <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
        <h3 style="color: #1a2a47; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Service:</td>
            <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${order.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Order ID:</td>
            <td style="padding: 8px 0; color: #1e293b; font-family: monospace; text-align: right;">${order._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Amount:</td>
            <td style="padding: 8px 0; color: #10b981; font-weight: 700; font-size: 18px; text-align: right;">₹${order.price}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Delivery Time:</td>
            <td style="padding: 8px 0; color: #1e293b; text-align: right;">${order.deliveryTime} Days</td>
          </tr>
        </table>
      </div>

      <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center;">
        ${isVendor 
          ? "Please log in to your dashboard to view the requirements and start working on the project." 
          : "The vendor has been notified and will contact you shortly through the message center."}
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}/orders" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Order in Dashboard</a>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 UniServe Marketplace. Verified University Talent.</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendOrderStatusUpdate = async (to, order, newStatus) => {
  const subject = `Order Status Updated: ${newStatus.toUpperCase()} - UniServe`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a2a47; margin: 0; font-size: 24px;">Order Status Updated</h1>
        <div style="margin-top: 15px;">
          <span style="background-color: #f1fdf7; color: #10b981; padding: 8px 20px; border-radius: 50px; font-weight: 700; font-size: 14px; text-transform: uppercase; border: 1px solid #10b981;">${newStatus}</span>
        </div>
      </div>
      
      <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">The status of your order for <b>${order.title}</b> has been updated by the vendor.</p>

      <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Order ID:</td>
            <td style="padding: 8px 0; color: #1e293b; font-family: monospace; text-align: right;">${order._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Current Status:</td>
            <td style="padding: 8px 0; color: #10b981; font-weight: 700; text-align: right; text-transform: capitalize;">${newStatus}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}/orders" style="background-color: #1a2a47; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Check Progress in Dashboard</a>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 UniServe Marketplace. Secure University Collaboration.</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendOrderCancelNotification = async (to, order, cancelledByBuyer = true) => {
  const subject = `Order Cancelled: ${order.title} - UniServe`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #fef2f2; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: #ef4444; font-size: 30px;">✕</span>
        </div>
        <h1 style="color: #1a2a47; margin: 0; font-size: 24px;">Order Cancelled</h1>
      </div>
      
      <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">The order for <b>${order.title}</b> has been cancelled by the ${cancelledByBuyer ? "buyer" : "vendor"}.</p>

      <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Order ID:</td>
            <td style="padding: 8px 0; color: #1e293b; font-family: monospace; text-align: right;">${order._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Refund Status:</td>
            <td style="padding: 8px 0; color: #ef4444; font-weight: 700; text-align: right;">Pending Review</td>
          </tr>
        </table>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center;">
        If this was a paid order, our team will review the cancellation and process any applicable refunds according to our policy.
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}/orders" style="background-color: #1a2a47; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View in Dashboard</a>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 UniServe Marketplace. Secure University Collaboration.</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendDisputeNotification = async (to, order, reason, raisedByBuyer = true) => {
  const subject = `DISPUTE RAISED: Order for ${order.title} - UniServe`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #fef2f2; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: #ef4444; font-size: 30px;">!</span>
        </div>
        <h1 style="color: #1a2a47; margin: 0; font-size: 24px;">Dispute Raised</h1>
      </div>
      
      <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">A dispute has been raised regarding the order for <b>${order.title}</b> by the ${raisedByBuyer ? "buyer" : "vendor"}.</p>

      <div style="background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <h4 style="color: #c53030; margin-top: 0;">Dispute Reason:</h4>
        <p style="color: #2d3748; margin-bottom: 0;">${reason}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Order ID:</td>
            <td style="padding: 8px 0; color: #1e293b; font-family: monospace; text-align: right;">${order._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Status:</td>
            <td style="padding: 8px 0; color: #ef4444; font-weight: 700; text-align: right;">DISPUTED</td>
          </tr>
        </table>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        You have the opportunity to respond to this dispute and provide your own proof. An admin will review all evidence from both parties before making a final decision.
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}/orders" style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Respond to Dispute</a>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 UniServe Marketplace. Dispute Resolution Center.</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendDisputeResponseNotification = async (to, order, response) => {
  const subject = `Dispute Response Submitted: ${order.title} - UniServe`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #ebf8ff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: #3182ce; font-size: 30px;">i</span>
        </div>
        <h1 style="color: #1a2a47; margin: 0; font-size: 24px;">Dispute Response</h1>
      </div>
      
      <p style="color: #334155; font-size: 16px; line-height: 1.6; text-align: center;">A response has been submitted to your dispute for <b>${order.title}</b>.</p>

      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <h4 style="color: #0369a1; margin-top: 0;">Counter Response:</h4>
        <p style="color: #1e293b; margin-bottom: 0;">${response}</p>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        The admin has been notified and will now review the evidence from both sides to resolve this dispute.
      </p>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 UniServe Marketplace. Dispute Resolution Center.</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendServiceStatusUpdate = async (to, service, approved = true) => {
  const subject = approved ? "Service Approved - UniServe" : "Service Request Update - UniServe";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: ${approved ? "#f1fdf7" : "#fef2f2"}; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: ${approved ? "#10b981" : "#ef4444"}; font-size: 30px;">${approved ? "✓" : "!"}</span>
        </div>
        <h1 style="color: #1a2a47; margin: 0; font-size: 24px;">${approved ? "Service Approved!" : "Service Update"}</h1>
      </div>
      
      <p style="color: #334155; font-size: 16px; line-height: 1.6;">
        Your service: <b>${service.title}</b> ${approved ? "is now live on the marketplace." : "was not approved at this time."}
      </p>

      ${approved ? `
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}/service/${service._id}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Live Service</a>
      </div>` : `
      <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
        If you have questions about the rejection, please review our terms and conditions or contact support for more details.
      </p>`}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 UniServe Marketplace. Secure University Collaboration.</p>
      </div>
    </div>
  `;
  return sendEmail(to, subject, html);
};

module.exports = { sendOTPEmail, sendResetOTPEmail, sendOrderNotification, sendOrderStatusUpdate, sendOrderCancelNotification, sendEmail, sendDisputeNotification, sendDisputeResponseNotification, sendServiceStatusUpdate };
