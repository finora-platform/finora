export async function singleMessagetoSingleUser(to:string, body:string) {
    try {
      const response = await fetch('http://localhost:4000/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, body })
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Message sent successfully:', data);
      } else {
        console.error('Failed to send message:', data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }