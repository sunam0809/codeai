import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Message } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download, Terminal } from "lucide-react";
import { useDownloadFile } from "@workspace/api-client-react";

interface ChatMessageProps {
  message: Message;
  username: string;
}

export const ChatMessage = memo(function ChatMessage({ message, username }: ChatMessageProps) {
  const isUser = message.role === "user";
  const downloadFile = useDownloadFile();

  const handleDownload = async (content: string, language: string) => {
    try {
      const ext = language || "txt";
      const filename = `code-snippet-${message.id || Date.now()}.${ext}`;
      
      const response = await downloadFile.mutateAsync({
        data: { content, filename, extension: ext }
      });
      
      const blob = new Blob([response as any], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className={`flex gap-4 py-6 px-4 ${isUser ? "" : "bg-muted/30 border-y border-border/50"}`}>
      <Avatar className="h-8 w-8 mt-1 border border-border">
        {isUser ? (
          <AvatarFallback className="bg-primary/10 text-primary font-mono text-xs">
            {username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-card text-foreground">
            <Terminal className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{isUser ? username : "CodeAI"}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 font-sans">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code(props) {
                const { children, className } = props;
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const isInline = !match;

                if (!isInline) {
                  return (
                    <div className="relative group rounded-md overflow-hidden my-4 border border-border bg-background">
                      <div className="flex items-center justify-between px-4 py-1.5 bg-muted border-b border-border">
                        <span className="text-xs font-mono text-muted-foreground">{language || "text"}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDownload(String(children).replace(/\n$/, ''), language)}
                          title="Download as file"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                      <SyntaxHighlighter
                        PreTag="div"
                        children={String(children).replace(/\n$/, '')}
                        language={language}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          background: 'transparent',
                          padding: '1rem',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <code {...rest} className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-[0.9em]">
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
});
