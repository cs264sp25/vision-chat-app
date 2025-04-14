import { useMutationMessages } from "@/hooks/use-mutation-messages";
import { useMutationFiles } from "@/hooks/use-mutation-files";
import { useQueryFile } from "@/hooks/use-query-file";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Paperclip, Send, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const DEBUG = false;

interface MessageInputProps {
  chatId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ chatId }) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { add: createMessage } = useMutationMessages(chatId);
  const { add: createFile, delete: deleteFile } = useMutationFiles();

  // Auto-focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle textarea auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const maxHeight = window.innerHeight / 3; // 1/3 of viewport height
      const scrollHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${scrollHeight}px`;
    };

    adjustHeight();

    // Add resize event listener to handle viewport changes
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, [text]); // Re-run when text changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() === "" && attachments.length === 0) return;

    await createMessage({
      role: "user",
      content: text,
      attachments,
    });
    setText("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const fileId = await createFile({
        file,
        name: file.name,
      });

      if (fileId) {
        setAttachments(prev => [...prev, fileId]);
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = async (index: number) => {
    const fileId = attachments[index];
    
    // First remove from UI
    setAttachments(prev => prev.filter((_, i) => i !== index));
    
    // Then delete from storage
    try {
      await deleteFile(fileId);
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Don't show error to user since the file is already removed from UI
    }
  };

  // Render attachment preview
  const AttachmentPreview = ({ fileId }: { fileId: string }) => {
    const { data: file, loading } = useQueryFile(fileId);
    
    if (loading || !file) return null;

    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="relative group">
            <div className="bg-muted rounded-md px-3 py-1.5 text-sm flex items-center gap-2 cursor-pointer">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="max-w-[100px] truncate">{file.name || 'Image'}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const index = attachments.indexOf(fileId);
                  if (index !== -1) removeAttachment(index);
                }}
                className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 p-0">
          <img
            src={file.url}
            alt={file.name || 'Image preview'}
            className="rounded-md max-w-full h-auto"
            loading="lazy"
          />
          {file.name && (
            <div className="p-2 text-xs text-muted-foreground truncate">
              {file.name}
            </div>
          )}
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative w-full bg-background p-0", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {attachments.length > 0 && (
        <div className="flex gap-2 px-4 py-2 border-t">
          {attachments.map((fileId) => (
            <AttachmentPreview key={fileId} fileId={fileId} />
          ))}
        </div>
      )}
      <div
        className={cn(
          "relative flex items-end border border-input bg-background rounded-lg",
          {
            "border-2 border-blue-500": DEBUG,
          },
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("absolute left-4 bottom-3 h-8 w-8 hover:bg-accent", {
            "border-2 border-green-500": DEBUG,
          })}
          onClick={handleFileUpload}
        >
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          className={cn(
            "w-full overflow-y-auto",
            "pl-14 pr-14 py-5", // Space for icons
            "focus-visible:ring-0",
            "border-0 focus-visible:ring-offset-0 rounded-lg",
            "min-h-[60px]",
            "resize-none",
            "bg-background text-foreground",
            // Updated scrollbar classes to use theme colors
            "scrollbar-thin",
            "scrollbar-thumb-muted scrollbar-thumb-rounded-lg hover:scrollbar-thumb-muted-foreground",
            "scrollbar-track-transparent",
            {
              "border-2 border-yellow-500": DEBUG,
            },
          )}
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className={cn(
            "absolute right-4 bottom-3",
            "h-8 w-8",
            "flex items-center justify-center",
            "hover:bg-accent",
            "disabled:opacity-50",
            {
              "border-2 border-purple-500": DEBUG,
            },
          )}
          disabled={!text.trim() && attachments.length === 0}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
