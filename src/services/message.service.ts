const API_BASE_URL = 'http://localhost:5000/api';

export class MessageService {
  // Send message to database
  static async sendMessage(
    conversationId: string, 
    senderId: string, 
    content: string, 
    type: string = 'text'
  ) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          senderId,
          content,
          type,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages from database
  static async getMessages(conversationId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${conversationId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }
}
