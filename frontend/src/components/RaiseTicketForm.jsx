import React, { useState } from "react";
import axios from "axios";

const RaiseTicketForm = () => {
  const [query, setQuery] = useState("");
  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState("");

  const submitTicket = async () => {
    if (!query.trim()) return setError("Please enter your issue.");
    try {
      const res = await axios.post("http://localhost:5000/ticket", {
        user_query: query,
      });
      setTicketInfo(res.data);
      setError("");
    } catch {
      setError("Could not create ticket.");
    }
  };

  return (
    <div className="p-4 border rounded bg-white max-w-md mx-auto">
      {!ticketInfo ? (
        <>
          <h2 className="text-lg font-semibold mb-2">Raise a Ticket</h2>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Describe your issue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            className="bg-blue-500 text-white mt-2 px-3 py-1 rounded"
            onClick={submitTicket}
          >
            Submit
          </button>
        </>
      ) : (
        <div className="text-center">
          <p className="text-green-600 font-semibold">Ticket created!</p>
          <p>Your ticket number:</p>
          <p className="font-mono bg-gray-100 text-lg p-2 rounded mt-1">
            {ticketInfo.ticket_number}
          </p>
        </div>
      )}
    </div>
  );
};

export default RaiseTicketForm;
