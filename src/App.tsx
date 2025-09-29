import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

interface Chat {
  id: number;
  created_at: string;
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const socket = io(API_URL);

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // load awal
  useEffect(() => {
    axios.get<Chat[]>(`${API_URL}/chats`).then((res) => setChats(res.data));
  }, []);

  // socket listener
  useEffect(() => {
    socket.on("chat:new", (chat: Chat) => {
      setChats((prev) => [...prev, chat]);
    });

    socket.on("chat:update", (chat: Chat) => {
      setChats((prev) => prev.map((c) => (c.id === chat.id ? chat : c)));
    });

    socket.on("chat:delete", ({ id }: { id: number }) => {
      setChats((prev) => prev.filter((c) => c.id !== id));
    });

    return () => {
      socket.off("chat:new");
      socket.off("chat:update");
      socket.off("chat:delete");
    };
  }, []);

  // submit pesan baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await axios.post(`${API_URL}/chats`, { message: newMessage });
    setNewMessage("");
  };

  // update pesan
  const handleUpdate = async (id: number) => {
    const text = prompt("Update message:");
    if (text) {
      await axios.put(`${API_URL}/chats/${id}`, { message: text });
    }
  };

  // delete pesan
  const handleDelete = async (id: number) => {
    await axios.delete(`${API_URL}/chats/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Chat Demo (Express + Supabase + Socket.IO)</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          className="border px-2 py-1 rounded"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
          Send
        </button>
      </form>

      <ul className="w-full max-w-md space-y-2">
        {chats && chats.map((chat) => (
          <li
            key={chat.id}
            className="p-3 rounded bg-white shadow flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{chat.message}</p>
              <span className="text-xs text-gray-500">
                {new Date(chat.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate(chat.id)}
                className="px-2 py-1 text-sm bg-yellow-400 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(chat.id)}
                className="px-2 py-1 text-sm bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
