import { useMutationMessage } from "@/hooks/use-mutation-message";
import { cn } from "@/lib/utils";
import { MessageType } from "@/types/message";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Check,
  Copy,
  Edit,
  FileIcon,
  ImageIcon,
  RefreshCw,
  ScanEye,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutosizeTextarea } from "@/components/ui/autoresize-textarea";
import Markdown from "@/components/markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const DEBUG = false;

interface MessageProps {
  message: MessageType;
}

interface AttachmentsProps {
  attachments: NonNullable<MessageType['attachments']>;
}

const Attachments: React.FC<AttachmentsProps> = ({ attachments }) => {
  if (!attachments?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((file, index) => {
        const isImage = file.type === 'image';
        
        const attachmentContent = (
          <div 
            key={index}
            className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer"
            onClick={() => window.open(file.url, '_blank')}
          >
            {isImage ? (
              <ImageIcon className="h-4 w-4 text-primary" />
            ) : (
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-foreground">
              {file.name || `File ${index + 1}`}
            </span>
          </div>
        );

        if (isImage) {
          return (
            <HoverCard key={index}>
              <HoverCardTrigger asChild>
                {attachmentContent}
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <img 
                  src={file.url} 
                  alt={file.name || 'Attachment preview'} 
                  className="rounded-md max-w-full h-auto"
                />
              </HoverCardContent>
            </HoverCard>
          );
        }

        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                {attachmentContent}
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to {file.type === 'image' ? 'view' : 'download'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

const Message: React.FC<MessageProps> = ({ message }) => {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [messageContent, setMessageContent] = useState(message.content);
  const { edit } = useMutationMessage(message._id);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = async () => {
    await edit({ content: messageContent });
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    toast.error("Regenerate message not implemented");
  };

  useEffect(() => {
    setMessageContent(message.content);
  }, [message.content]);

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2 group hover:bg-accent/50 transition-colors",
        {
          "border-2 border-red-500": DEBUG,
        },
      )}
      role="listitem"
    >
      <div
        className={cn("flex-shrink-0", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <Avatar className="w-9 h-9">
          {isAssistant ? (
            <AvatarFallback className="bg-primary/10">
              <ScanEye className="w-5 h-5 text-primary" />
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-secondary">
              <User2 className="w-5 h-5 text-secondary-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      <div
        className={cn("flex-1 min-w-0", {
          "border-2 border-green-500": DEBUG,
        })}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {isAssistant ? "Assistant" : "You"}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(message._creationTime).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 transition-colors", {
                "text-primary": copied,
              })}
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>

            {isAssistant ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRegenerate}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            ) : !isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsEditing(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className={cn("mt-0.5 text-foreground", {
            "border-2 border-yellow-500": DEBUG,
          })}
        >
          {isEditing ? (
            <div className="mt-2">
              <AutosizeTextarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="resize-y w-full h-full"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button size={"sm"} variant={"secondary"} onClick={handleEdit}>
                  Save
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Markdown content={messageContent} className="prose-base" />
              {message.attachments && <Attachments attachments={message.attachments} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
