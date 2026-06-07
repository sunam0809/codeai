import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  useListMessages,
  getListMessagesQueryKey,
  useDeleteProject,
  Message
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { ChatMessage } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowLeft, Trash2, Settings, Loader2, Terminal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Chat() {
  const { id } = useParams();
  const projectId = Number(id);
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });
  
  const { data: messages, isLoading: messagesLoading } = useListMessages(projectId, {
    query: { enabled: !!projectId, queryKey: getListMessagesQueryKey(projectId) }
  });
  
  const deleteProject = useDeleteProject();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleDelete = () => {
    deleteProject.mutate({ id: projectId }, {
      onSuccess: () => {
        toast({ title: "Project deleted" });
        setLocation("/projects");
      }
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    
    const userMessageContent = input.trim();
    setInput("");
    
    // Add optimistic user message to cache
    const tempUserMessage: Message = {
      id: Date.now(),
      projectId,
      role: "user",
      content: userMessageContent,
      createdAt: new Date().toISOString()
    };
    
    queryClient.setQueryData(getListMessagesQueryKey(projectId), (old: Message[] | undefined) => {
      return [...(old || []), tempUserMessage];
    });
    
    setIsStreaming(true);
    setStreamingContent("");
    
    try {
      const response = await fetch(`/api/projects/${projectId}/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: userMessageContent })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          // Simple parsing: just append raw text for now (in real app, parse SSE format properly)
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              } catch(e) {}
            }
          }
        }
      }
    } catch (err: any) {
      toast({
        title: "Error sending message",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      // Refetch messages to get the real saved messages
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(projectId) });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (projectLoading) {
    return (
      <AppLayout activePath={`/projects/${projectId}`}>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout activePath="/projects">
        <div className="flex flex-col h-full items-center justify-center gap-4">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <Button onClick={() => setLocation("/projects")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePath={`/projects/${projectId}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card flex-shrink-0 z-10">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" className="md:hidden flex-shrink-0" onClick={() => setLocation("/projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="truncate">
              <h2 className="font-mono text-sm font-semibold truncate flex items-center gap-2">
                <span className="text-primary">{project.name}</span>
              </h2>
              {project.description && (
                <p className="text-xs text-muted-foreground truncate">{project.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-border bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the project and all its messages. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-background p-0 scroll-smooth">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end pb-4">
            {messagesLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground mt-20">
                <Terminal className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium text-foreground mb-1">Session Initialized</p>
                <p className="text-sm max-w-md">I'm ready to write code, review architecture, or help debug. What are we building?</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {messages?.map(message => (
                  <ChatMessage key={message.id} message={message} username={user?.username || "User"} />
                ))}
                
                {isStreaming && streamingContent && (
                  <ChatMessage 
                    message={{
                      id: -1,
                      projectId,
                      role: "assistant",
                      content: streamingContent,
                      createdAt: new Date().toISOString()
                    }} 
                    username={user?.username || "User"} 
                  />
                )}
                
                {isStreaming && !streamingContent && (
                  <div className="flex gap-4 py-6 px-4 bg-muted/30 border-y border-border/50">
                    <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center mt-1">
                      <Terminal className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5 h-8">
                      <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-background border-t border-border p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-4 top-4 text-muted-foreground/50 pointer-events-none">
              <Terminal className="h-4 w-4" />
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for code..."
              className="min-h-[60px] pl-10 pr-14 py-3.5 resize-none bg-card border-border focus-visible:ring-primary/50 font-mono text-sm shadow-sm"
              rows={1}

            />
            <Button
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!input.trim() || isStreaming}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-center">
            <span className="text-[10px] text-muted-foreground font-mono">
              CodeAI Session • Press <kbd className="bg-muted px-1 py-0.5 rounded border border-border">Enter</kbd> to execute
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
