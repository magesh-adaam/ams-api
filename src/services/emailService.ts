import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendAccessRequestEmail(details: {
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
  }) {
    try {
      const { firstName, lastName, email, roles } = details;
      
      const htmlContent = `
        <h2>New Access Credentials Request</h2>
        <p>A new user has requested access to the Asset & Facilities Management System.</p>
        <ul>
          <li><strong>First Name:</strong> ${firstName}</li>
          <li><strong>Last Name:</strong> ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Requested Roles:</strong> ${roles.join(', ')}</li>
        </ul>
        <p>Please log in to the admin dashboard to review and approve this request.</p>
      `;

      const data = await resend.emails.send({
        from: 'AMS System <onboarding@resend.dev>',
        to: 'magesharumugaraj@gmail.com',
        subject: 'New Access Credentials Request',
        html: htmlContent,
      });

      return data;
    } catch (error) {
      console.error("Error sending access request email:", error);
      throw error;
    }
  }
}
