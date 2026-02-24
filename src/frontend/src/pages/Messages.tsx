import { useState } from 'react';
import { useGetCallerUserProfile, useGetMessagesForEmployee, useSendMessage } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Message } from '../backend';

export default function Messages() {
  const { data: userProfile } = useGetCallerUserProfile();
  const employeeId = userProfile?.employeeId || null;
  const { data: messages = [], isLoading } = useGetMessagesForEmployee(employeeId);
  const sendMessage = useSendMessage();
  
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage || !employeeId) return;

    const newMessage: Message = {
      messageId: `msg_${Date.now()}`,
      senderId: employeeId,
      recipientId: selectedMessage.senderId,
      content: replyText.trim(),
      timestamp: BigInt(Date.now() * 1000000),
      messageType: selectedMessage.messageType,
      taskId: selectedMessage.taskId,
      relatedTaskId: selectedMessage.relatedTaskId,
    };

    try {
      await sendMessage.mutateAsync(newMessage);
      toast.success('Reply sent');
      setReplyText('');
      setSelectedMessage(null);
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">View and reply to messages</p>
      </div>

      {selectedMessage ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Message Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>
                Back to Inbox
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  From: {selectedMessage.senderId}
                </div>
                <Badge variant={selectedMessage.messageType === 'taskRelated' ? 'default' : 'secondary'}>
                  {selectedMessage.messageType === 'taskRelated' ? 'Task Related' : 'General'}
                </Badge>
              </div>
              <p className="text-foreground">{selectedMessage.content}</p>
              <div className="text-xs text-muted-foreground mt-3">
                {new Date(Number(selectedMessage.timestamp) / 1000000).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reply</label>
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={handleSendReply}
                disabled={!replyText.trim() || sendMessage.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Inbox ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages</p>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className="p-4 rounded-lg border bg-card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          From: {message.senderId}
                        </div>
                        <p className="text-foreground line-clamp-2">{message.content}</p>
                      </div>
                      <Badge variant={message.messageType === 'taskRelated' ? 'default' : 'secondary'}>
                        {message.messageType === 'taskRelated' ? 'Task' : 'General'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(Number(message.timestamp) / 1000000).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
