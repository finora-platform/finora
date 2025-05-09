import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAuth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from 'utils/supabaseClient';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
    // Get authorized user from Clerk
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
    }

    // Parse request body
    const body = await req.json();
    const { recipients, subject, htmlContent, advisorId, tradeDetails } = body;

    if (!recipients || !subject || !htmlContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders() });
    }

    // Get supabase client
    const supabase = await createClerkSupabaseClient({ user: { id: userId } });

    // Fetch advisor information
    const { data: advisorData, error: advisorError } = await supabase
      .from('users') // Assuming you have a users table with advisor info
      .select('email, full_name')
      .eq('id', advisorId || userId)
      .single();

    if (advisorError) {
      console.error('Error fetching advisor information:', advisorError);
      return NextResponse.json({ error: 'Failed to fetch advisor information' }, { status: 500, headers: corsHeaders() });
    }

    // Send emails to all recipients
    const emailPromises = recipients.map(async (recipient: { email: string, name: string }) => {
      if (!recipient.email) return null;

      const { data, error } = await resend.emails.send({
        from: `${advisorData.full_name || 'Trading Advisor'} <${process.env.EMAIL_FROM || 'advisor@yourdomain.com'}>`,
        to: recipient.email,
        subject: subject,
        html: htmlContent,
        reply_to: advisorData.email || process.env.EMAIL_REPLY_TO,
      });

      if (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        return { email: recipient.email, success: false, error };
      }

      // Log email sent in database (optional)
      const { error: logError } = await supabase
        .from('email_logs') // You'll need to create this table
        .insert({
          advisor_id: advisorId || userId,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          subject: subject,
          content_type: 'trade_advice',
          trade_details: tradeDetails,
          sent_at: new Date().toISOString(),
          status: 'sent',
          message_id: data?.id,
        });

      if (logError) {
        console.error('Error logging email:', logError);
      }

      return { email: recipient.email, success: true, id: data?.id };
    });

    const results = await Promise.all(emailPromises);

    const sent = results.filter(r => r && r.success).length;
    const failed = results.filter(r => r && !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${sent} emails${failed > 0 ? `, ${failed} failed` : ''}`,
      results: results.filter(Boolean),
    }, { headers: corsHeaders() });

  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json({
      error: 'Failed to send emails',
      message: error.message,
    }, { status: 500, headers: corsHeaders() });
  }
}
