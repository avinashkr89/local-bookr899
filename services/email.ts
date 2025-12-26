
const EMAILJS_SERVICE_ID = 'service_c7sqdyi'; 
const EMAILJS_TEMPLATE_ID = 'template_zcfde6k'; 
const EMAILJS_PUBLIC_KEY = '5PTTqutLi34fENx2k'; 

interface EmailParams {
  to_name: string;
  to_email: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  booking_location: string;
  amount: string;
}

export const sendProviderAssignmentEmail = async (params: EmailParams) => {
  try {
    console.log(`Attempting to send email to ${params.to_email} via EmailJS...`);
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_name: params.to_name,
          to_email: params.to_email, // Configure your EmailJS template "To" field to use {{to_email}}
          provider_name: params.to_name, // Duplicate for safety if template uses provider_name
          customer_name: params.customer_name,
          customer_phone: params.customer_phone,
          service_name: params.service_name,
          booking_date: params.booking_date,
          booking_time: params.booking_time,
          booking_location: params.booking_location,
          budget: params.amount,
          message: `New Job Assigned: ${params.service_name} at ${params.booking_location}`
        },
      }),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via EmailJS');
    } else {
      const errorText = await response.text();
      console.warn('⚠️ EmailJS Warning: Failed to send.', errorText);
    }
  } catch (error) {
    console.error('❌ EmailJS Network Error:', error);
  }
};
