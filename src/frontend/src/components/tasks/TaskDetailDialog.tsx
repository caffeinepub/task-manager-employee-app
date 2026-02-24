import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUpdateTaskStatus, useAddTaskNote, useAddTaskImage } from '../../hooks/useQueries';
import { TaskStatus, type Task } from '../../backend';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { ExternalBlob } from '../../backend';

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const [newNote, setNewNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(task.status);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const updateStatus = useUpdateTaskStatus();
  const addNote = useAddTaskNote();
  const addImage = useAddTaskImage();

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.pending:
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Pending</Badge>;
      case TaskStatus.inProgress:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">In Progress</Badge>;
      case TaskStatus.completed:
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">Completed</Badge>;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const status = newStatus as TaskStatus;
    setSelectedStatus(status);
    try {
      await updateStatus.mutateAsync({ taskId: task.id, status });
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update status');
      setSelectedStatus(task.status);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await addNote.mutateAsync({ taskId: task.id, note: newNote.trim() });
      toast.success('Note added');
      setNewNote('');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        console.log(`Upload progress: ${percentage}%`);
      });
      
      await addImage.mutateAsync({ taskId: task.id, image: blob });
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskStatus.pending}>Pending</SelectItem>
                <SelectItem value={TaskStatus.inProgress}>In Progress</SelectItem>
                <SelectItem value={TaskStatus.completed}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-foreground">{task.description}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Notes ({task.notes.length})</h3>
            <div className="space-y-3 mb-4">
              {task.notes.map((note, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-foreground">{note}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleAddNote} 
                disabled={!newNote.trim() || addNote.isPending}
                size="sm"
              >
                {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Note
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Images ({task.images.length})</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {task.images.map((image, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={image.getDirectURL()} 
                    alt={`Task image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage}
              />
              <Button 
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploadingImage}
                size="sm"
                variant="outline"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
