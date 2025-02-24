import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./index.css";

function App() {
  const [clientId, setClientId] = useState("");
  const socketRef = useRef(null);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [roomMessages, setRoomMessages] = useState([]);
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:3000");

      socketRef.current.on("connect", () => {
        console.log("Connected:", socketRef.current?.id);
        setClientId(socketRef.current?.id || "");

        // ✅ Server ko batana ki ye user ka ID kya hai
        socketRef.current.emit("set-user-id", socketRef.current.id);
      });

      // ✅ Private message listener
      socketRef.current.on("receive-private-message", ({ message, senderId }) => {
        console.log(`💌 Private message from ${senderId}: ${message}`);
        alert(`Private message from ${senderId}: ${message}`);
      });

      // ✅ Room message listener
      socketRef.current.on("receive-room-message", ({ message, sender }) => {
        console.log(`📩 Room Message from ${sender}: ${message}`);
        setRoomMessages((prev) => [...prev, `${sender}: ${message}`]);
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  function sendPrivateMessage(receiverSocketId, message) {
    if (!receiverSocketId || !message) {
      alert("Receiver ID aur Message required hai!");
      return;
    }

    console.log(`📩 Sending Private Message to ${receiverSocketId}: ${message}`);
    socketRef.current?.emit("private-message", { message, receiverSocketId });
  }

  function handleRoomMessage(e) {
    e.preventDefault();
  
    if (!message) {
      alert("Message required hai!");
      return;
    }

    if (userId) {
      // ✅ Private message send karna
      sendPrivateMessage(userId, message);
    } else if (roomId) {
      // ✅ Room message send karna
      socketRef.current?.emit("send-room-message", { roomId, message, userId: clientId });
    } else {
      alert("User ID ya Room ID required hai!");
      return;
    }

    setMessage(""); // ✅ Input clear
  }

  function handleRoomSubmit(e) {
    e.preventDefault();
    if (!roomId) return;

    console.log(`Joining Room: ${roomId}`);
    socketRef.current?.emit("room-join", roomId);
   }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-center">
          Your Socket ID: <span className="text-blue-600">{clientId}</span>
        </h2>

        {/* Room Join Form */}
        <form onSubmit={handleRoomSubmit} className="mb-4">
          <label className="block text-sm font-medium">Room ID</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter Room ID"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
            >
              Join
            </button>
          </div>
        </form>

        {/* Message Form */}
        <form onSubmit={handleRoomMessage} className="mb-4">
          <label className="block text-sm font-medium">User ID (Private Message)</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 border rounded-lg mb-2"
            placeholder="Enter User ID (optional)"
          />

          <label className="block text-sm font-medium">Message</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
            >
              Send
            </button>
          </div>
        </form>

        {/* Message Display */}
        <div className="border-t pt-3">
          <h3 className="text-sm font-medium mb-2">Room Messages:</h3>
          <ul className="space-y-1">
            {roomMessages.length > 0 ? (
              roomMessages.map((msg, index) => {
                const [sender, text] = msg.split(": ");
                return (
                  <li
                    key={index}
                    className="text-gray-700 text-sm bg-gray-200 p-2 rounded-lg"
                  >
                    <strong className="text-blue-500">{sender}</strong>: {text}
                  </li>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">No messages yet</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
