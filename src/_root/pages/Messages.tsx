import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useGetConversations, useGetMessages, useGetUsers } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";
import { socket } from "@/lib/socket";
import { multiFormatDateString } from "@/lib/utils";
import Loader from "@/components/shared/Loader";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

const ConversationList = () => {
  const { data, isLoading } = useGetConversations();
  const { user } = useUserContext();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { data: usersData } = useGetUsers();
  const [showNewChat, setShowNewChat] = useState(false);

  const conversations = data?.documents ?? [];

  return (
    <aside className="w-full md:w-80 shrink-0 flex flex-col border-r border-[var(--color-glass-border)] h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-glass-border)]">
        <h2 className="h3-bold text-light-1">Messages</h2>
        <button
          onClick={() => setShowNewChat((v) => !v)}
          className="text-primary-500 hover:text-primary-400 transition"
          title="New conversation"
        >
          <img src="/assets/icons/edit.svg" alt="new" width={20} height={20} />
        </button>
      </div>

      {showNewChat && usersData?.documents && (
        <div className="border-b border-[var(--color-glass-border)] px-3 py-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
          <p className="tiny-medium text-light-4 px-2 py-1">Start a conversation</p>
          {usersData.documents
            .filter((u: any) => u.id !== user.id)
            .map((u: any) => (
              <button
                key={u.id}
                onClick={() => { navigate(`/messages/new/${u.id}`); setShowNewChat(false); }}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-dark-4/60 transition"
              >
                <img src={u.imageUrl || "/assets/icons/profile-placeholder.svg"} className="w-8 h-8 rounded-full" alt={u.name} />
                <div className="text-left">
                  <p className="small-semibold text-light-1">{u.name}</p>
                  <p className="tiny-medium text-light-4">@{u.username}</p>
                </div>
              </button>
            ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex-center p-8"><Loader /></div>
        ) : conversations.length === 0 ? (
          <p className="text-light-4 small-regular text-center p-8">No conversations yet.</p>
        ) : (
          conversations.map((conv: any) => (
            <Link
              key={conv.id}
              to={`/messages/${conv.id}`}
              className={`flex items-center gap-3 px-5 py-4 hover:bg-dark-4/40 transition border-b border-[var(--color-glass-border)]/30 ${
                conv.id === conversationId ? "bg-dark-4/60" : ""
              }`}
            >
              <img
                src={conv.other?.imageUrl || "/assets/icons/profile-placeholder.svg"}
                className="w-10 h-10 rounded-full ring-2 ring-primary-500/20 shrink-0"
                alt={conv.other?.name}
              />
              <div className="flex-1 min-w-0">
                <p className="small-semibold text-light-1 truncate">{conv.other?.name}</p>
                <p className="tiny-medium text-light-4 truncate">
                  {conv.lastMessage?.body ?? "No messages yet"}
                </p>
              </div>
              {conv.lastMessage && (
                <span className="tiny-medium text-light-4 shrink-0">
                  {multiFormatDateString(conv.lastMessage.createdAt)}
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </aside>
  );
};

const ChatWindow = () => {
  const { conversationId, newUserId } = useParams<{ conversationId?: string; newUserId?: string }>();
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  const { data: messagesData, isLoading } = useGetMessages(conversationId || "");
  const { data: usersData } = useGetUsers();

  const targetUser = newUserId
    ? usersData?.documents?.find((u: any) => u.id === newUserId)
    : null;

  useEffect(() => {
    if (messagesData?.documents) {
      setLocalMessages(messagesData.documents);
    }
  }, [messagesData]);

  useEffect(() => {
    socket.connect();

    socket.on("message_received", (msg: any) => {
      if (msg.conversationId === conversationId) {
        setLocalMessages((prev) => [...prev, msg]);
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_CONVERSATIONS] });
    });

    socket.on("message_sent", (msg: any) => {
      if (!conversationId) {
        navigate(`/messages/${msg.conversationId}`, { replace: true });
      }
      setLocalMessages((prev) => {
        const exists = prev.find((m) => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_CONVERSATIONS] });
    });

    return () => {
      socket.off("message_received");
      socket.off("message_sent");
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const getRecipientId = () => {
    if (newUserId) return newUserId;
    const other = localMessages.find((m: any) => m.sender?.id !== user.id);
    return other?.sender?.id ?? chatPartner?.id;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const recipientId = getRecipientId();
    if (!input.trim() || !recipientId) return;
    socket.emit("send_message", { recipientId, body: input.trim() });
    setInput("");
  };

  if (!conversationId && !newUserId) {
    return (
      <div className="flex-1 flex-center text-light-4 small-regular hidden md:flex">
        Select a conversation or start a new one
      </div>
    );
  }

  const chatPartner = targetUser || (() => {
    const msgs = localMessages;
    const other = msgs.find((m: any) => m.sender?.id !== user.id);
    return other?.sender;
  })();

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Header */}
      {chatPartner && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-glass-border)]">
          <img
            src={chatPartner.imageUrl || "/assets/icons/profile-placeholder.svg"}
            className="w-9 h-9 rounded-full ring-2 ring-primary-500/30"
            alt={chatPartner.name}
          />
          <div>
            <p className="small-semibold text-light-1">{chatPartner.name}</p>
            <p className="tiny-medium text-light-4">@{chatPartner.username}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex-center flex-1"><Loader /></div>
        ) : localMessages.length === 0 ? (
          <p className="text-light-4 small-regular text-center mt-10">
            {newUserId ? `Start a conversation with ${targetUser?.name}` : "No messages yet"}
          </p>
        ) : (
          localMessages.map((msg: any) => {
            const isOwn = msg.sender?.id === user.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2`}>
                {!isOwn && (
                  <img
                    src={msg.sender?.imageUrl || "/assets/icons/profile-placeholder.svg"}
                    className="w-7 h-7 rounded-full shrink-0 mt-1"
                    alt={msg.sender?.name}
                  />
                )}
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwn
                    ? "bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-br-sm"
                    : "bg-dark-4 text-light-1 rounded-bl-sm"
                }`}>
                  <p className="small-regular">{msg.body}</p>
                  <p className={`tiny-medium mt-1 ${isOwn ? "text-white/60" : "text-light-4"}`}>
                    {multiFormatDateString(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3 px-5 py-4 border-t border-[var(--color-glass-border)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 bg-dark-4 border border-[var(--color-glass-border)] rounded-full px-5 py-2.5 text-light-1 small-regular placeholder:text-light-4 focus:outline-none focus:border-primary-500/50 transition"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center disabled:opacity-40 transition hover:opacity-90"
        >
          <img src="/assets/icons/share.svg" alt="send" width={16} height={16} className="invert" />
        </button>
      </form>
    </div>
  );
};

const Messages = () => {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <ConversationList />
      <ChatWindow />
    </div>
  );
};

export default Messages;
